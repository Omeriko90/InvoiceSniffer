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
]

const BODY_AMOUNT_RE = /(?:total|amount due|grand total|subtotal|balance due)[:\s]*[$£€]?\s*([\d,]+\.?\d{0,2})/i
const INVOICE_NUMBER_RE = /(?:invoice|inv|order|receipt)[#\s:no.]*([A-Z0-9-]{3,20})/i
const AMOUNT_RE = /[$£€]\s*[\d,]+\.\d{2}/

const INVOICE_ATTACHMENT_TYPES = ["application/pdf", "image/png", "image/jpeg"]
const INVOICE_ATTACHMENT_NAMES = /(?:invoice|receipt|bill|statement)/i

export function detectInvoiceCandidate(
  subject: string,
  snippet: string,
  attachments: { filename: string; mimeType: string }[]
): DetectionResult {
  const signals: InvoiceSignal[] = []
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

  // PDF attachment (+25)
  const hasPdf = attachments.some((a) => a.mimeType === "application/pdf")
  signals.push({ name: "pdf_attachment", score: 25, matched: hasPdf })

  // Attachment named like an invoice (+15)
  const hasInvoiceAttachment = attachments.some(
    (a) =>
      INVOICE_ATTACHMENT_NAMES.test(a.filename) &&
      INVOICE_ATTACHMENT_TYPES.includes(a.mimeType)
  )
  signals.push({ name: "invoice_attachment_name", score: 15, matched: hasInvoiceAttachment })

  // Body keywords (+10)
  const bodyKeywords = ["invoice", "receipt", "bill", "payment", "amount due", "total due"]
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

const AMOUNT_EXTRACT_RE = /(?:total|amount due|grand total|subtotal)[:\s]*[$£€]?\s*([\d,]+\.?\d{0,2})/i
const TAX_RE = /(?:tax|vat|gst)[:\s]*[$£€]?\s*([\d,]+\.?\d{0,2})/i
const INV_NUM_RE = /(?:invoice|inv|order)[#\s:no.]*([A-Z0-9-]{3,20})/i
const DATE_RE = /(?:invoice date|date|issued)[:\s]*([\w]+ \d{1,2},?\s*\d{4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i
const DUE_DATE_RE = /(?:due date|payment due|due by)[:\s]*([\w]+ \d{1,2},?\s*\d{4}|\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i

export function extractInvoiceMetadata(
  senderEmail: string,
  senderName: string | null,
  subject: string,
  body: string
): ExtractedInvoice {
  const text = `${subject}\n${body}`
  let fieldsFound = 0

  // Vendor from sender
  const vendorName = senderName ?? inferVendorFromEmail(senderEmail)
  const vendorNormalized = normalizeVendor(vendorName)

  // Invoice number
  const invNumMatch = INV_NUM_RE.exec(text)
  const invoiceNumber = invNumMatch?.[1] ?? null
  if (invoiceNumber) fieldsFound++

  // Total amount
  const amountMatch = AMOUNT_EXTRACT_RE.exec(text)
  const totalAmount = amountMatch ? parseFloat(amountMatch[1].replace(/,/g, "")) : null
  if (totalAmount) fieldsFound++

  // Currency
  const currency = detectCurrency(text)

  // Tax
  const taxMatch = TAX_RE.exec(text)
  const taxAmount = taxMatch ? parseFloat(taxMatch[1].replace(/,/g, "")) : null

  // Dates
  const dateMatch = DATE_RE.exec(text)
  const invoiceDate = dateMatch ? parseDate(dateMatch[1]) : null
  if (invoiceDate) fieldsFound++

  const dueDateMatch = DUE_DATE_RE.exec(text)
  const dueDate = dueDateMatch ? parseDate(dueDateMatch[1]) : null

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

function detectCurrency(text: string): string {
  if (text.includes("£")) return "GBP"
  if (text.includes("€")) return "EUR"
  return "USD"
}

function parseDate(raw: string): Date | null {
  const d = new Date(raw)
  return isNaN(d.getTime()) ? null : d
}
