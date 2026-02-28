/**
 * OpenRouter model discovery — fetches available models from the
 * OpenRouter API and provides search/filter/sort utilities.
 *
 * Used by the ModelSelector component when the user picks "OpenRouter" provider.
 */

import { getModelFidelity, type ModelFidelity } from "./constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  pricing?: {
    prompt: string;   // cost per token (string like "0.000003")
    completion: string;
  };
  top_provider?: {
    is_moderated: boolean;
  };
  architecture?: {
    modality: string;
    tokenizer: string;
    instruct_type: string;
  };
}

export interface ModelWithFidelity extends OpenRouterModel {
  fidelity: ModelFidelity;
}

// ---------------------------------------------------------------------------
// Default / fallback models (shown when API fetch fails)
// ---------------------------------------------------------------------------

export const FALLBACK_OPENROUTER_MODELS: OpenRouterModel[] = [
  { id: "google/gemini-2.0-flash", name: "Gemini 2.0 Flash", context_length: 1_000_000 },
  { id: "google/gemini-2.5-pro-preview", name: "Gemini 2.5 Pro", context_length: 1_000_000 },
  { id: "google/gemini-2.5-flash-preview", name: "Gemini 2.5 Flash", context_length: 1_000_000 },
  { id: "anthropic/claude-sonnet-4-5", name: "Claude Sonnet 4.5", context_length: 200_000 },
  { id: "anthropic/claude-sonnet-4", name: "Claude Sonnet 4", context_length: 200_000 },
  { id: "openai/gpt-4o", name: "GPT-4o", context_length: 128_000 },
  { id: "openai/gpt-4o-mini", name: "GPT-4o Mini", context_length: 128_000 },
  { id: "x-ai/grok-4", name: "Grok 4", context_length: 128_000 },
  { id: "deepseek/deepseek-r1", name: "DeepSeek R1", context_length: 64_000 },
  { id: "meta-llama/llama-4-maverick", name: "Llama 4 Maverick", context_length: 128_000 },
];

// ---------------------------------------------------------------------------
// API fetcher
// ---------------------------------------------------------------------------

/**
 * Fetch all available models from OpenRouter.
 * Returns enriched models with fidelity scoring.
 * Falls back to FALLBACK_OPENROUTER_MODELS on error.
 */
export async function getAvailableModels(): Promise<ModelWithFidelity[]> {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/models", {
      next: { revalidate: 3600 }, // Cache for 1 hour (Next.js fetch cache)
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch models: ${response.statusText}`);
    }

    const data = await response.json();
    const models: OpenRouterModel[] = data.data || [];

    // Filter to text-capable models with reasonable context windows
    const filtered = models.filter((m) => {
      // Skip image/video-only models
      if (m.architecture?.modality === "image" || m.architecture?.modality === "video") return false;
      // Skip very small context models
      if (m.context_length && m.context_length < 4096) return false;
      return true;
    });

    return enrichWithFidelity(filtered);
  } catch (error) {
    console.warn("Failed to fetch OpenRouter models, using fallback list:", error);
    return enrichWithFidelity(FALLBACK_OPENROUTER_MODELS);
  }
}

// ---------------------------------------------------------------------------
// Search and filter
// ---------------------------------------------------------------------------

/**
 * Search models by name or ID.
 */
export function searchModels(
  models: ModelWithFidelity[],
  query: string
): ModelWithFidelity[] {
  if (!query.trim()) return models;

  const q = query.toLowerCase();
  return models.filter(
    (m) =>
      m.id.toLowerCase().includes(q) ||
      m.name.toLowerCase().includes(q) ||
      m.description?.toLowerCase().includes(q)
  );
}

/**
 * Sort models by fidelity score (descending).
 */
export function sortByFidelity(models: ModelWithFidelity[]): ModelWithFidelity[] {
  return [...models].sort((a, b) => b.fidelity.score - a.fidelity.score);
}

// ---------------------------------------------------------------------------
// Internal
// ---------------------------------------------------------------------------

function enrichWithFidelity(models: OpenRouterModel[]): ModelWithFidelity[] {
  return models.map((m) => ({
    ...m,
    fidelity: getModelFidelity(m.id),
  }));
}
