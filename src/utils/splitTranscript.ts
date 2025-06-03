/**
 * Represents a chunk of text with metadata
 */
export interface TranscriptChunk {
  content: string;
  index: number;
  wordCount: number;
  startWord: number;
  endWord: number;
}

/**
 * Represents a failed chunk processing attempt
 */
export interface FailedChunk {
  index: number;
  reason: string;
  attempts: number;
  startWord: number;
  endWord: number;
}

/**
 * Splits a transcript into chunks based on word count
 * @param transcript The full transcript text to split
 * @param maxWords Maximum number of words per chunk (default: 800)
 * @returns Array of TranscriptChunk objects
 */
export function splitTranscriptIntoChunks(
  transcript: string,
  maxWords: number = 800
): TranscriptChunk[] {
  // Split into words and filter out empty strings
  const words = transcript.split(/\s+/).filter(word => word.length > 0);
  const chunks: TranscriptChunk[] = [];

  for (let i = 0; i < words.length; i += maxWords) {
    const startWord = i;
    const endWord = Math.min(i + maxWords, words.length);
    const chunkWords = words.slice(startWord, endWord);
    
    chunks.push({
      content: chunkWords.join(' '),
      index: chunks.length,
      wordCount: chunkWords.length,
      startWord,
      endWord
    });
  }

  return chunks;
}

/**
 * Estimates the number of tokens in a text string
 * This is a rough estimate: ~4 characters per token on average
 * @param text The text to estimate tokens for
 * @returns Estimated number of tokens
 */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Validates if a chunk is within safe token limits
 * @param chunk The chunk to validate
 * @param maxTokens Maximum allowed tokens (default: 3000)
 * @returns boolean indicating if chunk is within limits
 */
export function isChunkWithinTokenLimit(
  chunk: TranscriptChunk,
  maxTokens: number = 3000
): boolean {
  return estimateTokenCount(chunk.content) <= maxTokens;
} 