import { readFileSync } from "fs"
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib"
import fontkit from "@pdf-lib/fontkit"
import bidiFactory from "bidi-js"
import { format as formatDate } from "date-fns"
import { DOCUMENT_TYPE_LABELS, type DocumentType } from "@/lib/document-types"

// Renders a "body-only" invoice — one that arrived as email HTML with no PDF
// attachment and no downloadable receipt (e.g. Apple/Google/Manychat
// subscription receipts) — into a PDF so it can be included in the merged export
// like any other invoice document.
//
// Deliberately lightweight: pdf-lib text layout, no headless browser. Rather than
// dumping the email's raw body (which for many senders is unsanitized HTML
// markup), we render a clean, self-contained invoice document built purely from
// the fields we already extracted: vendor, document type, invoice #, dates,
// billed-to, line items, and totals. The email body is not included.
//
// These receipts are typically Israeli, so the fields mix English and Hebrew.
// We embed Heebo (a Hebrew+Latin OFL font) instead of pdf-lib's WinAnsi-only
// standard fonts, and run each line through the Unicode bidi algorithm so RTL
// (Hebrew) runs are reordered logical→visual and aligned to the right. Characters
// the font lacks a glyph for render as .notdef rather than throwing.

// One extracted line item. Mirrors the LLM extractor's lineItemSchema
// (llm-extractor.ts): description + quantity + unit price, any of which may be
// missing depending on what the source document exposed.
export type BodyLineItem = {
  description: string | null
  quantity: number | null
  price: number | null
}

export type BodyInvoiceMeta = {
  vendorName: string | null
  documentType: DocumentType
  invoiceNumber: string | null
  invoiceDate: Date | null
  dueDate: Date | null
  totalAmount: number
  currency: string
  taxAmount: number | null
  senderEmail: string
  lineItems: BodyLineItem[]
}

// Coerce the persisted lineItems JSON (Invoice.lineItems, defaulted to []) into
// typed rows. Fails open: anything malformed becomes an empty list, and rows
// with no usable content at all are dropped so they don't render as blank table
// lines. Kept here (next to BodyLineItem) so export-data can reuse it.
export function parseLineItems(raw: unknown): BodyLineItem[] {
  if (!Array.isArray(raw)) return []
  const items: BodyLineItem[] = []
  for (const entry of raw) {
    if (typeof entry !== "object" || entry === null) continue
    const e = entry as Record<string, unknown>
    const description = typeof e.description === "string" ? e.description : null
    const quantity = typeof e.quantity === "number" && Number.isFinite(e.quantity) ? e.quantity : null
    const price = typeof e.price === "number" && Number.isFinite(e.price) ? e.price : null
    if (description == null && quantity == null && price == null) continue
    items.push({ description, quantity, price })
  }
  return items
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

// Shorten a single line to fit maxWidth, appending an ellipsis when it doesn't.
// Used for table cells (descriptions), which stay one line rather than wrapping.
function truncateToWidth(text: string, font: PDFFont, size: number, maxWidth: number): string {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text
  const ellipsis = "…"
  let out = ""
  for (const ch of text) {
    if (font.widthOfTextAtSize(out + ch + ellipsis, size) > maxWidth) break
    out += ch
  }
  return out + ellipsis
}

// One column of a table row. x/width define the cell box; the text is aligned
// left or right within it (numeric columns right-align; RTL text right-aligns).
type Cell = {
  text: string
  x: number
  width: number
  align: "left" | "right"
  font: PDFFont
  size: number
  color?: ReturnType<typeof rgb>
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

  // Draw a single row of cells sharing one baseline. Each cell's text is
  // truncated to its column width, reordered to visual order for RTL scripts,
  // and anchored left or right within its box. Numeric columns pass align:"right".
  row(cells: Cell[]) {
    const size = Math.max(...cells.map((c) => c.size))
    const lineHeight = size * LINE_GAP
    this.ensure(lineHeight)
    this.y -= lineHeight
    for (const cell of cells) {
      const clipped = truncateToWidth(cell.text, cell.font, cell.size, cell.width)
      const { text } = toVisual(clipped)
      const w = cell.font.widthOfTextAtSize(text, cell.size)
      const x = cell.align === "right" ? cell.x + cell.width - w : cell.x
      this.page.drawText(text, { x, y: this.y, size: cell.size, font: cell.font, color: cell.color ?? INK })
    }
  }

  gap(amount: number) {
    this.y -= amount
  }

  rule(color = RULE) {
    this.ensure(8)
    this.y -= 8
    this.page.drawLine({
      start: { x: MARGIN, y: this.y },
      end: { x: PAGE_WIDTH - MARGIN, y: this.y },
      thickness: 0.75,
      color,
    })
    this.y -= 8
  }
}

function formatMoney(amount: number, currency: string): string {
  return `${amount.toFixed(2)} ${currency}`.trim()
}

// Quantities are usually whole numbers; show "2" not "2.00", but keep decimals
// for the occasional fractional quantity.
function formatQty(qty: number): string {
  return Number.isInteger(qty) ? String(qty) : qty.toFixed(2)
}

// Table column geometry, right-anchored so the numeric columns line up with the
// totals block below. Description takes whatever is left on the far side.
const RIGHT_EDGE = PAGE_WIDTH - MARGIN
const COL_AMOUNT = { x: RIGHT_EDGE - 85, width: 85 }
const COL_UNIT = { x: RIGHT_EDGE - 85 - 80, width: 75 }
const COL_QTY = { x: RIGHT_EDGE - 85 - 80 - 50, width: 45 }
const COL_DESC = { x: MARGIN, width: RIGHT_EDGE - 85 - 80 - 50 - MARGIN - 8 }

export async function renderBodyInvoicePdf(meta: BodyInvoiceMeta): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  doc.registerFontkit(fontkit)
  const fonts = loadFonts()
  // subset: only the glyphs we actually use are embedded, keeping the PDF small.
  const regular = await doc.embedFont(fonts.regular, { subset: true })
  const bold = await doc.embedFont(fonts.bold, { subset: true })

  const cursor = new Cursor(doc)

  // Title: vendor name, with the document type ("Invoice" / "Receipt" / "Credit
  // Note") as a subheading so the reader knows what the document is.
  cursor.text(normalizeWhitespace(meta.vendorName || "Invoice"), bold, TITLE_SIZE)
  cursor.gap(2)
  cursor.text(DOCUMENT_TYPE_LABELS[meta.documentType], regular, LABEL_SIZE, MUTED)
  cursor.gap(10)

  // Meta block: identifying fields, one per line, blanks skipped.
  const fields: Array<[string, string | null]> = [
    ["Invoice #", meta.invoiceNumber],
    ["Invoice date", meta.invoiceDate ? formatDate(meta.invoiceDate, "d MMM yyyy") : null],
    ["Due date", meta.dueDate ? formatDate(meta.dueDate, "d MMM yyyy") : null],
    ["Billed to", meta.senderEmail || null],
  ]
  for (const [label, value] of fields) {
    if (value == null || value === "") continue
    cursor.text(`${label}:  ${normalizeWhitespace(value)}`, regular, LABEL_SIZE, MUTED)
  }

  cursor.gap(6)
  cursor.rule()

  // Line-items table — only when we actually extracted items; otherwise the
  // header + totals stand on their own (decision: no raw email body fallback).
  if (meta.lineItems.length > 0) {
    cursor.gap(2)
    cursor.row([
      { text: "Description", x: COL_DESC.x, width: COL_DESC.width, align: "left", font: bold, size: BODY_SIZE, color: MUTED },
      { text: "Qty", x: COL_QTY.x, width: COL_QTY.width, align: "right", font: bold, size: BODY_SIZE, color: MUTED },
      { text: "Unit price", x: COL_UNIT.x, width: COL_UNIT.width, align: "right", font: bold, size: BODY_SIZE, color: MUTED },
      { text: "Amount", x: COL_AMOUNT.x, width: COL_AMOUNT.width, align: "right", font: bold, size: BODY_SIZE, color: MUTED },
    ])
    cursor.gap(4)

    for (const item of meta.lineItems) {
      const amount =
        item.quantity != null && item.price != null
          ? item.quantity * item.price
          : item.price
      cursor.row([
        {
          text: normalizeWhitespace(item.description || "—"),
          x: COL_DESC.x,
          width: COL_DESC.width,
          align: "left",
          font: regular,
          size: BODY_SIZE,
        },
        {
          text: item.quantity != null ? formatQty(item.quantity) : "",
          x: COL_QTY.x,
          width: COL_QTY.width,
          align: "right",
          font: regular,
          size: BODY_SIZE,
        },
        {
          text: item.price != null ? item.price.toFixed(2) : "",
          x: COL_UNIT.x,
          width: COL_UNIT.width,
          align: "right",
          font: regular,
          size: BODY_SIZE,
        },
        {
          text: amount != null ? amount.toFixed(2) : "",
          x: COL_AMOUNT.x,
          width: COL_AMOUNT.width,
          align: "right",
          font: regular,
          size: BODY_SIZE,
        },
      ])
    }

    cursor.gap(6)
    cursor.rule()
  }

  // Totals block, right-aligned under the numeric columns. Subtotal is derived
  // (total − tax) only when a tax amount is present.
  cursor.gap(4)
  const totals: Array<[string, string, boolean]> = []
  if (meta.taxAmount != null) {
    totals.push(["Subtotal", formatMoney(meta.totalAmount - meta.taxAmount, meta.currency), false])
    totals.push(["Tax", formatMoney(meta.taxAmount, meta.currency), false])
  }
  totals.push(["Total", formatMoney(meta.totalAmount, meta.currency), true])
  for (const [label, value, emphasized] of totals) {
    const font = emphasized ? bold : regular
    const size = emphasized ? LABEL_SIZE + 1 : LABEL_SIZE
    cursor.gap(emphasized ? 2 : 0)
    cursor.row([
      { text: label, x: MARGIN + 200, width: 165, align: "right", font, size, color: emphasized ? INK : MUTED },
      { text: value, x: COL_AMOUNT.x, width: COL_AMOUNT.width, align: "right", font, size },
    ])
  }

  return doc.save()
}
