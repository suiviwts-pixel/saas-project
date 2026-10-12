import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY || "default-change-in-production";
  return crypto.scryptSync(secret, "hanotify-salt", KEY_LENGTH);
}

export function encrypt(text: string | undefined | null): string {
  if (!text) return "";
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

export function decrypt(encryptedData: string | undefined | null): string {
  if (!encryptedData) return "";
  try {
    const [ivHex, authTagHex, encrypted] = encryptedData.split(":");
    if (!ivHex || !authTagHex || !encrypted) return encryptedData;
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  } catch {
    return "";
  }
}

export function maskSecret(value: string | undefined | null): string {
  if (!value) return "";
  if (value.length <= 4) return "****";
  return `${"*".repeat(Math.max(0, value.length - 4))}${value.slice(-4)}`;
}
