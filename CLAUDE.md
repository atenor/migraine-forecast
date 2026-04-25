# Migraine Forecast — Design System & Dev Notes

## Stack
- Next.js 14 App Router · TypeScript · Tailwind CSS · Prisma + Neon (PostgreSQL)
- Port: 3005 (`npm run dev -- --port 3005`)
- Always `rm -rf .next` and restart dev server after any build/cache issues

## Design Language

### Glow-first UI — LOCKED IN
Every status card, risk indicator, and meaningful data card uses **ambient colour glow**. Never remove this unless explicitly asked.

The hero/primary card uses a **three-layer halo stack** so the card reads as if it's silhouetted against a soft lamp behind it — light bleeds around all four edges:

**Pattern (hero / primary cards):**
```tsx
<div className="relative">
  {/* (1) Wide outer halo — atmospheric bloom */}
  <div className="absolute pointer-events-none"
    style={{
      inset: "-110px",
      background: `radial-gradient(ellipse at 50% 50%, ${COLOR}33 0%, ${COLOR}11 35%, transparent 70%)`,
      filter: "blur(8px)",
    }} />
  {/* (2) Mid halo — bright bleed around the card */}
  <div className="absolute pointer-events-none"
    style={{
      inset: "-50px",
      background: `radial-gradient(ellipse at 50% 50%, ${COLOR}55 0%, ${COLOR}22 45%, transparent 75%)`,
    }} />
  {/* (3) Tight rim halo — light hugging the card edges */}
  <div className="absolute pointer-events-none rounded-[2rem]"
    style={{
      inset: "-14px",
      boxShadow: `0 0 60px 12px ${COLOR}55, 0 0 120px 24px ${COLOR}30`,
    }} />

  {/* Card */}
  <div className="relative overflow-hidden rounded-3xl"
    style={{
      background: `linear-gradient(155deg, ${COLOR}14 0%, rgba(255,255,255,0.028) 55%)`,
      backdropFilter: "blur(24px)",
      border: `1px solid ${COLOR}40`,
      boxShadow: `
        0 0 0 1px ${COLOR}25,
        0 0 90px -8px ${COLOR}66,
        inset 0 1px 0 rgba(255,255,255,0.07)
      `,
    }}>
    {/* Top colour wash inside the card */}
    <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
      style={{ background: `linear-gradient(to bottom, ${COLOR}1a, transparent)` }} />
    {/* …content… */}
  </div>
</div>
```

**Pattern (secondary cards — single-layer ambient bleed is fine):**
```tsx
<div className="relative">
  <div className="absolute pointer-events-none"
    style={{ inset: "-20px", background: `radial-gradient(ellipse at 50% 50%, ${COLOR}1f 0%, transparent 70%)` }} />
  <div className="relative overflow-hidden rounded-3xl" style={{ /* card styles */ }}>…</div>
</div>
```

**SVG rings / arcs** get triple drop-shadow:
```ts
filter: `drop-shadow(0 0 6px ${color}cc) drop-shadow(0 0 18px ${color}88) drop-shadow(0 0 42px ${color}44)`
```

**Pulsing status LED** (ping animation for non-low states):
```tsx
<span className="relative flex h-2 w-2">
  <span className="absolute inline-flex h-full w-full rounded-full opacity-70 animate-ping" style={{ background: COLOR }} />
  <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: COLOR }} />
</span>
```

### Risk Colour Palette
| Level     | Hex       | Meaning  |
|-----------|-----------|----------|
| low       | `#34d399` | Green    |
| moderate  | `#fbbf24` | Yellow   |
| high      | `#f97316` | Orange   |
| very-high | `#ef4444` | Red      |

### Base Glass Cards
```
bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-3xl
```
Class alias: `glass` / `glass-sm` / `card`

### Calm Colour Tokens (Tailwind)
- `calm-teal`   → `#4ecdc4`
- `calm-gold`   → `#f0c27f`
- `calm-terra`  → `#e07b54`
- `calm-rose`   → `#c85a5a`
- `calm-mist`   → `#b0c4d8`
- `calm-lavender` → `#a89bc2`

### Typography
- `calm-title` — large page headings
- `calm-subtitle` — muted secondary text
- `calm-label` — ALL CAPS small tracking label

### Dark background
`#050d1a` base · glass overlays at 4% white opacity

## DB / Environment
- `hasDB = Boolean(process.env.DATABASE_URL)` — all Prisma calls gated behind this
- No DB → every API route returns graceful empty response immediately (never hangs)
- `.env.local` holds VAPID keys + DATABASE_URL

## Push Notifications
- Service worker: `public/sw.js`
- Hook: `lib/use-notifications.ts` — fires when risk ≥ 50%, 6-hour cooldown
- VAPID keys in `.env.local`

## Custom Options (localStorage)
- `mf-custom-medications` — user-added medication names
- `mf-custom-relief` — user-added relief methods
- Managed via `lib/custom-options.ts`
