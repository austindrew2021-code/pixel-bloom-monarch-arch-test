import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";

/**
 * Per-shopper identity for PC Express calls, and an owner check on guest carts.
 *
 * The client keeps a random shopper id (no account data). The server derives a
 * stable search identity from it, and signs every cart it creates for that
 * shopper; reading or adding to a cart needs the matching signature, so a cart
 * id alone is not enough. Fails closed when no signing secret is available.
 */

export function isShopperId(raw: unknown): raw is string {
  return typeof raw === "string" && /^[A-Za-z0-9_-]{16,80}$/.test(raw);
}

function uuidFromHex(hex: string): string {
  const h = hex.padEnd(32, "0");
  const variant = ((parseInt(h[16]!, 16) & 0x3) | 0x8).toString(16);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-${variant}${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

export type PcxIdentity = { cartId: string; domainUserId: string; sessionId: string };

/** One PC Express search identity per shopper (session rotates daily); random when there is no shopper id. */
export function pcxIdentityFor(shopper: unknown, day = new Date().toISOString().slice(0, 10)): PcxIdentity {
  if (!isShopperId(shopper)) return { cartId: randomUUID(), domainUserId: randomUUID(), sessionId: randomUUID() };
  const derive = (purpose: string) => uuidFromHex(createHash("sha256").update(`spoonful-pcx:${purpose}:${shopper}`).digest("hex"));
  return { cartId: derive("search-cart"), domainUserId: derive("user"), sessionId: derive(`session:${day}`) };
}

/**
 * Cart signatures need their own secret (SPOONFUL_CART_SECRET, 32+ characters).
 * No fallback: the PC Express key is public, so anything derived from it is forgeable.
 * Without the secret no token is issued and every owner check fails (carts fail closed).
 */
export const MIN_CART_SECRET = 32;

function ownerSecret(): Buffer | null {
  const own = (process.env.SPOONFUL_CART_SECRET ?? "").trim();
  if (own.length < MIN_CART_SECRET) return null;
  const pcx = (process.env.SPOONFUL_PCX_API_KEY ?? "").trim();
  if (pcx && own === pcx) return null;
  return Buffer.from(own);
}

export function cartSigningReady(): boolean {
  return ownerSecret() !== null;
}

export function cartOwnerToken(shopper: unknown, cartId: string): string | null {
  const secret = ownerSecret();
  if (!secret || !isShopperId(shopper) || !cartId) return null;
  return createHmac("sha256", secret).update(`${shopper}:${cartId.toLowerCase()}`).digest("base64url");
}

export function ownsCart(shopper: unknown, cartId: string, token: unknown): boolean {
  if (typeof token !== "string" || !token) return false;
  const want = cartOwnerToken(shopper, cartId);
  if (!want) return false;
  const a = Buffer.from(want);
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}
