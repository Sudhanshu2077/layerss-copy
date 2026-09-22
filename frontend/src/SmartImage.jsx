import { useState } from "react";
import { resolveImage } from "./config.js";

// Derive a .webp sibling for a /public jpg/png asset.
// All current assets have a generated .webp (see gen-webp.py); if a future
// admin upload lacks one, the browser falls back to <img> automatically.
function webpFor(src) {
  if (!src || typeof src !== "string") return null;
  if (/\.webp($|\?)/i.test(src)) return null;
  if (/^https?:\/\//i.test(src)) return null; // remote/admin URLs: use as-is
  const m = src.match(/^(.*)\.(jpe?g|png)($|\?)/i);
  if (!m) return null;
  return `${m[1]}.webp${m[3] || ""}`;
}

export default function SmartImage({
  src,
  webpSrc,
  alt,
  eager = false,
  fetchPriority,
  className,
  style,
  width,
  height,
  sizes,
  onError,
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return null;
  const full = resolveImage(src);
  const webpRaw = webpSrc || webpFor(src);
  const webp = webpRaw ? resolveImage(webpRaw) : null;
  const loading = eager ? "eager" : "lazy";
  const fp = fetchPriority || (eager ? "high" : "auto");
  return (
    <picture style={{ display: "contents" }}>
      {webp && <source srcSet={webp} type="image/webp" sizes={sizes} />}
      <img
        src={full}
        alt={alt || ""}
        loading={loading}
        decoding="async"
        fetchPriority={fp}
        className={className}
        style={style}
        width={width}
        height={height}
        sizes={sizes}
        onError={(e) => {
          setFailed(true);
          if (onError) onError(e);
        }}
      />
    </picture>
  );
}
