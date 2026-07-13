import { lookup } from "dns/promises"
import net from "net"
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
  "invoice-one.com",
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
// (never as the link we start from). Deliberately narrow: only object-storage
// and CDN hosts, NOT the whole provider apex. `*.amazonaws.com` would also
// cover EC2 compute hosts (ec2-*.compute.amazonaws.com), letting an
// open-redirect bounce us onto an arbitrary attacker VM — so we accept S3 only.
function isCloudStorageHost(url: string): boolean {
  try {
    const { protocol, hostname } = new URL(url)
    if (protocol !== "https:") return false
    // AWS S3 (path- and virtual-hosted styles, any region) — not EC2/other AWS
    if (
      hostname === "s3.amazonaws.com" ||
      hostname.endsWith(".s3.amazonaws.com") ||
      /(^|\.)s3[.-][a-z0-9-]+\.amazonaws\.com$/.test(hostname)
    ) {
      return true
    }
    // Google Cloud Storage
    if (
      hostname === "storage.googleapis.com" ||
      hostname.endsWith(".storage.googleapis.com")
    ) {
      return true
    }
    // Azure Blob Storage + CloudFront CDN
    return (
      hostname.endsWith(".blob.core.windows.net") ||
      hostname.endsWith(".cloudfront.net")
    )
  } catch {
    return false
  }
}

// Reject addresses that aren't publicly routable — loopback, private (RFC 1918),
// link-local, CGNAT, and their IPv6 equivalents. A DNS check before connecting
// stops an allowlisted/provider hostname (or a rebinding record) from steering
// a server-side fetch at internal infrastructure.
function isPrivateAddress(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number)
    if (a === 10 || a === 127 || a === 0) return true
    if (a === 172 && b >= 16 && b <= 31) return true
    if (a === 192 && b === 168) return true
    if (a === 169 && b === 254) return true // link-local
    if (a === 100 && b >= 64 && b <= 127) return true // CGNAT
    return false
  }
  if (net.isIPv6(ip)) {
    const v = ip.toLowerCase()
    if (v === "::1" || v === "::") return true
    if (v.startsWith("fe80") || v.startsWith("fc") || v.startsWith("fd")) return true
    // IPv4-mapped (::ffff:10.0.0.1) — validate the embedded v4
    const mapped = v.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/)
    if (mapped) return isPrivateAddress(mapped[1])
    return false
  }
  return true // unparseable — treat as unsafe
}

// True only if every DNS answer for the host is publicly routable. Fails closed
// on resolution errors.
async function resolvesToPublicHost(url: string): Promise<boolean> {
  try {
    const { hostname } = new URL(url)
    const records = await lookup(hostname, { all: true })
    return records.length > 0 && records.every((r) => !isPrivateAddress(r.address))
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
const MAX_REDIRECTS = 5

// Fetches an allowlisted receipt URL and returns its plain-text content
// (PDF or HTML), or null when the URL can't be fetched/parsed. The document
// is parsed in memory and never written to disk.
export async function fetchReceiptText(url: string): Promise<string | null> {
  if (!isAllowlistedHost(url)) return null

  // Follow redirects manually so EVERY hop is re-validated, not just the final
  // landing URL. The start must be an allowlisted provider; redirects may also
  // land on the provider's cloud storage (e.g. EZcount serves PDFs from S3),
  // but nothing else. Each hop's host is also DNS-checked to reject targets
  // that resolve to internal/private IPs.
  let currentUrl = url
  let res: Response

  for (let hop = 0; ; hop++) {
    const hostOk = hop === 0 ? isAllowlistedHost(currentUrl) : (isAllowlistedHost(currentUrl) || isCloudStorageHost(currentUrl))
    if (!hostOk) return null
    if (!(await resolvesToPublicHost(currentUrl))) return null

    try {
      res = await fetch(currentUrl, {
        redirect: "manual",
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        headers: { Accept: "application/pdf,text/html;q=0.9,*/*;q=0.5" },
      })
    } catch {
      return null
    }

    // Not a redirect — this is the response we'll parse.
    if (res.status < 300 || res.status >= 400) break

    if (hop >= MAX_REDIRECTS) return null
    const location = res.headers.get("location")
    if (!location) return null
    try {
      currentUrl = new URL(location, currentUrl).toString()
    } catch {
      return null
    }
  }

  if (!res.ok) return null

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
