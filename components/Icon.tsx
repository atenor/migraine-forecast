/**
 * Refined line-icon set — replaces emoji throughout the app.
 * Strokes inherit `currentColor`, so colour them via Tailwind text-* classes
 * or inline `style={{ color: ... }}`.
 *
 * Style: thin (1.6 stroke), rounded caps, calm and weightless.
 */
"use client";

type IconName =
  | "sunrise" | "sun" | "sunset" | "moon"
  | "shield" | "leaf" | "capsule" | "spark"
  | "pin" | "lock" | "drop" | "cup" | "glass"
  | "arrow-right" | "chevron-down" | "check" | "wave";

interface Props {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}

export default function Icon({ name, size = 20, className = "", strokeWidth = 1.6 }: Props) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
  };

  switch (name) {
    /* Time-of-day glyphs — substantial, filled silhouettes that read clearly at small sizes */
    case "sunrise":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
          {/* Half sun rising above horizon */}
          <path d="M5 17a7 7 0 0 1 14 0Z" fill="currentColor" opacity="0.95" />
          {/* Horizon line */}
          <path d="M2 19.25h20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.55" />
          {/* Up arrow indicating rising */}
          <path d="M9 7l3-3 3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.7" />
        </svg>
      );
    case "sun":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
          {/* Solid disc */}
          <circle cx="12" cy="12" r="4.6" fill="currentColor" />
          {/* Soft rays */}
          <g stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" opacity="0.65">
            <path d="M12 2.5v2.2" />
            <path d="M12 19.3v2.2" />
            <path d="M2.5 12h2.2" />
            <path d="M19.3 12h2.2" />
            <path d="M5.2 5.2l1.55 1.55" />
            <path d="M17.25 17.25l1.55 1.55" />
            <path d="M5.2 18.8l1.55-1.55" />
            <path d="M17.25 6.75l1.55-1.55" />
          </g>
        </svg>
      );
    case "sunset":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
          {/* Half sun setting */}
          <path d="M5 17a7 7 0 0 1 14 0Z" fill="currentColor" opacity="0.7" />
          <path d="M2 19.25h20" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.55" />
          {/* Down arrow indicating setting */}
          <path d="M9 4l3 3 3-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.7" />
        </svg>
      );
    case "moon":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={className}>
          {/* Solid crescent */}
          <path d="M20.5 14.5A8.5 8.5 0 1 1 9.5 3.5a7 7 0 0 0 11 11Z" fill="currentColor" />
          {/* Tiny accent star */}
          <circle cx="6.5" cy="6.5" r="0.8" fill="currentColor" opacity="0.55" />
        </svg>
      );

    case "shield":
      return (
        <svg {...common}>
          <path d="M12 3 5 6v6c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      );
    case "leaf":
      return (
        <svg {...common}>
          <path d="M5 21c2-9 7-14 16-15-1 9-6 14-15 16Z" />
          <path d="M5 21c4-4 7-7 11-11" />
        </svg>
      );
    case "capsule":
      return (
        <svg {...common}>
          <rect x="3" y="9" width="18" height="6" rx="3" />
          <path d="M12 9v6" />
        </svg>
      );
    case "spark":
      return (
        <svg {...common}>
          <path d="M12 3v4" /><path d="M12 17v4" />
          <path d="M3 12h4" /><path d="M17 12h4" />
          <path d="m5.6 5.6 2.8 2.8" /><path d="m15.6 15.6 2.8 2.8" />
          <path d="m5.6 18.4 2.8-2.8" /><path d="m15.6 8.4 2.8-2.8" />
        </svg>
      );

    case "pin":
      return (
        <svg {...common}>
          <path d="M12 21s7-6 7-12a7 7 0 1 0-14 0c0 6 7 12 7 12Z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
      );
    case "lock":
      return (
        <svg {...common}>
          <rect x="4" y="11" width="16" height="9" rx="2.5" />
          <path d="M8 11V8a4 4 0 1 1 8 0v3" />
        </svg>
      );
    case "drop":
      return (
        <svg {...common}>
          <path d="M12 3c3 4 6 7.5 6 11a6 6 0 1 1-12 0c0-3.5 3-7 6-11Z" />
        </svg>
      );
    case "cup":
      return (
        <svg {...common}>
          <path d="M5 8h11v6a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8Z" />
          <path d="M16 10h2a2.5 2.5 0 0 1 0 5h-2" />
          <path d="M8 4v2" /><path d="M11 4v2" />
        </svg>
      );
    case "glass":
      return (
        <svg {...common}>
          <path d="M6 3h12l-2 8a4 4 0 0 1-8 0L6 3Z" />
          <path d="M12 15v6" />
          <path d="M9 21h6" />
        </svg>
      );

    case "arrow-right":
      return (
        <svg {...common}>
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
        </svg>
      );
    case "chevron-down":
      return (
        <svg {...common}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <path d="m5 12 4 4 10-10" />
        </svg>
      );
    case "wave":
      return (
        <svg {...common}>
          <path d="M2 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />
          <path d="M2 17c2-3 4-3 6 0s4 3 6 0 4-3 6 0" />
        </svg>
      );
  }
}
