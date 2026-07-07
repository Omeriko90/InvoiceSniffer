import { convert } from "html-to-text"
import { PDFParse } from "pdf-parse"

// ── Finding the receipt link in an email body ──────────────────────

// Hosts we trust enough to fetch server-side (suffix match on hostname).
// Everything else still gets its link stored, just never fetched.
const FETCH_ALLOWLIST = [
  // international billing providers
  "stripe.com",
  "paypal.com",
  "squareup.com",
  "chargebee.com",
  "recurly.com",
  "paddle.com",
  "lemonsqueezy.com",
  // Israeli invoicing services
  "greeninvoice.co.il",
  "morning.co.il",
  "icount.co.il",
  "ezcount.co.il",
  "payplus.co.il",
  "sumit.co.il",
  "invoice4u.co.il",
  "tranzila.com",
]

// Anchor text that suggests the link leads to a receipt/invoice (EN + HE).
// Hebrew stems (להורד, הורדת) deliberately cover inflections like
// להורדה/להורדת; מסמך covers "להורדת המסמך" wording (EZcount/Hyp et al.)
const LINK_TEXT_RE =
  /(?:view|download|open|get|see)[^]{0,30}?(?:receipt|invoice|bill|document)|receipt|invoice|חשבונית|קבלה|לצפייה|להורד|הורדת|מסמך|הצג/i

// URL paths that look like hosted receipts even without helpful anchor text
const LINK_HREF_RE = /receipt|invoice|billing|documents?\/|חשבונית/i

const ANCHOR_RE = /<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi

// Marketing/transactional mailers wrap links in click-tracking redirects
// (e.g. AWS SES: https://<id>.r.<region>.awstrack.me/L0/<encoded-target>/…).
// Unwrap to the embedded target so the allowlist judges the real destination —
// the tracker itself is never fetched.
export function unwrapTrackingUrl(url: string): string {
  try {
    const u = new URL(url)
    if (u.hostname.endsWith(".awstrack.me")) {
      // pathname keeps %2F escapes, so the encoded target is one segment
      const target = decodeURIComponent(u.pathname.split("/")[2] ?? "")
      if (/^https:\/\//.test(target)) return target
    }
    // Generic: a full https URL embedded url-encoded anywhere in the link
    const embedded = /https(?::|%3A)%2F%2F[^/&\s]+/i.exec(url)
    if (embedded) {
      const target = decodeURIComponent(embedded[0])
      if (/^https:\/\//.test(target)) return target
    }
  } catch {
    // fall through to the original url
  }
  return url
}

export function isAllowlistedHost(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url)
    if (protocol !== "https:") return false
    return FETCH_ALLOWLIST.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`)
    )
  } catch {
    return false
  }
}

// Public cloud object storage — acceptable as a redirect *target* only
// (never as the link we start from)
const CLOUD_STORAGE_SUFFIXES = [
  ".amazonaws.com",
  ".cloudfront.net",
  ".storage.googleapis.com",
  ".blob.core.windows.net",
]

function isCloudStorageHost(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url)
    if (protocol !== "https:") return false
    return (
      hostname === "storage.googleapis.com" ||
      CLOUD_STORAGE_SUFFIXES.some((s) => hostname.endsWith(s))
    )
  } catch {
    return false
  }
}

// Scan the HTML body for the most likely receipt link.
// Preference order: allowlisted host + matching text > matching anchor text > matching href.
export function findReceiptUrl(html: string): string | null {
  let textMatch: string | null = null
  let hrefMatch: string | null = null

  for (const m of html.matchAll(ANCHOR_RE)) {
    const href = unwrapTrackingUrl(m[1])
    if (!/^https:\/\//i.test(href)) continue
    const anchorText = m[2].replace(/<[^>]+>/g, " ")

    if (LINK_TEXT_RE.test(anchorText)) {
      if (isAllowlistedHost(href)) return href
      textMatch ??= href
    } else if (LINK_HREF_RE.test(href)) {
      hrefMatch ??= href
    }
  }

  return textMatch ?? hrefMatch
}

// ── Fetching and parsing the linked document ───────────────────────

const FETCH_TIMEOUT_MS = 10_000
const MAX_BYTES = 5 * 1024 * 1024

// Fetches an allowlisted receipt URL and returns its plain-text content
// (PDF or HTML), or null when the URL can't be fetched/parsed. The document
// is parsed in memory and never written to disk.
export async function fetchReceiptText(url: string): Promise<string | null> {
  if (!isAllowlistedHost(url)) return null

  let res: Response
  try {
    res = await fetch(url, {
      redirect: "follow",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { Accept: "application/pdf,text/html;q=0.9,*/*;q=0.5" },
    })
  } catch {
    return null
  }

  // Redirects may land on the provider's cloud storage (e.g. EZcount serves
  // PDFs from S3) — allow those, but nothing else outside the allowlist
  if (!res.ok || !(isAllowlistedHost(res.url) || isCloudStorageHost(res.url))) return null

  const contentLength = Number(res.headers.get("content-length") ?? 0)
  if (contentLength > MAX_BYTES) return null

  const buffer = Buffer.from(await res.arrayBuffer())
  if (buffer.byteLength > MAX_BYTES) return null

  const contentType = res.headers.get("content-type") ?? ""
  const isPdf =
    contentType.includes("application/pdf") ||
    buffer.subarray(0, 5).toString("latin1") === "%PDF-"

  if (isPdf) return parsePdfText(buffer)
  try {
    return convert(buffer.toString("utf8"), { wordwrap: false }) || null
  } catch {
    return null
  }
}

const PDF_PARSE_TIMEOUT_MS = 30_000

// Extract plain text from a PDF, fully in memory. Returns null on parse
// failure or timeout — some malformed PDFs make pdfjs hang indefinitely.
export async function parsePdfText(buffer: Buffer): Promise<string | null> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) })
  const timeout = new Promise<null>((resolve) =>
    setTimeout(() => resolve(null), PDF_PARSE_TIMEOUT_MS).unref?.()
  )
  try {
    const result = await Promise.race([parser.getText(), timeout])
    return result?.text || null
  } catch {
    return null
  } finally {
    parser.destroy().catch(() => {})
  }
}
