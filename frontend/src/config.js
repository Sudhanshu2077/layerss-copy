// Centralised runtime config. Only VITE_* vars are exposed to the browser.
// Never put backend secrets (ADMIN_PASSWORD_HASH, SESSION_SECRET, …) here.
export const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "");

export const WA_NUMBER =
  import.meta.env.VITE_WA_NUMBER || "917378777740";

export const INSTAGRAM_URL =
  import.meta.env.VITE_INSTAGRAM_URL ||
  "https://www.instagram.com/layerss_thebakehouse/";

export const MAP_EMBED_URL =
  import.meta.env.VITE_MAP_EMBED_URL ||
  "https://maps.google.com/maps?q=Chhatrapati%20Sambhajinagar%2C%20Maharashtra&output=embed";

export function apiUrl(path) {
  if (!path.startsWith("/")) path = `/${path}`;
  return `${API_BASE}${path}`;
}

// Catalogue images may live on the backend (/uploads/…) when set via admin.
// Prefix those with the API base; keep absolute http(s) and site-relative art as-is.
export function resolveImage(src) {
  if (!src || typeof src !== "string") return src;
  if (/^https?:\/\//i.test(src) || src.startsWith("data:")) return src;
  if (src.startsWith("/uploads/")) return `${API_BASE}${src}`;
  return src;
}

export function waLink(text) {
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
}
