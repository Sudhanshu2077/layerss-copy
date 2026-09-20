function Svg({ children }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export const ICONS = {
  strawberry: (
    <Svg>
      <path d="M12 21.5C8 18 5.5 14.5 5.5 11c0-2.5 1.8-4 3.7-4 .9 0 1.8.4 2.8.4s1.9-.4 2.8-.4c1.9 0 3.7 1.5 3.7 4 0 3.5-2.5 7-6.5 10.5z" />
      <path d="M12 7.4V5.2M12 7.4C10.5 5.9 8.5 5.4 6.5 5.9c1.5 1 3.5 1.5 5.5 1.5zm0 0c1.5-1.5 3.5-2 5.5-1.5-1.5 1-3.5 1.5-5.5 1.5z" />
      <path d="M9.5 11.5h.01M12.2 12.6h.01M14.8 11.5h.01M10.4 14.6h.01M13.6 14.6h.01" />
    </Svg>
  ),
  chocolate: (
    <Svg>
      <g transform="rotate(18 12 12)">
        <rect x="8" y="3.5" width="8" height="17" rx="1" />
        <path d="M8 9.2h8M8 14.8h8M12 3.5v17" />
      </g>
    </Svg>
  ),
  pineapple: (
    <Svg>
      <ellipse cx="12" cy="14.5" rx="5" ry="5.5" />
      <path d="M8.3 11.5l7.4 6M15.7 11.5l-7.4 6M9.5 8.5L8 4l3 2.5L12 3l1 3.5 3-2.5-1 4.5" />
    </Svg>
  ),
  butterscotch: (
    <Svg>
      <rect x="3.5" y="9" width="7" height="7" rx="1" />
      <rect x="12" y="12.5" width="8" height="8" rx="1" />
      <path d="M6 11.5v2.5M15.5 15v3M13 5.5l2-2 2 2M14.5 3.5v4" />
    </Svg>
  ),
  blueberry: (
    <Svg>
      <circle cx="9" cy="14.5" r="4.5" />
      <circle cx="16" cy="16" r="3.2" />
      <path d="M9 10c.5-2 2-3.5 4.5-4-.5 2-2 3.5-4.5 4zM13.5 6V4" />
    </Svg>
  ),
  blackcurrant: (
    <Svg>
      <circle cx="9" cy="14" r="2.3" />
      <circle cx="13.5" cy="12" r="2.3" />
      <circle cx="11.5" cy="17" r="2.3" />
      <path d="M12 9.5V6M12 6c-2 0-3.5-1-4-2.5C10 3.5 11.5 4.5 12 6zm0 0c2 0 3.5-1 4-2.5C14 3.5 12.5 4.5 12 6z" />
    </Svg>
  ),
  "chocolate-truffle": (
    <Svg>
      <circle cx="12" cy="13" r="6.5" />
      <path d="M6.3 11.3c2-1.5 3.7 1.5 5.7 0s3.7 1.5 5.7.3M6.8 15.3c1.8-1 3.4 1 5.2 0s3.4 1 5.2.2" />
    </Svg>
  ),
  kitkat: (
    <Svg>
      <rect x="4" y="6.5" width="6.5" height="11" rx="1" />
      <rect x="12.5" y="6.5" width="6.5" height="11" rx="1" />
      <path d="M4 12h6.5M12.5 12H19M7.2 6.5V9M15.7 6.5V9" />
    </Svg>
  ),
  "ferrero-rocher": (
    <Svg>
      <path d="M7 12.5h10l-1.4 7H8.4L7 12.5z" />
      <path d="M10 12.5l.7 7M14 12.5l-.7 7" />
      <path d="M7.5 12.5C7.5 8.8 9.4 6.5 12 6.5s4.5 2.3 4.5 6" />
      <path d="M10.5 9.5h.01M13.5 9.5h.01M12 7.8h.01" />
    </Svg>
  ),
  rasamalai: (
    <Svg>
      <path d="M4 13.5h16c0 3.4-3.6 5.8-8 5.8s-8-2.4-8-5.8z" />
      <path d="M9 10.5c1-1.6 2-1.6 3 0s2 1.6 3 0" />
      <path d="M10 7.2c0-1 .8-1 .8-2M14 7.2c0-1 .8-1 .8-2" />
    </Svg>
  ),
  rosemilk: (
    <Svg>
      <circle cx="12" cy="8.5" r="4.5" />
      <path d="M12 8.5c0-1.2 1-2.2 2.2-2.2 1 0 1.8.8 1.8 1.7 0 1.5-1.7 2.6-3.1 2-1-.4-1.2-1.5-.9-1.5" />
      <path d="M12 13v8M12 17.5c-2 0-3.5-1-4-2.5 1.5-.5 3.2 0 4 2.5z" />
    </Svg>
  ),
  mango: (
    <Svg>
      <path d="M12 5.5C8.2 5.5 5.5 9.2 5.5 13.5c0 3.9 2.7 6.5 6 6.5 3.8 0 7-3.2 7-7.5 0-1.2-.3-2.3-.7-3.2-.8.8-2 1.2-3.1 1-.9-2-1.6-3.6-2.7-4.8z" />
      <path d="M12 5.5c0-1.2.6-2 1.6-2.4M13.6 4.7c2-.5 3.6 0 4.6 1.5-1.5 1-3.4.6-4.6-1.5z" />
    </Svg>
  ),
  "black-forest": (
    <Svg>
      <path d="M9 3l4 6H10.5L13 13H5l2.5-4H5l4-6z" />
      <path d="M9 13v6M17 8l3 4.5h-2l1.5 3.5h-5L16 12.5h-2L17 8zM17 16v3.5" />
    </Svg>
  ),
  biscoff: (
    <Svg>
      <rect x="4" y="8" width="16" height="9" rx="4.5" transform="rotate(-14 12 12)" />
      <rect x="7" y="10.4" width="10" height="4.5" rx="2.2" transform="rotate(-14 12 12)" />
      <path d="M6.5 5.5h.01M9 4.8h.01M17.5 18.5h.01" />
    </Svg>
  ),
};
