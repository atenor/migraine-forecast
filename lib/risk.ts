import { getPressureDeltas, HourlyForecast } from "./weather";

export interface RiskWindow {
  hour: number; time: string;
  riskScore: number;
  riskLevel: "low" | "moderate" | "high" | "very-high";
  pressureHpa: number;
  pressureDelta24h: number;
  pressureDelta6h: number;
  explanation: string[];
}

export interface PersonalSensitivity {
  pressureThreshold: number;
  sleepWeight: number;
  stressWeight: number;
  dataPoints: number;
}

const DEFAULT: PersonalSensitivity = {
  pressureThreshold: 6,
  sleepWeight: 0.3,
  stressWeight: 0.2,
  dataPoints: 0,
};

/* ─── Today's check-in (all optional — we use whatever we have) ──────────── */
export interface TodayCheckIn {
  sleepHours?: number;        // 0-12
  sleepQuality?: number;      // 1-5
  stressLevel?: number;       // 1-5
  hydration?: number;         // 0-8 cups
  caffeine?: number;          // 0-5 cups
  alcohol?: number;           // 0-3 (none/1/2-3/4+)
  exercise?: boolean;
  menstrual?: boolean;
  screenTime?: number;        // 0-12 hours
  hasMigraine?: boolean;      // already underway?
}

/* What contributing factors did today's check-in surface? Used by UI to
   explain why the forecast moved up or down. */
export interface CheckinContribution {
  factor: string;
  delta: number;          // positive = adds risk, negative = reduces
  note: string;
}

/* ──────────────────────────────────────────────────────────────────────────
   Lifestyle modifier — folds today's check-in into the per-hour score.
   Returns: { delta, contributions } where delta is added to pressure score.
   Capped to ±25 so weather still drives the bulk of the forecast.
   ────────────────────────────────────────────────────────────────────────── */
export function lifestyleAdjustment(c?: TodayCheckIn): { delta: number; contributions: CheckinContribution[] } {
  if (!c) return { delta: 0, contributions: [] };
  const out: CheckinContribution[] = [];
  let delta = 0;

  // Hydration: 0-3 cups → +risk, 6-8 → -risk
  if (typeof c.hydration === "number") {
    if (c.hydration <= 2) {
      delta += 8; out.push({ factor: "Hydration", delta: 8, note: `Only ${c.hydration} cup${c.hydration === 1 ? "" : "s"} of water — dehydration amplifies pressure sensitivity.` });
    } else if (c.hydration <= 4) {
      delta += 3; out.push({ factor: "Hydration", delta: 3, note: "A little under-hydrated — keep sipping." });
    } else if (c.hydration >= 7) {
      delta -= 4; out.push({ factor: "Hydration", delta: -4, note: "Beautifully hydrated — well-protected." });
    }
  }

  // Caffeine: 0 = baseline, 1-2 = neutral/slightly protective, 3+ = trigger
  if (typeof c.caffeine === "number") {
    if (c.caffeine >= 4) {
      delta += 7; out.push({ factor: "Caffeine", delta: 7, note: `${c.caffeine} cups today — caffeine swings can trigger headaches.` });
    } else if (c.caffeine >= 3) {
      delta += 3; out.push({ factor: "Caffeine", delta: 3, note: "Caffeine is climbing — try to taper this afternoon." });
    }
  }

  // Alcohol: any is mildly inflammatory, 2-3 doubles risk, 4+ triples
  if (typeof c.alcohol === "number") {
    if (c.alcohol >= 3) {
      delta += 12; out.push({ factor: "Alcohol", delta: 12, note: "Several drinks — alcohol is a strong migraine trigger." });
    } else if (c.alcohol === 2) {
      delta += 6; out.push({ factor: "Alcohol", delta: 6, note: "A couple of drinks — drink extra water, eat well." });
    } else if (c.alcohol === 1) {
      delta += 2; out.push({ factor: "Alcohol", delta: 2, note: "One drink — small effect, stay hydrated." });
    }
  }

  // Sleep quality (separate from hours, which is already in main calc)
  if (typeof c.sleepQuality === "number" && c.sleepQuality <= 2) {
    delta += 5; out.push({ factor: "Sleep quality", delta: 5, note: "Restless night — body is more reactive today." });
  } else if (typeof c.sleepQuality === "number" && c.sleepQuality >= 5) {
    delta -= 3; out.push({ factor: "Sleep quality", delta: -3, note: "Deeply rested — your buffer is strong." });
  }

  // Exercise (gentle protective effect)
  if (c.exercise === true) {
    delta -= 3; out.push({ factor: "Exercise", delta: -3, note: "Movement today — circulation helps regulate pressure response." });
  }

  // Menstrual (known modifier)
  if (c.menstrual === true) {
    delta += 6; out.push({ factor: "Cycle", delta: 6, note: "Hormonal shifts often pair with weather sensitivity." });
  }

  // Screen time (trigger when high)
  if (typeof c.screenTime === "number" && c.screenTime >= 8) {
    delta += 4; out.push({ factor: "Screen time", delta: 4, note: `${c.screenTime}h of screens — eye strain compounds with pressure changes.` });
  }

  // Already migraining → cap floor higher
  if (c.hasMigraine === true) {
    delta += 10; out.push({ factor: "Active migraine", delta: 10, note: "You're already in it — be gentle and let your tools do their work." });
  }

  // Cap so weather remains the dominant signal
  if (delta > 25) delta = 25;
  if (delta < -15) delta = -15;
  return { delta, contributions: out };
}

export function computeRiskWindows(
  hourly: HourlyForecast[],
  sleepHours: number,
  stressLevel: number,
  sensitivity = DEFAULT,
  checkin?: TodayCheckIn,
): RiskWindow[] {
  const wd = getPressureDeltas(hourly);
  const { delta: lifestyleDelta, contributions } = lifestyleAdjustment(checkin);

  return wd.slice(0, 48).map((h, i) => {
    const expl: string[] = [];

    // Separate fall vs rise magnitudes (both positive numbers)
    const fall24 = Math.max(0, -h.delta24h);
    const fall6  = Math.max(0, -h.delta6h);
    const rise24 = Math.max(0,  h.delta24h);
    const rise6  = Math.max(0,  h.delta6h);

    // Fall score — well-established evidence, full weight
    const fallScore = (fall24 / sensitivity.pressureThreshold) * 50
                    + (fall6  / (sensitivity.pressureThreshold * 0.4)) * 20;

    // Rise score — real but affects ~30% of sensitive users; ~65% of fall weight
    const riseScore = (rise24 / sensitivity.pressureThreshold) * 32
                    + (rise6  / (sensitivity.pressureThreshold * 0.4)) * 13;

    const ps = Math.min(70, fallScore + riseScore);

    // Falling pressure explanations
    if (fall24 >= sensitivity.pressureThreshold * 0.8) expl.push(`Pressure dropping ${fall24.toFixed(1)} hPa over 24h — near your trigger threshold`);
    else if (fall24 >= sensitivity.pressureThreshold * 0.5) expl.push(`Moderate pressure drop (${fall24.toFixed(1)} hPa/24h)`);
    if (fall6 >= sensitivity.pressureThreshold * 0.3) expl.push(`Rapid drop in last 6h: ${fall6.toFixed(1)} hPa`);

    // Rising pressure explanations — flag for users who are high-pressure sensitive
    if (rise24 >= sensitivity.pressureThreshold * 1.0) expl.push(`Pressure rising ${rise24.toFixed(1)} hPa over 24h — elevated for high-pressure-sensitive users`);
    else if (rise24 >= sensitivity.pressureThreshold * 0.6) expl.push(`Notable pressure rise (${rise24.toFixed(1)} hPa/24h) — some users are rise-sensitive`);
    if (rise6 >= sensitivity.pressureThreshold * 0.4) expl.push(`Rapid pressure rise in last 6h: ${rise6.toFixed(1)} hPa`);

    const sd = Math.max(0, 7.5 - sleepHours);
    const ss = Math.min(15, sd * sensitivity.sleepWeight * 10);
    if (sd > 1.5) expl.push(`Sleep deficit (${sleepHours}h)`);

    const stressS = Math.min(15, ((stressLevel - 1) / 4) * 15 * sensitivity.stressWeight * (1 / 0.2));
    if (stressLevel >= 4) expl.push(`High stress (${stressLevel}/5)`);

    // Add lifestyle contributions to today's hours only (first 24)
    const lifestyleApplied = i < 24 ? lifestyleDelta : 0;
    if (lifestyleApplied !== 0 && i === 0) {
      contributions.forEach(co => expl.push(co.note));
    }

    const raw = Math.round(Math.max(0, Math.min(100, ps + ss + stressS + lifestyleApplied)));
    let riskLevel: RiskWindow["riskLevel"] = "low";
    if (raw >= 70) riskLevel = "very-high";
    else if (raw >= 50) riskLevel = "high";
    else if (raw >= 30) riskLevel = "moderate";

    if (!expl.length) expl.push("Conditions appear stable — low migraine risk");
    return {
      hour: i, time: h.time, riskScore: raw, riskLevel,
      pressureHpa: h.pressureHpa, pressureDelta24h: h.delta24h, pressureDelta6h: h.delta6h,
      explanation: expl,
    };
  });
}

export function computePersonalSensitivity(logs: Array<{ hasMigraine: boolean; pressureAtLog: number; sleepHours: number; stressLevel: number }>): PersonalSensitivity {
  const ml = logs.filter(l => l.hasMigraine && l.pressureAtLog > 0);
  if (ml.length < 10) return DEFAULT;
  const ma = ml.reduce((s, l) => s + l.pressureAtLog, 0) / ml.length;
  const nl = logs.filter(l => !l.hasMigraine && l.pressureAtLog > 0);
  const na = nl.length > 0 ? nl.reduce((s, l) => s + l.pressureAtLog, 0) / nl.length : ma + 8;
  return { pressureThreshold: Math.max(3, Math.abs(na - ma) * 0.7), sleepWeight: 0.35, stressWeight: 0.25, dataPoints: ml.length };
}

export function peakRiskNext24h(windows: RiskWindow[]) {
  return windows.slice(0, 24).reduce((max, w) => w.riskScore > max.riskScore ? w : max, windows[0]);
}
