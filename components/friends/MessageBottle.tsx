interface MessageBottleProps {
  size?: number;
  className?: string;
}

export function MessageBottle({ size = 72, className }: MessageBottleProps) {
  return (
    <svg
      width={size}
      height={Math.round(size * 1.6)}
      viewBox="0 0 120 192"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          id="friend-bottle-glass"
          x1="30"
          y1="65"
          x2="90"
          y2="172"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.34" />
          <stop offset="45%" stopColor="#7dd3fc" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.28" />
        </linearGradient>
        <linearGradient
          id="friend-bottle-water"
          x1="30"
          y1="118"
          x2="90"
          y2="168"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.32" />
          <stop offset="100%" stopColor="#0284c7" stopOpacity="0.62" />
        </linearGradient>
        <linearGradient
          id="friend-bottle-cork"
          x1="42"
          y1="36"
          x2="78"
          y2="60"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#f0d69a" />
          <stop offset="55%" stopColor="#c58b3a" />
          <stop offset="100%" stopColor="#9a6a2f" />
        </linearGradient>
        <linearGradient
          id="friend-bottle-paper"
          x1="0"
          y1="0"
          x2="26"
          y2="18"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#fff7ed" />
          <stop offset="100%" stopColor="#fde68a" />
        </linearGradient>
        <radialGradient id="friend-bottle-seal" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor="#fb7185" />
          <stop offset="70%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#991b1b" />
        </radialGradient>
      </defs>

      <ellipse cx="60" cy="176" rx="30" ry="5" fill="rgba(15,23,42,0.12)" />
      <path
        d="M38 68 C38 68 28 88 28 118 C28 155 40 172 60 172 C80 172 92 155 92 118 C92 88 82 68 82 68"
        fill="url(#friend-bottle-glass)"
        stroke="rgba(148,163,184,0.36)"
        strokeWidth="1.2"
      />
      <path
        d="M33 118 C33 118 31 134 36 148 C42 160 50 168 60 168 C70 168 78 160 84 148 C89 134 87 118 87 118 Z"
        fill="url(#friend-bottle-water)"
      />
      <path
        d="M35 120 Q48 116 60 120 Q72 124 85 120"
        fill="none"
        stroke="rgba(255,255,255,0.34)"
        strokeWidth="0.9"
      />
      <g transform="translate(47, 96) rotate(-12)">
        <rect
          x="0"
          y="0"
          width="26"
          height="18"
          rx="3"
          fill="url(#friend-bottle-paper)"
          stroke="#d4a056"
          strokeWidth="0.6"
        />
        <line
          x1="4"
          y1="4"
          x2="22"
          y2="4"
          stroke="#a16207"
          strokeWidth="0.55"
          opacity="0.55"
        />
        <line
          x1="4"
          y1="8"
          x2="18"
          y2="8"
          stroke="#a16207"
          strokeWidth="0.55"
          opacity="0.44"
        />
        <line
          x1="4"
          y1="12"
          x2="20"
          y2="12"
          stroke="#a16207"
          strokeWidth="0.55"
          opacity="0.35"
        />
        <circle
          cx="0"
          cy="9"
          r="3.5"
          fill="#e8c888"
          stroke="#b7791f"
          strokeWidth="0.5"
        />
        <circle
          cx="26"
          cy="9"
          r="3.5"
          fill="#e8c888"
          stroke="#b7791f"
          strokeWidth="0.5"
        />
      </g>
      <circle
        cx="60"
        cy="106"
        r="6"
        fill="url(#friend-bottle-seal)"
        opacity="0.88"
      />
      <text
        x="60"
        y="109"
        textAnchor="middle"
        fontSize="6"
        fill="#fff1f2"
        fontWeight="700"
      >
        ♥
      </text>
      <rect
        x="44"
        y="56"
        width="32"
        height="14"
        rx="2"
        fill="rgba(224,242,254,0.28)"
        stroke="rgba(148,163,184,0.28)"
        strokeWidth="0.8"
      />
      <rect
        x="41"
        y="34"
        width="38"
        height="24"
        rx="5"
        fill="url(#friend-bottle-cork)"
        stroke="rgba(120,81,38,0.38)"
        strokeWidth="0.8"
      />
      <path
        d="M44 74 C44 74 40 96 40 118 C40 140 42 156 48 164"
        fill="none"
        stroke="rgba(255,255,255,0.34)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M76 78 C76 78 78 100 78 120 C78 138 76 150 72 158"
        fill="none"
        stroke="rgba(255,255,255,0.14)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="50" cy="142" r="2.5" fill="rgba(255,255,255,0.24)" />
      <circle cx="70" cy="136" r="1.8" fill="rgba(255,255,255,0.2)" />
      <circle cx="56" cy="150" r="1.2" fill="rgba(255,255,255,0.18)" />
    </svg>
  );
}
