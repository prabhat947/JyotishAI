/**
 * LLM Provider abstraction — routes requests to Google Gemini (direct)
 * or OpenRouter based on configuration.
 *
 * Both endpoints speak the OpenAI-compatible chat completions format,
 * so the streaming SSE parsing code downstream is identical.
 */

import { LLMProvider, LLMModelConfig, DEFAULT_MODEL, DEFAULT_PROVIDER } from "./constants";

// ---------------------------------------------------------------------------
// Endpoint configuration
// ---------------------------------------------------------------------------

const GOOGLE_GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// ---------------------------------------------------------------------------
// Environment keys
// ---------------------------------------------------------------------------

function getGoogleApiKey(): string {
  return process.env.GOOGLE_GENAI_API_KEY || "";
}

function getOpenRouterApiKey(): string {
  return process.env.OPENROUTER_API_KEY || "";
}

// ---------------------------------------------------------------------------
// Config resolution
// ---------------------------------------------------------------------------

/**
 * Resolve provider + model + API key from partial config.
 * Falls back to env vars and defaults.
 */
export function resolveConfig(partial?: Partial<LLMModelConfig>): LLMModelConfig {
  const provider: LLMProvider = partial?.provider || DEFAULT_PROVIDER;
  const model = partial?.model || (provider === "google" ? DEFAULT_MODEL : "google/gemini-2.0-flash");
  const apiKey =
    partial?.apiKey ||
    (provider === "google" ? getGoogleApiKey() : getOpenRouterApiKey());

  return { provider, model, apiKey };
}

/**
 * Check if the resolved config has a usable API key.
 */
export function hasApiKey(config: LLMModelConfig): boolean {
  return !!config.apiKey;
}

// ---------------------------------------------------------------------------
// Streaming completion
// ---------------------------------------------------------------------------

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/**
 * Create a streaming chat completion via the configured provider.
 * Returns the raw `ReadableStream<Uint8Array>` body — caller handles SSE parsing.
 *
 * Both Google (OpenAI-compat) and OpenRouter return the same SSE format:
 *   data: {"choices":[{"delta":{"content":"..."}}]}
 *   data: [DONE]
 */
export async function createStreamingCompletion(
  config: LLMModelConfig,
  messages: ChatMessage[]
): Promise<ReadableStream<Uint8Array>> {
  const resolved = resolveConfig(config);

  if (!resolved.apiKey) {
    throw new Error(
      `No API key configured for provider "${resolved.provider}". ` +
        (resolved.provider === "google"
          ? "Set GOOGLE_GENAI_API_KEY in environment."
          : "Set OPENROUTER_API_KEY in environment.")
    );
  }

  const { url, headers } = buildRequest(resolved);

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: resolved.model,
      messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(
      `LLM API error [${resolved.provider}/${resolved.model}]: ${response.status} ${errorText}`
    );
  }

  return response.body!;
}

/**
 * Create a non-streaming chat completion (for embeddings, simple calls).
 */
export async function createCompletion(
  config: LLMModelConfig,
  messages: ChatMessage[]
): Promise<string> {
  const resolved = resolveConfig(config);

  if (!resolved.apiKey) {
    throw new Error(`No API key configured for provider "${resolved.provider}".`);
  }

  const { url, headers } = buildRequest(resolved);

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: resolved.model,
      messages,
      stream: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => response.statusText);
    throw new Error(
      `LLM API error [${resolved.provider}/${resolved.model}]: ${response.status} ${errorText}`
    );
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function buildRequest(config: LLMModelConfig): {
  url: string;
  headers: Record<string, string>;
} {
  if (config.provider === "google") {
    return {
      url: GOOGLE_GEMINI_URL,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json",
      },
    };
  }

  // OpenRouter
  return {
    url: OPENROUTER_URL,
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "JyotishAI",
    },
  };
}
