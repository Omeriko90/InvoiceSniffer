import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib"
import { format as formatDate } from "date-fns"

// Renders a "body-only" invoice — one that arrived as email HTML with no PDF
// attachment and no downloadable receipt (e.g. Apple/Google subscription
// receipts) — into a PDF so it can be included in the merged export like any
// other invoice document.
//
// Deliberately lightweight: pdf-lib text layout, no headless browser. The goal
// is a legible document of record (vendor, amount, date, invoice #, plus the
// email's text content), not a pixel copy of the Gmail render. If exact visual
// fidelity is ever required we can swap in a real HTML renderer behind this
// same signature.

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

// pdf-lib's StandardFonts use WinAnsi encoding and THROW on any character they
// can't encode (e.g. Hebrew, emoji). We keep the meaningful ASCII/Latin content
// and map a handful of common symbols; anything else becomes a space so a
// receipt with mixed-script text never crashes the whole export.
const SYMBOL_MAP: Record<string, string> = {
  "₪": "NIS ", // ₪
  "€": "EUR ", // €
  "£": "GBP ", // £
  "‘": "'",
  "’": "'",
  "“": '"',
  "”": '"',
  "–": "-", // en dash
  "—": "-", // em dash
  "•": "*", // bullet
  " ": " ", // nbsp
  "…": "...",
}

function sanitize(input: string): string {
  let out = ""
  for (const ch of input) {
    if (ch in SYMBOL_MAP) {
      out += SYMBOL_MAP[ch]
      continue
    }
    const code = ch.codePointAt(0) ?? 0
    // Printable ASCII + Latin-1 supplement (covers WinAnsi's common range).
    // Tab/newline are handled by the caller before this runs.
    out += code >= 0x20 && code <= 0xff ? ch : " "
  }
  return out
}

// Break a single (already-sanitized) line into pieces that each fit CONTENT_WIDTH,
// splitting on spaces and hard-breaking any word longer than the content width.
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

  text(value: string, font: PDFFont, size: number, color = INK) {
    for (const wrapped of wrapLine(value, font, size)) {
      const lineHeight = size * LINE_GAP
      this.ensure(lineHeight)
      this.y -= lineHeight
      this.page.drawText(wrapped, { x: MARGIN, y: this.y, size, font, color })
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
  const regular = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)

  const cursor = new Cursor(doc)

  cursor.text(sanitize(meta.vendorName || "Invoice"), bold, TITLE_SIZE)
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
    cursor.text(`${label}:  ${sanitize(value)}`, regular, LABEL_SIZE, MUTED)
  }

  cursor.rule()
  cursor.text("Email content", bold, LABEL_SIZE)
  cursor.gap(4)

  // Preserve paragraph breaks from the source; collapse runs of blank lines so
  // a marketing footer full of spacing doesn't balloon the page count.
  const normalized = bodyText.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n")
  const lines = normalized.split("\n")
  let blankRun = 0
  for (const raw of lines) {
    const clean = sanitize(raw).replace(/\t/g, "    ").trimEnd()
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
