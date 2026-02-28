/**
 * RAG-powered chat for birth chart queries
 * Supports Google Gemini (direct) and OpenRouter providers
 */

import { ChartData } from "../astro-client";
import { createStreamingCompletion, resolveConfig } from "../llm/provider";
import type { LLMProvider } from "../llm/constants";
import { searchReportChunks, extractDateMentions } from "./retriever";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatOptions {
  profileId: string;
  chartData: ChartData;
  query: string;
  conversationHistory: ChatMessage[];
  provider?: LLMProvider;
  model?: string;
}

/**
 * Generate chat response with RAG context
 * Returns streaming response
 */
export async function generateChatResponse(
  options: ChatOptions
): Promise<ReadableStream<Uint8Array>> {
  const { profileId, chartData, query, conversationHistory, provider, model } = options;

  // Extract date mentions for context
  // TODO: compute transit positions for extracted dates via astro-engine
  // Currently this only extracts date strings from the query text — it does
  // not call /chart/transits to get actual planetary positions for those dates.
  const dateMentions = extractDateMentions(query);

  // Retrieve relevant report chunks
  const searchResults = await searchReportChunks(profileId, query, 5);

  // Build context from search results
  const ragContext = searchResults
    .map(
      (result, idx) =>
        `[Source ${idx + 1} - Similarity: ${(result.similarity * 100).toFixed(1)}%]\n${result.content}`
    )
    .join("\n\n---\n\n");

  // Build system prompt with chart data and RAG context
  const systemPrompt = `You are an expert Vedic astrologer assistant. You have access to the birth chart data and previously generated reports for this person.

## Birth Chart Summary
- Lagna: ${chartData.lagna.sign}
- Sun: ${chartData.planets.Sun.sign} in ${chartData.planets.Sun.house}th house
- Moon: ${chartData.planets.Moon.sign} in ${chartData.planets.Moon.house}th house, ${chartData.planets.Moon.nakshatra} nakshatra
- Active Dasha: ${chartData.dashas.current.mahadasha} - ${chartData.dashas.current.antardasha}

## Retrieved Report Context
${ragContext || "No specific reports found for this query."}

${dateMentions.length > 0 ? `\n## Date Context\nUser is asking about: ${dateMentions.join(", ")}` : ""}

Answer the user's question based on:
1. The birth chart data above
2. The retrieved report excerpts
3. Your knowledge of Vedic astrology principles

If the query mentions specific dates, provide transit analysis for those dates.
Cite your sources when referencing report content.
Be conversational but accurate.`;

  const config = resolveConfig({ provider, model });

  return createStreamingCompletion(config, [
    { role: "system", content: systemPrompt },
    ...conversationHistory.map((m) => ({
      role: m.role as "system" | "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: query },
  ]);
}

/**
 * Build sources metadata from search results
 */
export function buildSourcesMetadata(searchResults: any[]): any[] {
  return searchResults.map((result) => ({
    report_id: result.report_id,
    chunk_id: result.id,
    report_type: result.metadata?.report_type,
    excerpt: result.content.slice(0, 150) + "...",
    similarity: result.similarity,
  }));
}
