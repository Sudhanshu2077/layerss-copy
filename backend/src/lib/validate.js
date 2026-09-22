// Validation + sanitization for catalogue writes. Rejects bad input with 400;
// never trusts the client (all admin routes are authenticated server-side).

const CATEGORY_IDS = ["signature-tubs", "flavours", "extras"];
const SLUG_RE = /^[a-z0-9-]{2,40}$/;
const PRICE_RE = /^[\p{L}\p{N}₹$€£.,|/+\-×xX\s()]{1,60}$/u;

function cleanText(s, max) {
  if (typeof s !== "string") return "";
  // Strip HTML/control chars, collapse whitespace — keep bakery punctuation.
  return s
    .replace(/[<>\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function cleanMultiline(s, max) {
  if (typeof s !== "string") return "";
  return s
    .replace(/[<>\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, max);
}

function validImageRef(s) {
  if (!s) return true; // optional
  if (typeof s !== "string" || s.length > 500) return false;
  if (s.startsWith("/uploads/") || s.startsWith("/") || s.startsWith("data:")) return true;
  return /^https?:\/\/[^\s"'<>]+$/i.test(s);
}

// Returns { item } or { error }.
function validateItem(body, categoryId) {
  if (!body || typeof body !== "object") return { error: "invalid body" };
  const name = cleanText(body.name, 80);
  if (name.length < 2) return { error: "name must be at least 2 characters" };
  const desc = categoryId === "flavours"
    ? cleanText(body.desc || "", 160)
    : cleanMultiline(body.desc || "", 300);

  let price = cleanText(body.price || "", 60);
  if (categoryId === "flavours") {
    price = ""; // flavours carry no price; custom-cake pricing is via WhatsApp
  } else if (price) {
    if (!PRICE_RE.test(price) || !/\d/.test(price)) {
      return { error: "price looks invalid (must contain a number)" };
    }
  }

  const badge = cleanText(body.badge || "", 20);
  const bestseller = body.bestseller === true || badge.toLowerCase() === "bestseller";

  let placeholder = cleanText(body.placeholder || "", 40).toLowerCase();
  if (categoryId === "flavours") {
    if (!SLUG_RE.test(placeholder)) {
      return { error: "flavour needs a slug id (a-z, 0-9, dashes)" };
    }
  } else if (placeholder && !SLUG_RE.test(placeholder)) {
    return { error: "invalid placeholder slug" };
  }

  const image = typeof body.image === "string" ? body.image.trim().slice(0, 500) : "";
  if (image && !validImageRef(image)) return { error: "invalid image reference" };

  const focus = cleanText(body.focus || "", 40);
  const enabled = body.enabled !== false;

  const item = { name, desc, enabled, bestseller };
  if (price) item.price = price;
  if (bestseller) item.badge = "Bestseller";
  else if (badge) item.badge = badge;
  if (placeholder) item.placeholder = placeholder;
  if (image) item.image = image;
  if (focus) item.focus = focus;
  if (body.icon && categoryId === "flavours") {
    const icon = cleanText(body.icon, 8);
    if (icon) item.icon = icon;
  }
  return { item };
}

module.exports = { CATEGORY_IDS, validateItem, cleanText };
