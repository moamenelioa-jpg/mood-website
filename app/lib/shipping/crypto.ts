// ─────────────────────────────────────────────────────────────────────────────
// SHIPPING — Credential Encryption Utility
//
// Carrier API keys are stored AES-256-GCM encrypted in Firestore.
// The encryption key lives ONLY in SHIPPING_ENCRYPTION_KEY env var (32 bytes hex).
//
// Format stored in DB:  "<iv_hex>:<authTag_hex>:<ciphertext_hex>"
// ─────────────────────────────────────────────────────────────────────────────

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const raw = process.env.SHIPPING_ENCRYPTION_KEY;
  if (!raw) {
    throw new Error(
      "SHIPPING_ENCRYPTION_KEY env var is not set. " +
      "Generate with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }
  const buf = Buffer.from(raw, "hex");
  if (buf.length !== 32) {
    throw new Error("SHIPPING_ENCRYPTION_KEY must be exactly 32 bytes (64 hex chars)");
  }
  return buf;
}

/**
 * Encrypt a plaintext string (API key, secret, etc.)
 * Returns a storable string: "<iv>:<authTag>:<ciphertext>" (all hex-encoded)
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Decrypt a stored encrypted string back to plaintext.
 * Returns null if the value is null/undefined (field was not set).
 */
export function decrypt(stored: string | null | undefined): string | null {
  if (!stored) return null;
  const key = getKey();
  const parts = stored.split(":");
  if (parts.length !== 3) throw new Error("Invalid encrypted credential format");
  const [ivHex, authTagHex, ciphertextHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const ciphertext = Buffer.from(ciphertextHex, "hex");
  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
