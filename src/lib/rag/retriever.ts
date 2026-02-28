/**
 * RAG retriever using hybrid search (vector + full-text)
 */

import { createServerClient } from "../supabase/server";
import { embedText } from "./embedder";

export interface SearchResult {
  id: string;
  content: string;
  metadata: any;
  report_id: string;
  similarity: number;
  combined_score: number;
}

/**
 * Search report chunks using hybrid vector + full-text search
 */
export async function searchReportChunks(
  profileId: string,
  query: string,
  limit: number = 10
): Promise<SearchResult[]> {
  const supabase = await createServerClient();

  // Generate query embedding
  const queryEmbedding = await embedText(query);

  // Call Supabase function for hybrid search
  const { data, error } = await supabase.rpc("search_report_chunks", {
    p_profile_id: profileId,
    p_query_embedding: queryEmbedding,
    p_query_text: query,
    p_limit: limit,
  });

  if (error) {
    console.error("Search error:", error);
    throw new Error(`Search failed: ${error.message}`);
  }

  return data || [];
}

/**
 * Extract date mentions from query for date-specific retrieval
 */
export function extractDateMentions(query: string): string[] {
  const dates: string[] = [];

  // Match patterns like "Feb 25", "February 25-28", "2026"
  const datePatterns = [
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2}(?:-\d{1,2})?\b/gi,
    /\b\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\b/gi,
    /\b\d{4}\b/g,
  ];

  for (const pattern of datePatterns) {
    const matches = query.match(pattern);
    if (matches) {
      dates.push(...matches);
    }
  }

  return dates;
}
