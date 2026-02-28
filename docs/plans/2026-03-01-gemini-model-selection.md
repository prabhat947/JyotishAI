# Gemini Switch + Multi-Provider Model Selection

**Date:** 2026-03-01
**Status:** Implemented
**Author:** Prabhat + Claude

## Problem

JyotishAI was hardcoded to use OpenRouter with Claude Sonnet 4.5 as the default LLM.
Claude API tokens are expensive for personal use, and the user already has a free Gemini API key.

## Solution

Switch the default LLM provider to **Google Gemini (direct API)** while keeping
**OpenRouter as a secondary provider** for accessing any model (Claude, GPT-4, etc.).

Adapted the **Stack-Architect model selection pattern** with provider toggle, fidelity
scoring, model discovery, and BYOK (Bring Your Own Key) support.

### Key Design Decision

Google's Gemini API offers an **OpenAI-compatible REST endpoint** at:

```
https://generativelanguage.googleapis.com/v1beta/openai/chat/completions
```

This means both providers return identical SSE streaming format:
```
data: {"choices":[{"delta":{"content":"..."}}]}
data: [DONE]
```

**Zero frontend changes needed** for streaming — we just swap the URL and auth header on the backend.

---

## Architecture

```
┌──────────────────┐     ┌──────────────────┐
│  Settings Page   │     │   Reports Page   │
│  (Full Selector) │     │ (Compact Picker) │
└────────┬─────────┘     └────────┬─────────┘
         │                         │
         ▼                         ▼
┌──────────────────────────────────────────┐
│       ModelSelector Component            │
│  ┌─────────┐  ┌────────────────────┐    │
│  │ Google  │  │   OpenRouter       │    │
│  │ (free)  │  │   (any model)      │    │
│  └─────────┘  └────────────────────┘    │
└──────────────────┬───────────────────────┘
                   │
         { provider, model }
                   │
         ┌─────────▼──────────┐
         │   API Routes       │
         │  /reports/generate │
         │  /chat             │
         └─────────┬──────────┘
                   │
         ┌─────────▼──────────┐
         │  LLM Provider      │
         │  (provider.ts)     │
         │                    │
         │  google → Gemini   │
         │  openrouter → OR   │
         └────────────────────┘
```

---

## Files Created

| File | Purpose |
|------|---------|
| `src/lib/llm/provider.ts` | Provider abstraction — routes to Google or OpenRouter |
| `src/lib/llm/constants.ts` | Types, model lists, fidelity scoring, defaults |
| `src/lib/llm/openrouter-models.ts` | OpenRouter model discovery + search/sort |
| `src/components/model-selector.tsx` | Full + compact model selection UI component |

## Files Modified

| File | Changes |
|------|---------|
| `src/lib/report-generator.ts` | Uses `createStreamingCompletion` from provider abstraction |
| `src/lib/rag/chat.ts` | Same — uses provider abstraction |
| `src/app/api/v1/reports/generate/route.ts` | Accepts `provider` param, default = gemini |
| `src/app/api/v1/chat/route.ts` | Same — accepts `provider` param |
| `src/app/(main)/settings/page.tsx` | Replaced dropdown with full ModelSelector component |
| `src/app/(main)/profile/[id]/reports/page.tsx` | Replaced Claude/Gemini toggle with compact ModelSelector |

---

## Provider Details

### Google Gemini (Default)

- **Endpoint:** `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`
- **Auth:** `Bearer ${GOOGLE_GENAI_API_KEY}`
- **Default model:** `gemini-2.0-flash`
- **Free tier:** 1500 req/day for Flash, 25 req/day for Pro
- **Streaming:** OpenAI-compatible SSE format

### OpenRouter (Secondary)

- **Endpoint:** `https://openrouter.ai/api/v1/chat/completions`
- **Auth:** `Bearer ${OPENROUTER_API_KEY}` + HTTP-Referer + X-Title headers
- **Default model:** `google/gemini-2.0-flash`
- **Pricing:** Pay-per-token via OpenRouter
- **Streaming:** OpenAI-compatible SSE format

---

## Model Fidelity Scoring

Adapted from Stack-Architect. Each model gets a quality score (0-100) and tier:

| Tier | Score | Color | Example Models |
|------|-------|-------|----------------|
| Best | 90+ | Green | Gemini 2.5 Pro, Claude 4.5, Grok 4 |
| Good | 75-89 | Blue | Gemini 2.0 Flash, GPT-4o, DeepSeek R1 |
| Fair | 60-74 | Yellow | GPT-4o Mini, Gemini Flash Lite |
| Low | <60 | Red | Small/quantized models |

Scoring logic:
1. Exact model ID match from fidelity map
2. Partial match (model name substring)
3. Pattern inference (pro→90%, flash→70%, haiku→60%)
4. Default: 65% for unknown models

---

## Settings Page Layout

The AI Model section uses the full `ModelSelector` component with:
- **Google Gemini** tab: Shows 4 Gemini models with free tier badges
- **OpenRouter** tab: Live model discovery from API, search, fidelity-sorted
- Current selection summary with fidelity badge
- Low-fidelity warning banner (<70%)

The Language section is alongside the model selector in a 2-column grid.

## Reports Page Layout

Uses the compact `ModelSelector` variant:
- Small button showing current model + fidelity badge
- Click opens a dropdown with the same provider tabs and model lists
- Loads user's preferred model from settings on mount
- Can override per-report

---

## Environment Variables

```bash
# Required — user's Gemini API key
GOOGLE_GENAI_API_KEY=AIza...

# Optional — for OpenRouter provider
OPENROUTER_API_KEY=sk-or-v1-...
```

### Dokploy Services to Update

- JyotishAI main app: `WNm21Yu1UpfmcCYwljB0Q`
- Worker: `_2XQmUK0M8F5GLJXwwdMv`

---

## User Preferences (Database)

New column added to `user_preferences` table:
- `preferred_provider` — `'google' | 'openrouter'` (default: `'google'`)

Existing column updated:
- `preferred_model` — default changed from `anthropic/claude-sonnet-4-5` to `gemini-2.0-flash`

---

## Migration from Old System

| Before | After |
|--------|-------|
| Single provider: OpenRouter | Two providers: Google (default) + OpenRouter |
| Default: `anthropic/claude-sonnet-4-5` | Default: `gemini-2.0-flash` |
| Reports page: Claude/Gemini toggle | Reports page: Compact ModelSelector |
| Settings: Simple dropdown (2 options) | Settings: Full ModelSelector with discovery |
| Chat: Hardcoded to OpenRouter | Chat: Uses selected provider |
| One env var: `OPENROUTER_API_KEY` | Two env vars: `GOOGLE_GENAI_API_KEY` + `OPENROUTER_API_KEY` |

---

## Testing

1. Set `GOOGLE_GENAI_API_KEY` in `.env.local`
2. Start dev server: `npm run dev`
3. Navigate to Settings — should show ModelSelector with Gemini models
4. Generate a report — should stream via Google Gemini API
5. Switch to OpenRouter in Settings — should show model discovery
6. Generate a report with an OpenRouter model — should work via OpenRouter
7. Check RAG chat — should use the same provider/model selection
