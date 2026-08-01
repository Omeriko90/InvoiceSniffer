// pdf.js 5.x expects browser globals (DOMMatrix, Path2D, ImageData, …) to exist
// on globalThis. Under Node they don't, so parsing any PDF whose content stream
// touches a transform/image throws "DOMMatrix is not defined" — which
// parsePdfText swallowed as a null result, silently degrading extraction.
//
// pdf-parse already depends on @napi-rs/canvas, which ships real, spec-correct
// implementations of these classes. Wire them onto globalThis (idempotently, and
// only when missing) so pdf.js finds them. Imported for its side effect wherever
// pdf.js is used.
import { DOMMatrix, Path2D, ImageData, DOMPoint, DOMRect } from "@napi-rs/canvas"

const g = globalThis as Record<string, unknown>
const polyfills = { DOMMatrix, Path2D, ImageData, DOMPoint, DOMRect }

for (const [name, impl] of Object.entries(polyfills)) {
  if (typeof g[name] === "undefined") g[name] = impl
}
