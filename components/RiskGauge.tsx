"use client";

interface Props { score: number; level: "low" | "moderate" | "high" | "very-high"; size?: number; }

const CFG = {
  low:         { label: "Clear",       sublabel: "Conditions are calm",      color: "#86d4a4" },
  moderate:    { label: "Watchful",    sublabel: "A little awareness today", color: "#e8c485" },
  high:        { label: "Care",        sublabel: "Be gentle with yourself",  color: "#dd9876" },
  "very-high": { label: "Gentle day",  sublabel: "Lean into your routines",  color: "#cf7d8a" },
};

export default function RiskGauge({ score, level, size = 168 }: Props) {
  const cfg = CFG[level];
  const sw  = Math.round(size * 0.075);
  const r   = (size - sw) / 2 - 4;
  const cx  = size / 2;
  const cy  = size / 2;
  const circumference = 2 * Math.PI * r;
  const filled = (Math.min(score, 100) / 100) * circumference;
  const gap    = circumference - filled;
  const isHighRisk = level === "high" || level === "very-high";

  return (
    <div className="flex flex-col items-center gap-4">

      {/* Ring + ambient glow */}
      <div className="relative" style={{ width: size, height: size }}>

        {/* Ambient glow blob behind the ring */}
        <div
          className={`absolute rounded-full pointer-events-none ${isHighRisk ? "animate-pulse" : ""}`}
          style={{
            inset: "-25%",
            background: cfg.color,
            opacity: isHighRisk ? 0.13 : 0.08,
            filter: `blur(${Math.round(size * 0.28)}px)`,
          }}
        />

        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="relative">
          {/* Track ring */}
          <circle
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={cfg.color}
            strokeWidth={sw}
            strokeOpacity={0.1}
          />
          {/* Filled arc */}
          {score > 0 && (
            <circle
              cx={cx} cy={cy} r={r}
              fill="none"
              stroke={cfg.color}
              strokeWidth={sw}
              strokeLinecap="round"
              strokeDasharray={`${filled} ${gap}`}
              transform={`rotate(-90 ${cx} ${cy})`}
              style={{
                filter: [
                  `drop-shadow(0 0 6px ${cfg.color}cc)`,
                  `drop-shadow(0 0 18px ${cfg.color}88)`,
                  `drop-shadow(0 0 42px ${cfg.color}44)`,
                ].join(" "),
                transition: "stroke-dasharray 0.8s cubic-bezier(0.4,0,0.2,1)",
              }}
            />
          )}
        </svg>

        {/* Centered score */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className="font-black tabular-nums tracking-tight leading-none"
            style={{ fontSize: Math.round(size * 0.27), color: cfg.color }}
          >
            {score}
          </span>
          <span
            className="font-semibold tracking-[0.18em] text-white/35 uppercase"
            style={{ fontSize: Math.round(size * 0.075), marginTop: Math.round(size * 0.035) }}
          >
            out of 100
          </span>
        </div>
      </div>

      {/* Label pill */}
      <div
        className="flex flex-col items-center gap-1 px-7 py-3 rounded-full"
        style={{
          background: `${cfg.color}18`,
          border: `1px solid ${cfg.color}38`,
        }}
      >
        <span className="text-[15px] font-semibold tracking-wide" style={{ color: cfg.color }}>
          {cfg.label}
        </span>
        <span className="text-[12px] text-white/55">{cfg.sublabel}</span>
      </div>

    </div>
  );
}
