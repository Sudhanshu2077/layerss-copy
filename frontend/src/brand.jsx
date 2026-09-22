// Real brand glyphs (inline SVG, no emoji, no extra deps).
// Instagram: rounded-square camera outline + lens + dot (official geometry).
// WhatsApp: speech-bubble handset (simplified official mark, currentColor).

export function InstagramIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function WhatsAppIcon({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2.5c-5.2 0-9.5 4.2-9.5 9.5 0 1.7.4 3.3 1.2 4.7L2.5 21.5l4.9-1.2c1.4.7 2.9 1.1 4.6 1.1 5.2 0 9.5-4.2 9.5-9.5S17.2 2.5 12 2.5zm0 17.3c-1.5 0-2.9-.4-4.1-1.1l-.3-.2-2.9.7.7-2.8-.2-.3c-.8-1.2-1.2-2.6-1.2-4.1 0-4.3 3.5-7.7 7.7-7.7s7.7 3.5 7.7 7.7-3.2 7.8-7.4 7.8zm4.2-5.8c-.2-.1-1.4-.7-1.6-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1-.6-.3-1.2-.6-1.7-1.1-.4-.4-.8-.9-1.1-1.4-.1-.2 0-.4.1-.5l.5-.6c.1-.2.2-.4.1-.6L10.9 8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.5.2-.7.5-.2.3-.9 1-.9 2.4s.9 2.7 1.1 2.9c.1.2 1.8 2.9 4.5 3.9.6.2 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1 0-.1-.2-.1-.4-.2z" />
    </svg>
  );
}

export function ArrowLeftIcon({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  );
}
