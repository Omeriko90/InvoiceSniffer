// Minimal typings for bidi-js (ships no declarations). We only use embedding-level
// computation + logical→visual reordering to lay out RTL (Hebrew) receipt text.
declare module "bidi-js" {
  export type EmbeddingLevels = {
    levels: Uint8Array
    paragraphs: Array<{ start: number; end: number; level: number }>
  }

  export type Bidi = {
    getEmbeddingLevels(text: string, explicitDirection?: "ltr" | "rtl" | "auto"): EmbeddingLevels
    getReorderedString(text: string, embeddingLevels: EmbeddingLevels, start?: number, end?: number): string
    getReorderedIndices(text: string, embeddingLevels: EmbeddingLevels, start?: number, end?: number): number[]
  }

  export default function bidiFactory(): Bidi
}
