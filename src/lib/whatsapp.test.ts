import { test } from "node:test"
import assert from "node:assert/strict"
import crypto from "crypto"

process.env.WHATSAPP_APP_SECRET = "test-app-secret"

const { verifySignature, normalizeE164 } = await import("./whatsapp")

function sign(body: string, secret: string): string {
  return "sha256=" + crypto.createHmac("sha256", secret).update(body, "utf8").digest("hex")
}

test("verifySignature accepts a correctly signed body", () => {
  const body = JSON.stringify({ hello: "world" })
  assert.equal(verifySignature(body, sign(body, "test-app-secret")), true)
})

test("verifySignature rejects a wrong signature", () => {
  const body = JSON.stringify({ hello: "world" })
  assert.equal(verifySignature(body, sign(body, "wrong-secret")), false)
})

test("verifySignature rejects a tampered body", () => {
  const sig = sign(JSON.stringify({ hello: "world" }), "test-app-secret")
  assert.equal(verifySignature(JSON.stringify({ hello: "evil" }), sig), false)
})

test("verifySignature rejects a missing header", () => {
  assert.equal(verifySignature("{}", null), false)
})

test("normalizeE164 strips formatting and prepends +", () => {
  assert.equal(normalizeE164("+972 (54) 123-4567"), "+972541234567")
  assert.equal(normalizeE164("972541234567"), "+972541234567")
})

test("normalizeE164 rejects implausible lengths", () => {
  assert.equal(normalizeE164("12345"), null)
  assert.equal(normalizeE164("1234567890123456"), null)
})
