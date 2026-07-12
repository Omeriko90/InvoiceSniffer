export type InvoiceSignal = {
  name: string
  score: number
  matched: boolean
}

export type DetectionResult = {
  isCandidate: boolean
  totalScore: number
  signals: InvoiceSignal[]
}

const CANDIDATE_THRESHOLD = 40

const SUBJECT_KEYWORDS = [
  "invoice", "receipt", "bill", "payment confirmation",
  "order confirmation", "your order", "statement", "charge",
  // Hebrew: invoice, receipt, tax invoice, payment confirmation/request, charge
  "חשבונית", "קבלה", "אישור תשלום", "דרישת תשלום", "חיוב",
]

const BODY_AMOUNT_RE = /(?:total|amount due|grand total|subtotal|balance due|סה"כ|סכום לתשלום|לתשלום|יתרה לתשלום)[:\s]*[$£€₪]?\s*([\d,]+\.?\d{0,2})/i
const INVOICE_NUMBER_RE = /(?:invoice|inv|order|receipt|חשבונית|קבלה|הזמנה)(?:\s*(?:מס'?|מספר))?[#\s:no.]*([A-Z0-9-]{3,20})/i
// Symbol before (e.g. $12.50) or after the amount, as ₪ commonly appears (e.g. 12.50 ₪)
const AMOUNT_RE = /[$£€₪]\s*[\d,]+\.\d{2}|[\d,]+\.\d{2}\s*₪/

const INVOICE_ATTACHMENT_TYPES = ["application/pdf", "image/png", "image/jpeg"]
const INVOICE_ATTACHMENT_NAMES = /(?:invoice|receipt|bill|statement|חשבונית|קבלה)/i

export function detectInvoiceCandidate(
  subject: string,
  snippet: string,
  attachments: { filename: string; mimeType: string }[]
): DetectionResult {
  const signals: InvoiceSignal[] = []
  subject = normalizeForExtraction(subject)
  snippet = normalizeForExtraction(snippet)
  const subjectLower = subject.toLowerCase()
  const snippetLower = snippet.toLowerCase()

  // Subject keyword match (+30)
  const subjectMatch = SUBJECT_KEYWORDS.some((kw) => subjectLower.includes(kw))
  signals.push({ name: "subject_keyword", score: 30, matched: subjectMatch })

  // Amount in body (+15)
  const amountMatch = AMOUNT_RE.test(snippet) || BODY_AMOUNT_RE.test(snippet)
  signals.push({ name: "amount_in_body", score: 15, matched: amountMatch })

  // Invoice number pattern (+10)
  const invoiceNumMatch = INVOICE_NUMBER_RE.test(subject) || INVOICE_NUMBER_RE.test(snippet)
  signals.push({ name: "invoice_number", score: 10, matched: invoiceNumMatch })

  // PDF attachment (+25) — by mime or filename; some senders mislabel
  // PDFs as application/octet-stream
  const isPdf = (a: { filename: string; mimeType: string }) =>
    a.mimeType === "application/pdf" || a.filename.toLowerCase().endsWith(".pdf")
  const hasPdf = attachments.some(isPdf)
  signals.push({ name: "pdf_attachment", score: 25, matched: hasPdf })

  // Attachment named like an invoice (+15)
  const hasInvoiceAttachment = attachments.some(
    (a) =>
      INVOICE_ATTACHMENT_NAMES.test(a.filename) &&
      (INVOICE_ATTACHMENT_TYPES.includes(a.mimeType) || isPdf(a))
  )
  signals.push({ name: "invoice_attachment_name", score: 15, matched: hasInvoiceAttachment })

  // Body keywords (+10)
  const bodyKeywords = [
    "invoice", "receipt", "bill", "payment", "amount due", "total due",
    "חשבונית", "קבלה", "לתשלום", 'סה"כ', "תשלום",
  ]
  const bodyMatch = bodyKeywords.some((kw) => snippetLower.includes(kw))
  signals.push({ name: "body_keyword", score: 10, matched: bodyMatch })

  const totalScore = signals
    .filter((s) => s.matched)
    .reduce((sum, s) => sum + s.score, 0)

  return {
    isCandidate: totalScore >= CANDIDATE_THRESHOLD,
    totalScore,
    signals,
  }
}

// ── Metadata extraction ──────────────────────────────────────────

export type ExtractedInvoice = {
  vendorName: string | null
  vendorNormalized: string | null
  invoiceNumber: string | null
  invoiceDate: Date | null
  dueDate: Date | null
  totalAmount: number | null
  currency: string
  taxAmount: number | null
  lineItems: unknown[]
  confidence: number
}

// Hebrew text from HTML/PDF uses gershayim (״) and geresh (׳) rather than
// ASCII quotes, and is often peppered with invisible RTL/LTR control marks —
// normalize so the label regexes below can match
export function normalizeForExtraction(text: string): string {
  return text
    .replace(/[״“”„]/g, '"')
    .replace(/[׳‘’]/g, "'")
    .replace(/[‎‏‪-‮⁦-⁩]/g, "")
}

const AMOUNT_EXTRACT_RE = /(?:total|amount due|grand total|subtotal|סה"כ|סכום לתשלום|לתשלום)[:\s]*(?:[$£€₪]|ש"ח|ILS|NIS)?\s*([\d,]+\.?\d{0,2})/i
// RTL PDFs often extract in visual order, putting the amount BEFORE the
// label: `₪100.00 סה"כ:` — match that shape too
const AMOUNT_BEFORE_LABEL_RE = /(?:[$£€₪]|ש"ח)?[ \t]*([\d,]+\.\d{1,2})[ \t]*(?:[$£€₪]|ש"ח)?[ \t]*:?[ \t]*(?:סה"כ|לתשלום|סכום)/
// Worst-case RTL mangling (Partner PDFs): digit groups flip around the
// decimal point and ₪ renders as '{' — 137.71 becomes `71 . 137 { סה"כ לתשלום`.
// Cents first, integer part second; reassemble as ${int}.${cents}
const FLIPPED_AMOUNT_LABEL_RE = /(\d{1,2})[ \t]*\.[ \t]*(-?\d{1,3}(?:,\d{3})*)[ \t]*\{[ \t]*סה"כ[ \t]*לתשלום/
// Any currency-marked amount (symbol before or after) — last-resort fallback.
// [ \t] (not \s) so a bare number at end-of-line can't pair with a currency
// symbol on the next line (e.g. the year of a date above `₪100.00`)
const ANY_AMOUNT_RE = /(?:[$£€₪]|ש"ח|ILS|NIS)[ \t]*([\d,]+(?:\.\d{1,2})?)|([\d,]+(?:\.\d{1,2})?)[ \t]*(?:[$£€₪]|ש"ח|ILS|NIS)/g
const TAX_RE = /(?:tax|vat|gst|מע"מ)(?:\s*\(?\d{1,2}%?\)?)?[:\s]*(?:[$£€₪]|ש"ח)?\s*([\d,]+\.?\d{0,2})/i
// captured number must contain at least one digit — otherwise the prefix
// words match inside URLs/sentences and capture letter junk
const INV_NUM_RE = /(?:invoice|inv|order|חשבונית|קבלה|הזמנה)(?:\s*(?:מס'?|מספר))?[#\s:no.]*((?=[A-Z0-9-]*\d)[A-Z0-9-]{3,20})/i
const DATE_RE = /(?:invoice date|date|issued)[:\s]*([\w]+ \d{1,2},?\s*\d{4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i
const DUE_DATE_RE = /(?:due date|payment due|due by)[:\s]*([\w]+ \d{1,2},?\s*\d{4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i
// Hebrew labels get their own regexes because Israeli documents write dates
// day-first (14/05/2026, 14.5.26), which new Date() would read month-first
const HEB_DATE_RE = /תאריך(?:\s*(?:הפקה|חשבונית|הנפקה))?[:\s]*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/
const HEB_DUE_DATE_RE = /(?:לתשלום עד|מועד(?:\s*אחרון)? לתשלום|תאריך אחרון לתשלום)[:\s]*(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4})/

export function extractInvoiceMetadata(
  senderEmail: string,
  senderName: string | null,
  subject: string,
  body: string
): ExtractedInvoice {
  const text = normalizeForExtraction(`${subject}\n${body}`)
  let fieldsFound = 0

  // Vendor from sender
  const vendorName = senderName ?? inferVendorFromEmail(senderEmail)
  const vendorNormalized = normalizeVendor(vendorName)

  // Invoice number
  const invNumMatch = INV_NUM_RE.exec(text)
  const invoiceNumber = invNumMatch?.[1] ?? null
  if (invoiceNumber) fieldsFound++

  // Total amount: flipped-RTL labeled total (most specific) > labeled total
  // > reversed-RTL labeled total > largest currency-marked amount
  let totalAmount: number | null = null
  const flipped = FLIPPED_AMOUNT_LABEL_RE.exec(text)
  if (flipped) {
    totalAmount = parseFloat(`${flipped[2].replace(/,/g, "")}.${flipped[1]}`)
  } else {
    const amountMatch = AMOUNT_EXTRACT_RE.exec(text) ?? AMOUNT_BEFORE_LABEL_RE.exec(text)
    totalAmount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, "")) : null
  }
  if (!totalAmount) totalAmount = largestCurrencyAmount(text)
  if (totalAmount) fieldsFound++

  // Currency — the flipped-RTL pattern only occurs in shekel documents
  // where ₪ was mangled into '{', so it implies ILS
  const currency = flipped ? "ILS" : detectCurrency(text)

  // Tax
  const taxMatch = TAX_RE.exec(text)
  const taxAmount = taxMatch ? parseFloat(taxMatch[1].replace(/,/g, "")) : null

  // Dates
  const dateMatch = DATE_RE.exec(text)
  let invoiceDate = dateMatch ? parseDate(dateMatch[1]) : null
  if (!invoiceDate) {
    const hebMatch = HEB_DATE_RE.exec(text)
    invoiceDate = hebMatch ? parseDayFirst(hebMatch[1]) : null
  }
  if (invoiceDate) fieldsFound++

  const dueDateMatch = DUE_DATE_RE.exec(text)
  let dueDate = dueDateMatch ? parseDate(dueDateMatch[1]) : null
  if (!dueDate) {
    const hebDueMatch = HEB_DUE_DATE_RE.exec(text)
    dueDate = hebDueMatch ? parseDayFirst(hebDueMatch[1]) : null
  }

  // Confidence: vendor always found (0.3 base) + 0.2 per additional field (max 3)
  const confidence = Math.min(0.3 + fieldsFound * 0.2, 0.9)

  return {
    vendorName,
    vendorNormalized,
    invoiceNumber,
    invoiceDate,
    dueDate,
    totalAmount,
    currency,
    taxAmount,
    lineItems: [],
    confidence,
  }
}

function inferVendorFromEmail(email: string): string {
  const domain = email.split("@")[1] ?? email
  return domain
    .replace(/\.(com|io|co|net|org|ai).*$/, "")
    .replace(/^(?:billing|no-reply|noreply|invoice|invoices|payments|hello|support)\./, "")
    .split(".")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ")
}

export function normalizeVendor(vendor: string): string {
  return vendor
    .toLowerCase()
    .replace(/\b(inc|llc|ltd|co|corp|billing|payments)\b/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function largestCurrencyAmount(text: string): number | null {
  let max: number | null = null
  for (const m of text.matchAll(ANY_AMOUNT_RE)) {
    const value = parseFloat((m[1] ?? m[2]).replace(/,/g, ""))
    if (Number.isFinite(value) && value > 0 && (max === null || value > max)) {
      max = value
    }
  }
  return max
}

function detectCurrency(text: string): string {
  if (/₪|ש"ח|\bILS\b|\bNIS\b/.test(text)) return "ILS"
  if (text.includes("£")) return "GBP"
  if (text.includes("€")) return "EUR"
  return "USD"
}

function parseDate(raw: string): Date | null {
  const d = new Date(raw)
  return isNaN(d.getTime()) ? null : d
}

// dd/mm/yyyy (also dd.mm.yy, dd-mm-yyyy) — day-first as written in Israel
function parseDayFirst(raw: string): Date | null {
  const [day, month, year] = raw.split(/[\/\-.]/).map(Number)
  if (!day || !month || month > 12 || day > 31) return null
  const fullYear = year < 100 ? 2000 + year : year
  const d = new Date(Date.UTC(fullYear, month - 1, day))
  return isNaN(d.getTime()) ? null : d
}
