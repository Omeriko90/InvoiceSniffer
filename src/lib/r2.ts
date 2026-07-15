import { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

// Cloudflare R2 is S3-compatible. Export result files (CSV/XLSX/PDF) are stored
// here — the ExportJob row keeps the object key, and downloads hand out a
// short-lived presigned URL rather than proxying bytes through our server.

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const BUCKET = process.env.R2_BUCKET

let client: S3Client | null = null

function getClient(): S3Client {
  if (client) return client
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
  if (!ACCOUNT_ID || !BUCKET || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "R2 is not configured — set R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY"
    )
  }
  client = new S3Client({
    region: "auto",
    endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  })
  return client
}

// Object key for an export result. Scoped by org so a leaked/guessed key still
// can't cross tenants, and stable per job so re-download reuses the same object.
export function exportObjectKey(organizationId: string, exportJobId: string, ext: string): string {
  return `exports/${organizationId}/${exportJobId}.${ext}`
}

export async function putExportObject(
  key: string,
  body: Buffer | Uint8Array,
  contentType: string
): Promise<void> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  )
}

// Presigned GET that forces a download with the friendly filename. TTL is short
// (default 5 min) — the download route mints a fresh one on each request, so
// re-download keeps working for as long as the object itself lives.
export async function getSignedExportUrl(
  key: string,
  filename: string,
  ttlSeconds = 300
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${filename.replace(/[^\w .-]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
  })
  return getSignedUrl(getClient(), command, { expiresIn: ttlSeconds })
}

// Whether the object still exists in R2 (may have been lifecycle-expired).
export async function exportObjectExists(key: string): Promise<boolean> {
  try {
    await getClient().send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }))
    return true
  } catch {
    return false
  }
}
