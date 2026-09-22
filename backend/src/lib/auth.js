const crypto = require("crypto");

// Password hash format: scrypt$<n>$<r>$<p>$<saltHex>$<hashHex>
// Generate one with: node backend/scripts/make-hash.js "your-password"

function parseHash(stored) {
  if (!stored || typeof stored !== "string") return null;
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return null;
  const [_, N, r, p, saltHex, hashHex] = parts;
  const opts = { N: Number(N), r: Number(r), p: Number(p) };
  if (!opts.N || !opts.r || !opts.p) return null;
  try {
    return { opts, salt: Buffer.from(saltHex, "hex"), hash: Buffer.from(hashHex, "hex") };
  } catch {
    return null;
  }
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const opts = { N: 16384, r: 8, p: 1 };
  const hash = crypto.scryptSync(password, salt, 64, opts);
  return `scrypt$${opts.N}$${opts.r}$${opts.p}$${salt.toString("hex")}$${hash.toString("hex")}`;
}

function verifyPassword(password, stored) {
  const parsed = parseHash(stored);
  if (!parsed) return false;
  try {
    const derived = crypto.scryptSync(password, parsed.salt, parsed.hash.length, parsed.opts);
    return (
      derived.length === parsed.hash.length &&
      crypto.timingSafeEqual(derived, parsed.hash)
    );
  } catch {
    return false;
  }
}

// Minimal cookie parser (avoids an extra dependency).
function parseCookies(header) {
  const out = {};
  if (!header) return out;
  header.split(";").forEach((part) => {
    const i = part.indexOf("=");
    if (i < 0) return;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  });
  return out;
}

const COOKIE_NAME = "layerss_admin";

function sessionCookie(id, secure) {
  // Production (https, cross-site Vercel -> Render): SameSite=None; Secure.
  // Local dev (http): SameSite=Lax without Secure (None requires Secure).
  const parts = [`${COOKIE_NAME}=${encodeURIComponent(id)}`, "Path=/", "HttpOnly"];
  if (secure) parts.push("SameSite=None", "Secure");
  else parts.push("SameSite=Lax");
  parts.push("Max-Age=43200"); // 12h, mirrors server TTL
  return parts.join("; ");
}

function clearSessionCookie(secure) {
  const parts = [`${COOKIE_NAME}=`, "Path=/", "HttpOnly", "Max-Age=0"];
  if (secure) parts.push("SameSite=None", "Secure");
  else parts.push("SameSite=Lax");
  return parts.join("; ");
}

module.exports = {
  hashPassword,
  verifyPassword,
  parseCookies,
  sessionCookie,
  clearSessionCookie,
  COOKIE_NAME,
};
