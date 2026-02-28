/**
 * Text chunker for RAG - splits report content into overlapping chunks
 */

export interface Chunk {
  content: string;
  index: number;
  metadata?: {
    section_title?: string;
    page?: number;
    report_type?: string;
  };
}

const CHUNK_SIZE = 500; // tokens (approx 400 words)
const CHUNK_OVERLAP = 50; // tokens overlap between chunks

/**
 * Split text into overlapping chunks
 */
export function chunkText(text: string, reportType: string): Chunk[] {
  // Split by paragraphs first
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0);

  const chunks: Chunk[] = [];
  let currentChunk = "";
  let chunkIndex = 0;

  for (const paragraph of paragraphs) {
    // Rough token count (1 token ≈ 4 characters)
    const paragraphTokens = paragraph.length / 4;

    if (currentChunk.length / 4 + paragraphTokens > CHUNK_SIZE && currentChunk.length > 0) {
      // Save current chunk
      chunks.push({
        content: currentChunk.trim(),
        index: chunkIndex,
        metadata: {
          report_type: reportType,
        },
      });

      // Start new chunk with overlap
      const overlapText = currentChunk.slice(-CHUNK_OVERLAP * 4);
      currentChunk = overlapText + "\n\n" + paragraph;
      chunkIndex++;
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
    }
  }

  // Add final chunk
  if (currentChunk.trim().length > 0) {
    chunks.push({
      content: currentChunk.trim(),
      index: chunkIndex,
      metadata: {
        report_type: reportType,
      },
    });
  }

  return chunks;
}

/**
 * Extract section titles from markdown headers
 */
export function extractSectionTitle(chunkContent: string): string | undefined {
  const headerMatch = chunkContent.match(/^##?\s+(.+)$/m);
  return headerMatch ? headerMatch[1].trim() : undefined;
}
