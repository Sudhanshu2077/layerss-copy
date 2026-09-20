import { useState } from "react";

const PALETTES = [
  ["#ffd7c2", "#ffb199"],
  ["#d9e7ff", "#a7c5f5"],
  ["#fff1c4", "#ffd76b"],
  ["#e2ffe0", "#a7e8a0"],
  ["#ffd9e8", "#f7a8c8"],
  ["#eee0ff", "#c5a8f7"],
];

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 997;
  return h;
}

export default function Placeholder({ name, label, big, image, pos }) {
  const [failed, setFailed] = useState(false);
  const [a, b] = PALETTES[hash(name || "x") % PALETTES.length];

  if (image && !failed) {
    return (
      <img
        className={`photo ${big ? "big" : ""}`}
        src={image}
        alt={label || name}
        loading="lazy"
        style={pos ? { objectPosition: pos } : undefined}
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div
      className={`placeholder ${big ? "big" : ""}`}
      style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}
    >
      <span>{label || name}</span>
    </div>
  );
}
