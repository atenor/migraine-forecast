"use client";
import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";
import RiskGauge from "./RiskGauge";
import Icon from "./Icon";
import LocationPicker from "./LocationPicker";
import { useSettings } from "@/lib/settings-context";
import { useNotifications } from "@/lib/use-notifications";
import { formatPressure, convertTemp, PRESSURE_UNITS, TEMP_UNITS, type PressureUnit, type TempUnit } from "@/lib/units";
import type { RiskWindow, PersonalSensitivity } from "@/lib/risk";
import type { Suggestion } from "@/lib/suggestions";

const PressureChart = dynamic(() => import("./PressureChart"), { ssr: false });

interface CheckinContribution { factor: string; delta: number; note: string; }

interface ForecastData {
  current: { pressureHpa: number; tempC: number; humidity: number; condition: string };
  windows: RiskWindow[];
  peak: RiskWindow;
  sensitivity: PersonalSensitivity;
  suggestions: Suggestion[];
  personalized?: boolean;
  checkinContributions?: CheckinContribution[];
  checkinDelta?: number;
}

// ── Risk colours — softened, healing palette ─────────────────────────────
//    sage → honey → clay → dusk (still green / yellow / orange / red)
const RISK_HEX: Record<string, string> = {
  low:         "#86d4a4",   // healing sage green
  moderate:    "#e8c485",   // warm honey
  high:        "#dd9876",   // warm clay
  "very-high": "#cf7d8a",   // dusty rose
};

// ── Gentle, ally-toned messaging ─────────────────────────────────────────
const HEADLINE: Record<string, string> = {
  low:         "You're in a good place today.",
  moderate:    "A gentle heads-up for today.",
  high:        "Today asks for a little care.",
  "very-high": "Today calls for extra kindness.",
};
const SUBLINE: Record<string, string> = {
  low:         "The atmosphere is calm and your conditions look settled. Enjoy your day.",
  moderate:    "Pressure is shifting a little. Keep water close and let the day move slowly.",
  high:        "Pressure is falling. A migraine window is opening — gentle care can soften it.",
  "very-high": "A significant pressure drop is here. Lean into your routines, hydrate, and rest early.",
};

// ── Risk level helpers ────────────────────────────────────────────────────
type Level = "low" | "moderate" | "high" | "very-high";
function scoreToLevel(s: number): Level {
  if (s < 34) return "low";
  if (s < 50) return "moderate";
  if (s < 70) return "high";
  return "very-high";
}
const LEVEL_COLOR: Record<Level, string> = {
  low:         "bg-calm-sage",
  moderate:    "bg-calm-honey",
  high:        "bg-calm-clay",
  "very-high": "bg-calm-dusk",
};
const LEVEL_TEXT: Record<Level, string> = {
  low:         "text-calm-sage",
  moderate:    "text-calm-honey",
  high:        "text-calm-clay",
  "very-high": "text-calm-dusk",
};
const LEVEL_LABEL: Record<Level, string> = {
  low:         "Clear",
  moderate:    "Watchful",
  high:        "Care",
  "very-high": "Gentle day",
};

// ── Today's timeline: 4 blocks ────────────────────────────────────────────
function buildTimeline(windows: RiskWindow[]) {
  const now = new Date();
  const slots = [
    { label: "Morning",   icon: "sunrise" as const, start: 6,  end: 12 },
    { label: "Afternoon", icon: "sun"     as const, start: 12, end: 18 },
    { label: "Evening",   icon: "sunset"  as const, start: 18, end: 22 },
    { label: "Night",     icon: "moon"    as const, start: 22, end: 30 }, // 30 = next-day 6am
  ];
  return slots.map(slot => {
    const relevant = windows.filter(w => {
      const h = new Date(w.time);
      // Only show today's slots (within next 24 hours)
      const hoursFromNow = (h.getTime() - now.getTime()) / 3_600_000;
      if (hoursFromNow < -1 || hoursFromNow > 24) return false;
      const hour = h.getHours();
      const adjustedHour = hoursFromNow < 0 ? hour : hour;
      return adjustedHour >= slot.start && adjustedHour < (slot.end > 24 ? 30 : slot.end);
    });
    const max = relevant.length ? Math.max(...relevant.map(w => w.riskScore)) : 0;
    const isPast = slot.end <= now.getHours() && slot.end <= 24;
    return { ...slot, score: max, level: scoreToLevel(max), isPast };
  });
}

// ── Tomorrow summary ──────────────────────────────────────────────────────
function tomorrowSummary(windows: RiskWindow[]) {
  const now = new Date();
  const tom = windows.filter(w => {
    const h = new Date(w.time);
    const hoursAhead = (h.getTime() - now.getTime()) / 3_600_000;
    return hoursAhead >= 20 && hoursAhead <= 44;
  });
  if (!tom.length) return null;
  const peak = Math.max(...tom.map(w => w.riskScore));
  const level = scoreToLevel(peak);
  const labels: Record<Level, string> = {
    low:         "Tomorrow looks calm.",
    moderate:    "Tomorrow asks for a little awareness.",
    high:        "Tomorrow may need extra care.",
    "very-high": "Tomorrow calls for early kindness.",
  };
  return { label: labels[level], level, score: peak };
}

export default function Dashboard() {
  const [forecast, setForecast] = useState<ForecastData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [showDetails, setShowDetails] = useState(false);

  const { pressureUnit, tempUnit, location, setPressureUnit, setTempUnit, setLocation } = useSettings();

  // Fires a notification (with why + what to do) when risk ≥ 50
  useNotifications(forecast?.peak.riskLevel ?? null);

  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const loadAndFetch = async (lat: number, lon: number) => {
      // Pull today's check-in (if any) so the forecast can respond holistically
      let log: Record<string, unknown> | null = null;
      try {
        const r = await fetch(`/api/checkin?date=${today}`, { cache: "no-store" });
        const d = await r.json();
        log = d.log ?? null;
      } catch { /* no log yet */ }

      const params = new URLSearchParams({ lat: String(lat), lon: String(lon) });
      if (log) {
        const set = (k: string, v: unknown) => {
          if (v === undefined || v === null) return;
          params.set(k, String(v));
        };
        set("sleepHours",   log.sleepHours);
        set("sleepQuality", log.sleepQuality);
        set("stressLevel",  log.stressLevel);
        set("hydration",    log.hydration);
        set("caffeine",     log.caffeine);
        set("alcohol",      log.alcohol);
        set("exercise",     log.exercise);
        set("menstrual",    log.menstrual);
        set("screenTime",   log.screenTime);
        set("hasMigraine",  log.hasMigraine);
      }

      try {
        const r = await fetch(`/api/forecast?${params.toString()}`, { cache: "no-store" });
        if (!r.ok) throw new Error();
        setForecast(await r.json());
      } catch { setError("Could not load forecast. Check your connection."); }
      finally { setLoading(false); }
    };
    // 1) If user has a stored location → use it.
    // 2) Otherwise try browser geolocation (and persist it as auto).
    // 3) Otherwise fall back to NYC and let the user pick a location manually.
    if (location) { loadAndFetch(location.lat, location.lon); return; }

    if (!navigator.geolocation) { loadAndFetch(40.7128, -74.006); return; }
    navigator.geolocation.getCurrentPosition(
      async p => {
        const { latitude: lat, longitude: lon } = p.coords;
        loadAndFetch(lat, lon);
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
          const d = await r.json();
          const name = d.address?.city || d.address?.town || d.address?.village || d.address?.county || "Current location";
          setLocation({ lat, lon, name, source: "auto" });
        } catch { setLocation({ lat, lon, name: "Current location", source: "auto" }); }
      },
      () => loadAndFetch(40.7128, -74.006),
      { timeout: 5000, maximumAge: 300_000 }
    );
  }, [location, setLocation]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-6">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 rounded-full border-2 border-calm-sage/20 animate-ping" />
        <div className="absolute inset-2 rounded-full border-2 border-t-calm-sage border-calm-sage/10 animate-spin" />
      </div>
      <p className="calm-subtitle">Listening to the sky…</p>
    </div>
  );

  if (error) return (
    <div className="card text-center py-16">
      <p className="text-calm-dusk mb-4 calm-body">{error}</p>
      <button onClick={() => window.location.reload()} className="btn-ghost">Try again</button>
    </div>
  );

  if (!forecast) return null;

  const { current, windows, peak, suggestions } = forecast;
  const timeline = buildTimeline(windows);
  const tomorrow = tomorrowSummary(windows);
  const topSuggestion = suggestions[0];
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="flex flex-col gap-7">

      {/* ── Date + Location  ·  Temp + Pressure + Humidity ─────────────── */}
      <div className="pt-1 flex items-start justify-between gap-4">
        {/* LEFT — Date stacked above Location (interactive picker) */}
        <div className="min-w-0 flex flex-col gap-1.5">
          <p className="calm-label">{today}</p>
          <div className="flex items-center gap-1.5 flex-wrap">
            <LocationPicker
              current={location}
              fallbackLabel="Set your location"
              onChange={setLocation}
            />
            {location && (
              <span className="text-[13px] text-white/45 truncate">· {current.condition}</span>
            )}
          </div>
        </div>

        {/* RIGHT — Temp on top, Pressure · Humidity beneath (both clickable) */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <UnitDropdown
            value={`${convertTemp(current.tempC, tempUnit).toFixed(0)}°${tempUnit}`}
            options={TEMP_UNITS.map(u => ({ value: u.value, label: u.label, symbol: u.symbol }))}
            selected={tempUnit}
            onSelect={v => setTempUnit(v as TempUnit)}
            align="right"
          />
          <div className="flex items-center gap-1 whitespace-nowrap">
            <UnitDropdown
              variant="mini"
              value={formatPressure(current.pressureHpa, pressureUnit)}
              options={PRESSURE_UNITS.map(u => ({ value: u.value, label: u.label, symbol: u.symbol }))}
              selected={pressureUnit}
              onSelect={v => setPressureUnit(v as PressureUnit)}
              align="right"
            />
            <span className="text-[12px] text-white/25">·</span>
            <span className="text-[12px] text-white/55 tabular-nums">{current.humidity}%</span>
          </div>
        </div>
      </div>

      {/* ── HERO — light-source glowing risk card ─────────────────────────
            The card sits in front of three stacked radial halos so it reads
            as if a soft lamp behind the card is bleeding light around its edges.
          ───────────────────────────────────────────────────────────────── */}
      <div className="relative">
        {/* (1) Wide outer halo — atmospheric bloom */}
        <div
          className="absolute pointer-events-none transition-all duration-1000"
          style={{
            inset: "-110px",
            background: `radial-gradient(ellipse at 50% 50%, ${RISK_HEX[peak.riskLevel]}33 0%, ${RISK_HEX[peak.riskLevel]}11 35%, transparent 70%)`,
            filter: "blur(8px)",
          }}
        />
        {/* (2) Mid halo — the bright bleed around the card */}
        <div
          className="absolute pointer-events-none transition-all duration-1000"
          style={{
            inset: "-50px",
            background: `radial-gradient(ellipse at 50% 50%, ${RISK_HEX[peak.riskLevel]}55 0%, ${RISK_HEX[peak.riskLevel]}22 45%, transparent 75%)`,
          }}
        />
        {/* (3) Tight rim halo — the light hugging the card edges */}
        <div
          className="absolute pointer-events-none rounded-[2rem] transition-all duration-1000"
          style={{
            inset: "-14px",
            boxShadow: `0 0 60px 12px ${RISK_HEX[peak.riskLevel]}55, 0 0 120px 24px ${RISK_HEX[peak.riskLevel]}30`,
          }}
        />

        {/* Card */}
        <div
          className="relative overflow-hidden rounded-3xl px-6 py-9 sm:p-9 flex flex-col items-center text-center gap-7 transition-all duration-1000"
          style={{
            background: `linear-gradient(155deg, ${RISK_HEX[peak.riskLevel]}14 0%, rgba(255,255,255,0.028) 55%)`,
            backdropFilter: "blur(24px)",
            border: `1px solid ${RISK_HEX[peak.riskLevel]}40`,
            boxShadow: `
              0 0 0 1px ${RISK_HEX[peak.riskLevel]}25,
              0 0 90px -8px ${RISK_HEX[peak.riskLevel]}66,
              inset 0 1px 0 rgba(255,255,255,0.07)
            `,
          }}
        >
          {/* Top colour wash */}
          <div
            className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
            style={{ background: `linear-gradient(to bottom, ${RISK_HEX[peak.riskLevel]}1a, transparent)` }}
          />

          {/* Pulsing status dot + label */}
          <div className="relative flex items-center gap-2.5">
            <span className="relative flex h-2 w-2">
              {peak.riskLevel !== "low" && (
                <span
                  className="absolute inline-flex h-full w-full rounded-full opacity-70 animate-ping"
                  style={{ background: RISK_HEX[peak.riskLevel] }}
                />
              )}
              <span
                className="relative inline-flex rounded-full h-2 w-2"
                style={{ background: RISK_HEX[peak.riskLevel], boxShadow: `0 0 6px ${RISK_HEX[peak.riskLevel]}` }}
              />
            </span>
            <p className="calm-label">Today&rsquo;s Forecast</p>
          </div>

          <RiskGauge score={peak.riskScore} level={peak.riskLevel} />

          <div className="relative">
            <h2 className="text-[26px] sm:text-[28px] font-semibold text-white/95 tracking-[-0.02em] leading-tight">
              {HEADLINE[peak.riskLevel]}
            </h2>
            <p className="mt-3 max-w-sm mx-auto text-[15px] sm:text-base text-white/65 leading-relaxed">
              {SUBLINE[peak.riskLevel]}
            </p>
          </div>
        </div>
      </div>

      {/* ── PERSONALISATION INSIGHT ── */}
      {forecast.personalized && forecast.checkinContributions && forecast.checkinContributions.length > 0 && (
        <CheckinInsight
          contributions={forecast.checkinContributions}
          delta={forecast.checkinDelta ?? 0}
        />
      )}

      {/* ── TODAY TIMELINE ── */}
      <div className="glass p-6">
        <p className="calm-label mb-5">Today at a glance</p>
        <div className="grid grid-cols-4 gap-3">
          {timeline.map(slot => (
            <div key={slot.label} className={`flex flex-col items-center gap-3 ${slot.isPast ? "opacity-35" : ""}`}>
              <Icon
                name={slot.icon}
                size={28}
                className={slot.score > 0 ? LEVEL_TEXT[slot.level] : "text-white/45"}
              />
              {/* Risk bar */}
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${slot.score > 0 ? LEVEL_COLOR[slot.level] : ""}`}
                  style={{ width: `${slot.score}%`, boxShadow: slot.score > 0 ? `0 0 6px ${RISK_HEX[slot.level]}` : "none" }}
                />
              </div>
              <p className="text-[14px] text-white/65 font-medium">{slot.label}</p>
              <p className={`text-[14px] font-semibold ${slot.score > 0 ? LEVEL_TEXT[slot.level] : "text-white/30"}`}>
                {slot.score > 0 ? LEVEL_LABEL[slot.level] : "—"}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── SINGLE TOP ACTION ── */}
      {topSuggestion && (
        <SuggestionCard suggestion={topSuggestion} prominent />
      )}

      {/* ── TOMORROW ── */}
      {tomorrow && (
        <div
          className="flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-700"
          style={{
            background: `${RISK_HEX[tomorrow.level]}0a`,
            border: `1px solid ${RISK_HEX[tomorrow.level]}25`,
          }}
        >
          <p className="text-[15px] font-medium" style={{ color: RISK_HEX[tomorrow.level] }}>
            {tomorrow.label}
          </p>
          <span
            className="text-[12px] font-semibold px-3 py-1 rounded-full"
            style={{ background: `${RISK_HEX[tomorrow.level]}1c`, color: RISK_HEX[tomorrow.level] }}
          >
            {tomorrow.score} / 100
          </span>
        </div>
      )}

      {/* ── CHECK-IN CTA ── */}
      <a href="/checkin"
        className="flex items-center justify-between px-6 py-4.5 rounded-2xl
                   bg-calm-sage/95 text-[#0a1f17] font-semibold text-[15px]
                   shadow-[0_0_36px_rgba(134,212,164,0.32)]
                   hover:bg-calm-sage active:scale-[0.98] transition-all">
        <span>Log today&rsquo;s check-in</span>
        <Icon name="arrow-right" size={20} className="opacity-80" />
      </a>

      {/* ── DETAILS (collapsed by default) ── */}
      <button
        onClick={() => setShowDetails(v => !v)}
        className="flex items-center justify-center gap-2 text-[15px] text-white/55 hover:text-white/80 transition-colors py-2"
      >
        <span>{showDetails ? "Hide details" : "See pressure & charts"}</span>
        <Icon name="chevron-down" size={16}
          className={`transition-transform ${showDetails ? "rotate-180" : ""}`} />
      </button>

      {showDetails && (
        <div className="flex flex-col gap-5">
          {/* 48h chart */}
          <div className="card">
            <p className="calm-label mb-4">48-Hour Pressure &amp; Risk</p>
            <PressureChart windows={windows} />
          </div>

          {/* Remaining suggestions */}
          {suggestions.length > 1 && (
            <div className="flex flex-col gap-3">
              <p className="calm-label">More gentle nudges</p>
              {suggestions.slice(1, 4).map(s => (
                <SuggestionCard key={s.id} suggestion={s} />
              ))}
            </div>
          )}

          {/* Quiet link to the evidence base */}
          <a href="/research"
            className="flex items-center justify-center gap-2 text-[14px] text-calm-sage/80 hover:text-calm-sage transition-colors py-2">
            <Icon name="spark" size={14} />
            <span>The research behind these numbers</span>
            <Icon name="arrow-right" size={13} className="opacity-70" />
          </a>
        </div>
      )}

    </div>
  );
}

/* ── Check-in insight card — explains how today's log moved the forecast ── */
function CheckinInsight({ contributions, delta }: { contributions: CheckinContribution[]; delta: number }) {
  // Pick a tone based on net direction
  const raising = delta > 0;
  const lowering = delta < 0;
  const accent  = raising ? "#dd9876" : lowering ? "#86d4a4" : "#7a9ab8";
  const heading = raising
    ? "Your check-in raised today's forecast"
    : lowering
    ? "Your check-in eased today's forecast"
    : "Your check-in is folded in";
  const sublead = raising
    ? "These factors are pulling your risk up. A few small choices can soften it."
    : lowering
    ? "Your routines are working in your favour. Keep going."
    : "Today's log is balancing the weather signal.";

  return (
    <div className="relative">
      {/* Ambient glow — same locked pattern as the hero */}
      <div
        className="absolute pointer-events-none"
        style={{
          inset: "-20px",
          background: `radial-gradient(ellipse at 50% 50%, ${accent}1f 0%, transparent 70%)`,
        }}
      />
      <div
        className="relative overflow-hidden rounded-3xl p-6 flex flex-col gap-4"
        style={{
          background: `linear-gradient(155deg, ${accent}10 0%, rgba(255,255,255,0.025) 55%)`,
          backdropFilter: "blur(24px)",
          border: `1px solid ${accent}28`,
          boxShadow: `0 0 50px -16px ${accent}38, inset 0 1px 0 rgba(255,255,255,0.05)`,
        }}
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: `${accent}1c`, border: `1px solid ${accent}40`, color: accent }}>
            <Icon name="spark" size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[16px] sm:text-[17px] font-semibold text-white/95">{heading}</p>
            <p className="text-[14px] sm:text-[15px] text-white/55 leading-relaxed mt-1">{sublead}</p>
          </div>
          {delta !== 0 && (
            <span className="text-[13px] font-semibold px-3 py-1 rounded-full whitespace-nowrap"
              style={{ background: `${accent}1c`, color: accent }}>
              {delta > 0 ? "+" : ""}{delta} pts
            </span>
          )}
        </div>

        <ul className="flex flex-col gap-2 pl-1">
          {contributions.map((c, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="mt-2 shrink-0 w-1.5 h-1.5 rounded-full"
                style={{ background: c.delta > 0 ? "#dd9876" : c.delta < 0 ? "#86d4a4" : "#7a9ab8" }} />
              <p className="text-[14px] sm:text-[15px] text-white/75 leading-relaxed">
                <span className="font-semibold text-white/90">{c.factor}</span>
                <span className="text-white/40"> · </span>
                <span>{c.note}</span>
              </p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ── Suggestion icon helper ─────────────────────────────────────────────── */
function suggestionIcon(category: string) {
  if (category === "preventive") return "shield" as const;
  if (category === "lifestyle")  return "leaf"   as const;
  if (category === "relief")     return "capsule" as const;
  return "spark" as const;
}

/* ── Reusable suggestion card ───────────────────────────────────────────── */
function SuggestionCard({ suggestion, prominent = false }: { suggestion: Suggestion; prominent?: boolean }) {
  return (
    <div className={`glass ${prominent ? "p-6" : "p-5"} flex gap-4 items-start`}>
      <div className="w-11 h-11 rounded-2xl bg-calm-sage/10 border border-calm-sage/25 text-calm-sage
                      flex items-center justify-center shrink-0">
        <Icon name={suggestionIcon(suggestion.category)} size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`${prominent ? "text-[16px]" : "text-[15px]"} font-semibold text-white/90 mb-1.5`}>
          {suggestion.title}
        </p>
        <p className="text-[14px] sm:text-[15px] text-white/55 leading-relaxed">
          {suggestion.detail}
        </p>
      </div>
    </div>
  );
}

/* ── Unit dropdown (reused for pressure & temp) ────────────────────────── */
interface DropOption { value: string; label: string; symbol: string; }
function UnitDropdown({ value, options, selected, onSelect, align = "left", variant = "chip" }: {
  value: string; options: DropOption[]; selected: string;
  onSelect: (v: string) => void; align?: "left" | "right";
  /** "chip" = bordered pill (default). "mini" = inline tappable text — for compact rows. */
  variant?: "chip" | "mini";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [open]);

  const triggerClass = variant === "mini"
    ? `inline-flex items-center gap-1 text-[12px] tabular-nums px-1 py-0.5 rounded-md transition-colors
       ${open ? "text-white/90 bg-white/[0.06]" : "text-white/55 hover:text-white/80"}`
    : `flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all
       ${open ? "border-calm-sage/40 bg-calm-sage/10 text-calm-sage" : "border-white/10 bg-white/5 text-white/55 hover:text-white/85"}`;

  return (
    <div ref={ref} className="relative inline-flex">
      <button onClick={() => setOpen(o => !o)} className={triggerClass}>
        {value}
        <svg viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth={1.5}
          className={`${variant === "mini" ? "w-2 h-2" : "w-2.5 h-2.5"} transition-transform ${open ? "rotate-180" : ""}`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2 3.5l3 3 3-3" />
        </svg>
      </button>

      {open && (
        <div className={`absolute top-full mt-2 z-50 min-w-[180px]
          bg-[rgba(8,19,34,0.98)] backdrop-blur-2xl border border-white/10 rounded-2xl overflow-hidden
          shadow-[0_16px_48px_rgba(0,0,0,0.7)] ${align === "right" ? "right-0" : "left-0"}`}>
          {options.map((opt, i) => (
            <button key={opt.value} onClick={() => { onSelect(opt.value); setOpen(false); }}
              className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors
                ${i < options.length - 1 ? "border-b border-white/[0.06]" : ""}
                ${selected === opt.value ? "bg-calm-sage/10 text-calm-sage" : "text-white/65 hover:bg-white/[0.05] hover:text-white"}`}>
              <span className="text-sm font-medium">{opt.label}</span>
              <span className={`text-xs font-bold ml-3 ${selected === opt.value ? "text-calm-sage" : "text-white/25"}`}>{opt.symbol}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
