import "server-only";
import { createHash, randomBytes } from "node:crypto";

// One-time cancellation token: the raw token goes to the customer, only its hash is stored.
export function generateToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashToken(token) };
}
export const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");
