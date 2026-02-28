/**
 * LLM Provider constants — model lists, fidelity scoring, defaults
 */

// ---------------------------------------------------------------------------
// Provider types
// ---------------------------------------------------------------------------

export type LLMProvider = "google" | "openrouter";

export interface LLMModelConfig {
  provider: LLMProvider;
  model: string;
  apiKey?: string;
}

// ---------------------------------------------------------------------------
// Default configuration
// ---------------------------------------------------------------------------

export const DEFAULT_PROVIDER: LLMProvider = "google";
export const DEFAULT_MODEL = "gemini-2.0-flash";
export const DEFAULT_OPENROUTER_MODEL = "google/gemini-2.0-flash";

// ---------------------------------------------------------------------------
// Google Gemini models (direct API)
// ---------------------------------------------------------------------------

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  contextWindow: number;
  freePerDay?: string; // e.g. "1500 req/day"
}

export const GEMINI_MODELS: ModelInfo[] = [
  {
    id: "gemini-2.5-pro-preview-06-05",
    name: "Gemini 2.5 Pro",
    description: "Most capable model — reasoning, analysis, long-form",
    contextWindow: 1_000_000,
    freePerDay: "25 req/day",
  },
  {
    id: "gemini-2.5-flash-preview-05-20",
    name: "Gemini 2.5 Flash",
    description: "Fast + capable — great for reports",
    contextWindow: 1_000_000,
    freePerDay: "500 req/day",
  },
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    description: "Fastest Gemini — ideal for chat & quick analysis",
    contextWindow: 1_000_000,
    freePerDay: "1500 req/day",
  },
  {
    id: "gemini-2.0-flash-lite",
    name: "Gemini 2.0 Flash Lite",
    description: "Ultra-fast for simple tasks — cheapest option",
    contextWindow: 1_000_000,
    freePerDay: "1500 req/day",
  },
];

// ---------------------------------------------------------------------------
// Model fidelity scoring (for astrology report quality)
// ---------------------------------------------------------------------------

export type FidelityTier = "best" | "good" | "fair" | "low";

export interface ModelFidelity {
  score: number;
  tier: FidelityTier;
}

/** Known model fidelity — higher score = better astrology report quality */
export const MODEL_FIDELITY: Record<string, ModelFidelity> = {
  // Google direct models
  "gemini-2.5-pro-preview-06-05": { score: 97, tier: "best" },
  "gemini-2.5-flash-preview-05-20": { score: 90, tier: "good" },
  "gemini-2.0-flash": { score: 82, tier: "good" },
  "gemini-2.0-flash-lite": { score: 65, tier: "fair" },

  // OpenRouter format
  "google/gemini-2.5-pro-preview": { score: 97, tier: "best" },
  "google/gemini-2.5-flash-preview": { score: 90, tier: "good" },
  "google/gemini-2.0-flash": { score: 82, tier: "good" },
  "anthropic/claude-sonnet-4-5": { score: 95, tier: "best" },
  "anthropic/claude-sonnet-4": { score: 93, tier: "best" },
  "anthropic/claude-3.5-sonnet": { score: 88, tier: "good" },
  "openai/gpt-4o": { score: 90, tier: "good" },
  "openai/gpt-4o-mini": { score: 72, tier: "fair" },
  "x-ai/grok-4": { score: 92, tier: "best" },
  "meta-llama/llama-4-maverick": { score: 78, tier: "fair" },
  "deepseek/deepseek-r1": { score: 85, tier: "good" },
};

/**
 * Get fidelity score for a model ID.
 * Tries exact match, then partial match, then pattern-based inference.
 */
export function getModelFidelity(modelId: string): ModelFidelity {
  // Exact match
  if (MODEL_FIDELITY[modelId]) return MODEL_FIDELITY[modelId];

  // Partial match (e.g. "gemini-2.5-pro" in full model name)
  const lower = modelId.toLowerCase();
  for (const [key, value] of Object.entries(MODEL_FIDELITY)) {
    if (lower.includes(key.split("/").pop()!.toLowerCase())) return value;
  }

  // Pattern-based inference
  if (lower.includes("pro") || lower.includes("sonnet")) return { score: 88, tier: "good" };
  if (lower.includes("flash") || lower.includes("mini")) return { score: 70, tier: "fair" };
  if (lower.includes("haiku") || lower.includes("lite")) return { score: 60, tier: "fair" };

  return { score: 65, tier: "fair" };
}

// ---------------------------------------------------------------------------
// Recommended models for JyotishAI
// ---------------------------------------------------------------------------

export interface RecommendedModel {
  id: string;
  name: string;
  provider: LLMProvider;
  badge: string;
  fidelity: number;
}

export const RECOMMENDED_MODELS: RecommendedModel[] = [
  {
    id: "gemini-2.5-pro-preview-06-05",
    name: "Gemini 2.5 Pro",
    provider: "google",
    badge: "Best Quality",
    fidelity: 97,
  },
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "google",
    badge: "Fast + Free",
    fidelity: 82,
  },
  {
    id: "anthropic/claude-sonnet-4-5",
    name: "Claude Sonnet 4.5",
    provider: "openrouter",
    badge: "Premium",
    fidelity: 95,
  },
];

// ---------------------------------------------------------------------------
// Fidelity tier colors
// ---------------------------------------------------------------------------

export const FIDELITY_COLORS: Record<FidelityTier, string> = {
  best: "text-green-400 bg-green-500/20",
  good: "text-blue-400 bg-blue-500/20",
  fair: "text-yellow-400 bg-yellow-500/20",
  low: "text-red-400 bg-red-500/20",
};
