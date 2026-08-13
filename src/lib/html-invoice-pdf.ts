import { readFileSync } from "fs"
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib"
import fontkit from "@pdf-lib/fontkit"
import bidiFactory from "bidi-js"
import { format as formatDate } from "date-fns"

// Renders a "body-only" invoice — one that arrived as email HTML with no PDF
// attachment and no downloadable receipt (e.g. Apple/Google subscription
// receipts) — into a PDF so it can be included in the merged export like any
// other invoice document.
//
// Deliberately lightweight: pdf-lib text layout, no headless browser. The goal
// is a legible document of record (vendor, amount, date, invoice #, plus the
// email's text content), not a pixel copy of the Gmail render.
//
// These receipts are typically Israeli, so the body mixes English and Hebrew.
// We embed Heebo (a Hebrew+Latin OFL font) instead of pdf-lib's WinAnsi-only
// standard fonts, and run each line through the Unicode bidi algorithm so RTL
// (Hebrew) runs are reordered logical→visual and right-aligned. Characters the
// font lacks a glyph for render as .notdef rather than throwing.

export type BodyInvoiceMeta = {
  vendorName: string | null
  invoiceNumber: string | null
  invoiceDate: Date | null
  dueDate: Date | null
  totalAmount: number
  currency: string
  taxAmount: number | null
}

const PAGE_WIDTH = 595.28 // A4 in points
const PAGE_HEIGHT = 841.89
const MARGIN = 56
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2

const TITLE_SIZE = 18
const LABEL_SIZE = 11
const BODY_SIZE = 10
const LINE_GAP = 1.35 // multiplier on font size for line height

const INK = rgb(0.1, 0.1, 0.12)
const MUTED = rgb(0.42, 0.42, 0.46)
const RULE = rgb(0.85, 0.85, 0.88)

// Load the vendored Heebo TTFs lazily and memoize. Lazy (not top-level) so that
// merely importing this module — e.g. when Next traces the dynamically-imported
// export builder into the standalone web bundle — never touches the filesystem;
// the read happens only when we actually render, which is the tsx Cloud Run Job
// / dev-inline path where the source files are present on disk.
// `new URL(..., import.meta.url)` resolves next to the compiled module in every
// runtime.
let fontCache: { regular: Buffer; bold: Buffer } | null = null
function loadFonts(): { regular: Buffer; bold: Buffer } {
  if (!fontCache) {
    fontCache = {
      regular: readFileSync(new URL("./fonts/Heebo-Regular.ttf", import.meta.url)),
      bold: readFileSync(new URL("./fonts/Heebo-Bold.ttf", import.meta.url)),
    }
  }
  return fontCache
}

const bidi = bidiFactory()

// A line reordered into visual (left-to-right draw) order, plus whether its base
// paragraph direction is RTL — which decides right- vs left-alignment.
type VisualLine = { text: string; rtl: boolean }

// Collapse the whitespace that trips up layout without touching script content:
// non-breaking spaces confuse word-splitting, and a BOM would render as .notdef.
function normalizeWhitespace(input: string): string {
  return input.replace(/[  ]/g, " ").replace(/﻿/g, "")
}

function toVisual(logical: string): VisualLine {
  const levels = bidi.getEmbeddingLevels(logical, "auto")
  const rtl = (levels.paragraphs[0]?.level ?? 0) % 2 === 1
  const text = bidi.getReorderedString(logical, levels, 0, logical.length)
  return { text, rtl }
}

// Break a logical line into pieces that each fit CONTENT_WIDTH, splitting on
// spaces and hard-breaking any single word wider than the content width. Width
// is order-independent (sum of advances), so we measure the logical form.
function wrapLine(line: string, font: PDFFont, size: number): string[] {
  if (line.trim() === "") return [""]
  const words = line.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ""

  const widthOf = (s: string) => font.widthOfTextAtSize(s, size)

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (widthOf(candidate) <= CONTENT_WIDTH) {
      current = candidate
      continue
    }
    if (current) {
      lines.push(current)
      current = ""
    }
    // Word alone still too wide → hard-break by character.
    if (widthOf(word) > CONTENT_WIDTH) {
      let chunk = ""
      for (const ch of word) {
        if (widthOf(chunk + ch) > CONTENT_WIDTH && chunk) {
          lines.push(chunk)
          chunk = ch
        } else {
          chunk += ch
        }
      }
      current = chunk
    } else {
      current = word
    }
  }
  if (current) lines.push(current)
  return lines
}

// Cursor-based writer that adds fresh pages as content overflows.
class Cursor {
  private page: PDFPage
  private y: number

  constructor(private doc: PDFDocument) {
    this.page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    this.y = PAGE_HEIGHT - MARGIN
  }

  private ensure(height: number) {
    if (this.y - height < MARGIN) {
      this.page = this.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
      this.y = PAGE_HEIGHT - MARGIN
    }
  }

  // Draw one logical line: wrap to width, then reorder each wrapped piece to
  // visual order and align by its base direction (RTL hugs the right margin).
  text(value: string, font: PDFFont, size: number, color = INK) {
    for (const piece of wrapLine(value, font, size)) {
      const { text, rtl } = toVisual(piece)
      const lineHeight = size * LINE_GAP
      this.ensure(lineHeight)
      this.y -= lineHeight
      const x = rtl ? PAGE_WIDTH - MARGIN - font.widthOfTextAtSize(text, size) : MARGIN
      this.page.drawText(text, { x, y: this.y, size, font, color })
    }
  }

  gap(amount: number) {
    this.y -= amount
  }

  rule() {
    this.ensure(8)
    this.y -= 8
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: PAGE_WIDTH - MARGIN, y: this.y },
      thickness: 0.75,
      color: RULE,
    })
    this.y -= 8
  }
}

function formatAmount(amount: number, currency: string): string {
  return `${amount.toFixed(2)} ${currency}`.trim()
}

export async function renderBodyInvoicePdf(
  bodyText: string,
  meta: BodyInvoiceMeta
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)
  const fonts = loadFonts()
  // subset: only the glyphs we actually use are embedded, keeping the PDF small.
  const regular = await doc.embedFont(fonts.regular, { subset: true })
  const bold = await doc.embedFont(fonts.bold, { subset: true })

  const cursor = new Cursor(doc)

  cursor.text(normalizeWhitespace(meta.vendorName || "Invoice"), bold, TITLE_SIZE)
  cursor.gap(6)

  const fields: Array<[string, string | null]> = [
    ["Invoice #", meta.invoiceNumber],
    ["Invoice date", meta.invoiceDate ? formatDate(meta.invoiceDate, "d MMM yyyy") : null],
    ["Due date", meta.dueDate ? formatDate(meta.dueDate, "d MMM yyyy") : null],
    ["Total", formatAmount(meta.totalAmount, meta.currency)],
    ["Tax", meta.taxAmount == null ? null : formatAmount(meta.taxAmount, meta.currency)],
  ]
  for (const [label, value] of fields) {
    if (value == null || value === "") continue
    cursor.text(`${label}:  ${normalizeWhitespace(value)}`, regular, LABEL_SIZE, MUTED)
  }

  cursor.rule()
  cursor.text("Email content", bold, LABEL_SIZE)
  cursor.gap(4)

  // Preserve paragraph breaks from the source; collapse runs of blank lines so
  // a marketing footer full of spacing doesn't balloon the page count.
  const normalized = normalizeWhitespace(bodyText).replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n")
  const lines = normalized.split("\n")
  let blankRun = 0
  for (const raw of lines) {
    const clean = raw.replace(/\t/g, "    ").trimEnd()
    if (clean.trim() === "") {
      blankRun += 1
      if (blankRun > 1) continue
      cursor.gap(BODY_SIZE * 0.6)
      continue
    }
    blankRun = 0
    cursor.text(clean, regular, BODY_SIZE)
  }

  return doc.save()
}
