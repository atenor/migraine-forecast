"use client";
import { useState, useEffect, useRef } from "react";
import { RELIEF_METHOD_OPTIONS } from "@/lib/suggestions";
import { getCustomOptions, addCustomOption } from "@/lib/custom-options";
import Icon from "./Icon";

// ── Types ─────────────────────────────────────────────────────────────────────
type CheckinRole = "morning" | "midday" | "evening";

type Log = {
  date: string;
  checkinRole: string;
  sleepHours: number;
  sleepQuality: number;
  stressLevel: number;
  hydration: number;
  caffeine: number;
  alcohol: number;
  medications: string[];
  exercise: boolean;
  menstrual: boolean;
  prodrome: string[];
  notes: string;
  hasMigraine: boolean;
  migraineSeverity: number;
  migraineDuration: number;
  migraineLocation: string;
  reliefMethods: string[];
  reliefRating: number;
  pressureAtLog: number;
};

const DEFAULTS: Log = {
  date: new Date().toISOString().slice(0, 10),
  checkinRole: "",
  sleepHours: 7, sleepQuality: 3, stressLevel: 2,
  hydration: 0, caffeine: 0, alcohol: 0,
  medications: [], exercise: false, menstrual: false, prodrome: [],
  notes: "", hasMigraine: false,
  migraineSeverity: 0, migraineDuration: 0, migraineLocation: "",
  reliefMethods: [], reliefRating: 0, pressureAtLog: 0,
};

// ── Role detection ─────────────────────────────────────────────────────────────
function detectRole(): CheckinRole {
  const h = new Date().getHours();
  if (h < 11) return "morning";
  if (h < 17) return "midday";
  return "evening";
}

// ── Step definitions ───────────────────────────────────────────────────────────
type StepId =
  | "sleep-quality" | "sleep-hours"
  | "stress" | "hydration" | "caffeine" | "alcohol"
  | "exercise" | "menstrual" | "medications"
  | "prodrome"
  | "migraine" | "migraine-location" | "severity" | "relief"
  | "done";

function getSteps(role: CheckinRole, hasMigraine: boolean, migraineMode: boolean): StepId[] {
  if (migraineMode) {
    return ["migraine-location", "severity", "relief", "done"];
  }

  const base: StepId[] =
    role === "morning"
      ? ["sleep-quality", "sleep-hours", "stress", "hydration", "caffeine", "alcohol", "exercise", "prodrome", "migraine"]
      : role === "midday"
      ? ["stress", "hydration", "caffeine", "prodrome", "migraine"]
      : ["stress", "sleep-quality", "sleep-hours", "hydration", "caffeine", "alcohol", "exercise", "menstrual", "medications", "migraine"];

  if (hasMigraine) {
    const idx = base.indexOf("migraine");
    base.splice(idx + 1, 0, "migraine-location", "severity", "relief");
  }

  base.push("done");
  return base;
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function CheckinForm({ migraineMode = false }: { migraineMode?: boolean }) {
  const [role, setRole]     = useState<CheckinRole>("morning");
  const [log, setLog]       = useState<Log>({ ...DEFAULTS, hasMigraine: migraineMode });
  const [stepIdx, setStepIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState(false);

  // Correct role and checkinRole on client (avoids SSR mismatch)
  useEffect(() => {
    const r = detectRole();
    setRole(r);
    setLog(prev => ({ ...prev, checkinRole: migraineMode ? "migraine" : r }));
  }, [migraineMode]);

  // Auto-capture current pressure
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async pos => {
      try {
        const r = await fetch(`/api/forecast?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
        const d = await r.json();
        if (d.current?.pressureHpa) set("pressureAtLog", d.current.pressureHpa);
      } catch { /* silent */ }
    });
  }, []);

  const steps = getSteps(role, log.hasMigraine, migraineMode);
  const step  = steps[stepIdx];

  const set = <K extends keyof Log>(k: K, v: Log[K]) =>
    setLog(prev => ({ ...prev, [k]: v }));

  const next = () => setStepIdx(i => Math.min(i + 1, steps.length - 1));
  const back = () => setStepIdx(i => Math.max(i - 1, 0));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(log),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
    } catch {
      setError(true);
    } finally {
      setSaving(false);
    }
  };

  const totalSteps = steps.length - 1;
  const progress   = totalSteps > 1
    ? (Math.min(stepIdx, totalSteps - 1) / (totalSteps - 1)) * 100
    : 100;

  const toggleArr = <K extends "medications" | "prodrome" | "reliefMethods">(
    k: K, val: string
  ) => {
    const arr = log[k] as string[];
    set(k, (arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]) as Log[K]);
  };

  return (
    <div className="flex flex-col gap-6 max-w-lg mx-auto">

      {/* Progress */}
      {step !== "done" && (
        <div className="w-full h-0.5 bg-white/10 rounded-full overflow-hidden">
          <div className="h-full bg-calm-teal rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }} />
        </div>
      )}

      {/* Step card */}
      <div className="glass p-7 min-h-[320px] flex flex-col justify-between gap-6">

        {step === "sleep-quality" && (
          <StepSleepQuality
            value={log.sleepQuality}
            role={role}
            onChange={v => { set("sleepQuality", v); next(); }}
          />
        )}
        {step === "sleep-hours" && (
          <StepSleepHours
            value={log.sleepHours}
            onChange={v => set("sleepHours", v)}
            onNext={next}
          />
        )}
        {step === "stress" && (
          <StepStress
            value={log.stressLevel}
            role={role}
            onChange={v => { set("stressLevel", v); next(); }}
          />
        )}
        {step === "hydration" && (
          <StepHydration
            value={log.hydration}
            role={role}
            onChange={v => { set("hydration", v); next(); }}
          />
        )}
        {step === "caffeine" && (
          <StepCaffeine
            value={log.caffeine}
            onChange={v => { set("caffeine", v); next(); }}
          />
        )}
        {step === "alcohol" && (
          <StepAlcohol
            value={log.alcohol}
            role={role}
            onChange={v => { set("alcohol", v); next(); }}
          />
        )}
        {step === "exercise" && (
          <StepExercise
            value={log.exercise}
            role={role}
            onChange={v => { set("exercise", v); next(); }}
          />
        )}
        {step === "menstrual" && (
          <StepMenstrual
            value={log.menstrual}
            onChange={v => { set("menstrual", v); next(); }}
            onSkip={next}
          />
        )}
        {step === "medications" && (
          <StepMedications
            selected={log.medications}
            onToggle={m => toggleArr("medications", m)}
            onNext={next}
          />
        )}
        {step === "prodrome" && (
          <StepProdrome
            selected={log.prodrome}
            onToggle={s => {
              if (s === "none") { set("prodrome", []); next(); return; }
              const next_ = log.prodrome.includes(s)
                ? log.prodrome.filter(x => x !== s)
                : log.prodrome.filter(x => x !== "none").concat(s);
              set("prodrome", next_);
            }}
            onNext={next}
          />
        )}
        {step === "migraine" && (
          <StepMigraine
            value={log.hasMigraine}
            role={role}
            onChange={v => { set("hasMigraine", v); next(); }}
          />
        )}
        {step === "migraine-location" && (
          <StepMigraineLocation
            value={log.migraineLocation}
            onChange={v => { set("migraineLocation", v); next(); }}
          />
        )}
        {step === "severity" && (
          <StepSeverity
            value={log.migraineSeverity}
            onChange={v => set("migraineSeverity", v)}
            onNext={next}
          />
        )}
        {step === "relief" && (
          <StepRelief
            selected={log.reliefMethods}
            onToggle={m => toggleArr("reliefMethods", m)}
            onNext={next}
          />
        )}
        {step === "done" && (
          <StepDone
            log={log}
            saving={saving}
            saved={saved}
            error={error}
            onSave={save}
          />
        )}
      </div>

      {/* Back */}
      {stepIdx > 0 && step !== "done" && (
        <button onClick={back}
          className="text-xs text-white/25 hover:text-white/50 text-center transition-colors">
          ← Back
        </button>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// STEP COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

// ── Sleep quality ─────────────────────────────────────────────────────────────
const SLEEP_OPTS = [
  { value: 1, emoji: "😫", label: "Rough" },
  { value: 2, emoji: "😕", label: "Poor" },
  { value: 3, emoji: "😐", label: "OK" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "😊", label: "Great" },
];

function StepSleepQuality({ value, role, onChange }: {
  value: number; role: CheckinRole; onChange: (v: number) => void;
}) {
  const q = role === "evening" ? "How did you sleep last night?" : "How did you sleep?";
  return (
    <>
      <StepHeader q={q} hint="Tap to continue" />
      <div className="grid grid-cols-5 gap-2">
        {SLEEP_OPTS.map(o => (
          <button key={o.value} onClick={() => onChange(o.value)}
            className={`flex flex-col items-center gap-2 py-4 rounded-2xl border transition-all duration-150
              ${value === o.value
                ? "bg-calm-teal/15 border-calm-teal/40 scale-105"
                : "bg-white/[0.03] border-white/10 hover:border-white/25"}`}>
            <span className="text-2xl">{o.emoji}</span>
            <span className={`text-[10px] font-medium ${value === o.value ? "text-calm-teal" : "text-white/40"}`}>
              {o.label}
            </span>
          </button>
        ))}
      </div>
    </>
  );
}

// ── Sleep hours ───────────────────────────────────────────────────────────────
function StepSleepHours({ value, onChange, onNext }: {
  value: number; onChange: (v: number) => void; onNext: () => void;
}) {
  const hrs = [3,3.5,4,4.5,5,5.5,6,6.5,7,7.5,8,8.5,9,9.5,10,10.5,11,12];
  const label = (h: number) => h % 1 === 0 ? `${h}h` : `${Math.floor(h)}½`;
  return (
    <>
      <StepHeader q="How many hours?" hint="Select the closest" />
      <div className="grid grid-cols-6 gap-1.5">
        {hrs.map(h => (
          <button key={h} onClick={() => onChange(h)}
            className={`py-3 rounded-xl border text-sm font-semibold transition-all duration-150
              ${value === h
                ? "bg-calm-teal/15 border-calm-teal/40 text-calm-teal scale-105"
                : "bg-white/[0.03] border-white/10 text-white/50 hover:border-white/25"}`}>
            {label(h)}
          </button>
        ))}
      </div>
      <NextButton onClick={onNext} />
    </>
  );
}

// ── Stress (3-option) ─────────────────────────────────────────────────────────
const STRESS_OPTS = [
  { value: 1, emoji: "😌", label: "Calm" },
  { value: 3, emoji: "😐", label: "Moderate" },
  { value: 5, emoji: "😰", label: "Stressed" },
];

function StepStress({ value, role, onChange }: {
  value: number; role: CheckinRole; onChange: (v: number) => void;
}) {
  const q = role === "morning" ? "How are you feeling this morning?"
          : role === "midday"  ? "How's your stress right now?"
          :                      "How was today overall?";
  return (
    <>
      <StepHeader q={q} hint="Tap to continue" />
      <div className="grid grid-cols-3 gap-3">
        {STRESS_OPTS.map(o => (
          <button key={o.value} onClick={() => onChange(o.value)}
            className={`flex flex-col items-center gap-3 py-6 rounded-2xl border transition-all duration-150
              ${value === o.value
                ? "bg-calm-rose/15 border-calm-rose/30 scale-105"
                : "bg-white/[0.03] border-white/10 hover:border-white/25"}`}>
            <span className="text-3xl">{o.emoji}</span>
            <span className={`text-[13px] font-semibold ${value === o.value ? "text-calm-rose" : "text-white/50"}`}>
              {o.label}
            </span>
          </button>
        ))}
      </div>
    </>
  );
}

// ── Hydration ─────────────────────────────────────────────────────────────────
function StepHydration({ value, role, onChange }: {
  value: number; role: CheckinRole; onChange: (v: number) => void;
}) {
  // Morning: coarse yesterday estimate (Low/Okay/Good → mapped to 2/5/8)
  if (role === "morning") {
    const opts = [
      { mapped: 2, label: "Low", emoji: "💧", detail: "Under-hydrated" },
      { mapped: 5, label: "Okay", emoji: "💧💧", detail: "About average" },
      { mapped: 8, label: "Good", emoji: "💧💧💧", detail: "Well-hydrated" },
    ];
    return (
      <>
        <StepHeader q="How was your hydration yesterday?" hint="Rough estimate is fine" />
        <div className="grid grid-cols-3 gap-3">
          {opts.map(o => (
            <button key={o.mapped} onClick={() => onChange(o.mapped)}
              className={`flex flex-col items-center gap-2 py-6 rounded-2xl border transition-all duration-150
                ${value === o.mapped
                  ? "bg-calm-teal/15 border-calm-teal/40 scale-105"
                  : "bg-white/[0.03] border-white/10 hover:border-white/25"}`}>
              <span className="text-xl">{o.emoji}</span>
              <span className={`text-sm font-semibold ${value === o.mapped ? "text-calm-teal" : "text-white/60"}`}>
                {o.label}
              </span>
              <span className={`text-[11px] ${value === o.mapped ? "text-calm-teal/70" : "text-white/30"}`}>
                {o.detail}
              </span>
            </button>
          ))}
        </div>
        <SkipButton onSkip={() => onChange(0)} label="Not sure — skip" />
      </>
    );
  }

  // Midday/Evening: cups counter
  const q    = role === "midday" ? "Water so far today?" : "Water all day today?";
  const cups = [0,1,2,3,4,5,6,7,8];
  const color = (n: number) => n <= 2 ? "rose" : n <= 4 ? "gold" : "teal";

  return (
    <>
      <StepHeader q={q} hint="8 oz cups" />
      <div className="grid grid-cols-3 gap-3">
        {cups.map(n => {
          const c = color(n);
          return (
            <button key={n} onClick={() => onChange(n)}
              className={`flex items-center justify-center gap-2.5 py-4 rounded-2xl border transition-all duration-150
                ${value === n
                  ? c === "teal" ? "bg-calm-teal/15 border-calm-teal/40 scale-[1.03]"
                  : c === "gold" ? "bg-calm-honey/15 border-calm-honey/40 scale-[1.03]"
                  :                "bg-calm-rose/15 border-calm-rose/40 scale-[1.03]"
                  : "bg-white/[0.03] border-white/10 hover:border-white/25"}`}>
              <Icon name="drop" size={18}
                className={value === n
                  ? c === "teal" ? "text-calm-teal" : c === "gold" ? "text-calm-honey" : "text-calm-rose"
                  : "text-white/35"} />
              <span className={`text-lg font-bold tabular-nums
                ${value === n
                  ? c === "teal" ? "text-calm-teal" : c === "gold" ? "text-calm-honey" : "text-calm-rose"
                  : "text-white/50"}`}>
                {n}
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-[13px] text-white/40 text-center">
        {value === 0 ? "None yet — that's okay, keep sipping"
         : value <= 2 ? "A little low — keep going"
         : value <= 4 ? "Getting there"
         : "Well hydrated 👍"}
      </p>
    </>
  );
}

// ── Caffeine ──────────────────────────────────────────────────────────────────
const CAFFEINE_OPTS = [
  { value: 0, label: "None",  detail: "No caffeine today" },
  { value: 1, label: "1–2",   detail: "cups or drinks" },
  { value: 3, label: "3+",    detail: "cups or drinks" },
];

function StepCaffeine({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <>
      <StepHeader q="Any caffeine today?" hint="Coffee, tea, energy drinks — all count" />
      <div className="grid grid-cols-3 gap-3">
        {CAFFEINE_OPTS.map(o => (
          <button key={o.value} onClick={() => onChange(o.value)}
            className={`flex flex-col items-center gap-2 py-6 rounded-2xl border transition-all duration-150
              ${value === o.value
                ? "bg-calm-honey/15 border-calm-honey/40 scale-105"
                : "bg-white/[0.03] border-white/10 hover:border-white/25"}`}>
            <span className="text-xl">☕</span>
            <span className={`text-[15px] font-bold ${value === o.value ? "text-calm-honey" : "text-white/60"}`}>
              {o.label}
            </span>
            <span className={`text-[11px] ${value === o.value ? "text-calm-honey/70" : "text-white/30"}`}>
              {o.detail}
            </span>
          </button>
        ))}
      </div>
    </>
  );
}

// ── Alcohol ───────────────────────────────────────────────────────────────────
const ALCOHOL_OPTS = [
  { value: 0, label: "None",  glasses: 0 },
  { value: 1, label: "1",     glasses: 1 },
  { value: 2, label: "2–3",   glasses: 2 },
  { value: 3, label: "4+",    glasses: 3 },
];

function StepAlcohol({ value, role, onChange }: {
  value: number; role: CheckinRole; onChange: (v: number) => void;
}) {
  const q = role === "morning" ? "Any alcohol last night?" : "Any alcohol today?";
  return (
    <>
      <StepHeader q={q} />
      <div className="grid grid-cols-4 gap-2">
        {ALCOHOL_OPTS.map(o => (
          <button key={o.value} onClick={() => onChange(o.value)}
            className={`flex flex-col items-center gap-2.5 py-5 rounded-2xl border transition-all duration-150
              ${value === o.value
                ? "bg-calm-honey/15 border-calm-honey/45 scale-105"
                : "bg-white/[0.03] border-white/10 hover:border-white/25"}`}>
            <div className="flex items-end justify-center gap-0.5 h-5">
              {o.glasses === 0
                ? <span className={`text-[16px] ${value === o.value ? "text-calm-honey" : "text-white/35"}`}>—</span>
                : Array.from({ length: o.glasses }).map((_, i) => (
                    <Icon key={i} name="glass" size={14}
                      className={value === o.value ? "text-calm-honey" : "text-white/40"} />
                  ))
              }
            </div>
            <span className={`text-[13px] font-semibold ${value === o.value ? "text-calm-honey" : "text-white/55"}`}>
              {o.label}
            </span>
          </button>
        ))}
      </div>
      <PrivacyNote />
    </>
  );
}

// ── Exercise ──────────────────────────────────────────────────────────────────
function StepExercise({ value, role, onChange }: {
  value: boolean; role: CheckinRole; onChange: (v: boolean) => void;
}) {
  const q = role === "morning" ? "Did you exercise yesterday?" : "Did you exercise today?";
  return (
    <>
      <StepHeader q={q} hint="Any movement counts — walk, gym, yoga" />
      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => onChange(true)}
          className={`flex flex-col items-center gap-3 py-8 rounded-2xl border text-base font-semibold transition-all duration-150
            ${value === true
              ? "bg-calm-sage/15 border-calm-sage/40 text-calm-sage scale-105"
              : "bg-white/[0.03] border-white/10 text-white/50 hover:border-white/25"}`}>
          <span className="text-4xl">🏃</span>
          Yes
        </button>
        <button onClick={() => onChange(false)}
          className={`flex flex-col items-center gap-3 py-8 rounded-2xl border text-base font-semibold transition-all duration-150
            ${value === false
              ? "bg-white/[0.08] border-white/25 text-white/80 scale-105"
              : "bg-white/[0.03] border-white/10 text-white/50 hover:border-white/25"}`}>
          <span className="text-4xl">🛋️</span>
          Not today
        </button>
      </div>
    </>
  );
}

// ── Menstrual ─────────────────────────────────────────────────────────────────
function StepMenstrual({ value, onChange, onSkip }: {
  value: boolean; onChange: (v: boolean) => void; onSkip: () => void;
}) {
  return (
    <>
      <StepHeader q="Are you currently in your cycle?" hint="Hormonal shifts are a significant migraine factor" />
      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => onChange(true)}
          className={`flex flex-col items-center gap-3 py-8 rounded-2xl border text-base font-semibold transition-all duration-150
            ${value === true
              ? "bg-calm-rose/15 border-calm-rose/40 text-calm-rose scale-105"
              : "bg-white/[0.03] border-white/10 text-white/50 hover:border-white/25"}`}>
          <span className="text-3xl">🌸</span>
          Yes
        </button>
        <button onClick={() => onChange(false)}
          className={`flex flex-col items-center gap-3 py-8 rounded-2xl border text-base font-semibold transition-all duration-150
            ${value === false
              ? "bg-white/[0.08] border-white/25 text-white/80 scale-105"
              : "bg-white/[0.03] border-white/10 text-white/50 hover:border-white/25"}`}>
          <span className="text-3xl">✕</span>
          No
        </button>
      </div>
      <SkipButton onSkip={onSkip} label="Doesn't apply to me" />
    </>
  );
}

// ── Prodrome ──────────────────────────────────────────────────────────────────
const PRODROME_SYMPTOMS = [
  { key: "yawning",     label: "Yawning a lot",         emoji: "🥱" },
  { key: "cravings",    label: "Food cravings",          emoji: "🍫" },
  { key: "mood",        label: "Mood shift",             emoji: "😶‍🌫️" },
  { key: "neck",        label: "Neck stiffness",         emoji: "🤕" },
  { key: "fog",         label: "Brain fog",              emoji: "🌫️" },
  { key: "sensitivity", label: "Light or sound sensitive", emoji: "🔆" },
  { key: "thirst",      label: "Unusual thirst",         emoji: "💧" },
];

function StepProdrome({ selected, onToggle, onNext }: {
  selected: string[]; onToggle: (key: string) => void; onNext: () => void;
}) {
  return (
    <>
      <StepHeader q="Any of these right now?" />
      <div className="flex flex-col gap-1">
        <p className="text-[12px] text-calm-teal/80 text-center mb-1 leading-relaxed">
          These can appear 12–48 hours before a migraine. Tracking them improves your forecast.
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {PRODROME_SYMPTOMS.map(s => (
            <button key={s.key} onClick={() => onToggle(s.key)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-full border text-[13px] font-medium transition-all duration-150
                ${selected.includes(s.key)
                  ? "bg-calm-honey/15 border-calm-honey/40 text-calm-honey"
                  : "bg-white/[0.03] border-white/10 text-white/50 hover:border-white/25"}`}>
              <span>{s.emoji}</span>
              {s.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between gap-3">
        <button onClick={() => onToggle("none")}
          className="text-sm text-white/35 hover:text-white/60 transition-colors underline-offset-2 hover:underline">
          None of these
        </button>
        <NextButton onClick={onNext} label={selected.length > 0 ? `Next → (${selected.length})` : "None — skip →"} />
      </div>
    </>
  );
}

// ── Medications ───────────────────────────────────────────────────────────────
const MED_OPTIONS = [
  "None today",
  "Ibuprofen / Advil",
  "Acetaminophen / Tylenol",
  "Aspirin / Excedrin",
  "Triptan (e.g. Sumatriptan)",
  "CGRP medication",
  "Beta blocker",
  "Antidepressant",
  "Magnesium / supplement",
  "Cannabis",
];

function StepMedications({ selected, onToggle, onNext }: {
  selected: string[]; onToggle: (m: string) => void; onNext: () => void;
}) {
  const [custom, setCustom] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft]   = useState("");
  const inputRef            = useRef<HTMLInputElement>(null);

  useEffect(() => { setCustom(getCustomOptions("medications")); }, []);
  useEffect(() => { if (adding) inputRef.current?.focus(); }, [adding]);

  const noneSelected = selected.includes("None today");

  const handleToggle = (m: string) => {
    if (m === "None today") { if (!noneSelected) onToggle("None today"); return; }
    if (noneSelected) onToggle("None today");
    onToggle(m);
  };

  const saveCustom = () => {
    const val = draft.trim();
    if (!val) { setAdding(false); return; }
    addCustomOption("medications", val);
    setCustom(getCustomOptions("medications"));
    if (noneSelected) onToggle("None today");
    if (!selected.includes(val)) onToggle(val);
    setDraft(""); setAdding(false);
  };

  return (
    <>
      <StepHeader q="Any medications today?" hint="Prescription or over-the-counter" />
      <div className="flex flex-wrap gap-2">
        {[...MED_OPTIONS, ...custom].map(m => (
          <button key={m} onClick={() => handleToggle(m)}
            className={`text-[13px] px-3.5 py-1.5 rounded-full border transition-all duration-150
              ${selected.includes(m)
                ? "bg-calm-teal/15 border-calm-teal/40 text-calm-teal"
                : "bg-white/5 border-white/10 text-white/50 hover:border-white/25"}`}>
            {m}
          </button>
        ))}
        {adding ? (
          <div className="flex items-center gap-2">
            <input ref={inputRef} value={draft} onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") saveCustom(); if (e.key === "Escape") setAdding(false); }}
              placeholder="Type medication…"
              className="calm-input text-sm py-1.5 px-3 w-40 rounded-full" />
            <button onClick={saveCustom} className="text-xs text-calm-teal">Add</button>
            <button onClick={() => { setAdding(false); setDraft(""); }} className="text-xs text-white/30">✕</button>
          </div>
        ) : (
          <button onClick={() => setAdding(true)}
            className="text-[13px] px-3.5 py-1.5 rounded-full border border-dashed border-white/15 text-white/35 hover:border-white/30 transition-all">
            + Other…
          </button>
        )}
      </div>
      <div className="flex items-center justify-between gap-4">
        <PrivacyNote />
        <NextButton onClick={onNext} label={selected.length === 0 ? "Skip →" : "Next →"} />
      </div>
    </>
  );
}

// ── Migraine Y/N ──────────────────────────────────────────────────────────────
function StepMigraine({ value, role, onChange }: {
  value: boolean; role: CheckinRole; onChange: (v: boolean) => void;
}) {
  const q = role === "morning"
    ? "Any migraine this morning or right now?"
    : "Any migraine today?";
  return (
    <>
      <StepHeader q={q} hint="Tap to continue" />
      <div className="grid grid-cols-2 gap-4">
        <button onClick={() => onChange(true)}
          className={`flex flex-col items-center gap-3 py-8 rounded-2xl border text-base font-semibold transition-all duration-150
            ${value === true
              ? "bg-calm-rose/15 border-calm-rose/40 text-calm-rose scale-105"
              : "bg-white/[0.03] border-white/10 text-white/50 hover:border-white/25"}`}>
          <span className="text-4xl">⚡</span>
          Yes
        </button>
        <button onClick={() => onChange(false)}
          className={`flex flex-col items-center gap-3 py-8 rounded-2xl border text-base font-semibold transition-all duration-150
            ${value === false
              ? "bg-calm-teal/15 border-calm-teal/40 text-calm-teal scale-105"
              : "bg-white/[0.03] border-white/10 text-white/50 hover:border-white/25"}`}>
          <span className="text-4xl">✅</span>
          Clear
        </button>
      </div>
    </>
  );
}

// ── Migraine location ─────────────────────────────────────────────────────────
const LOCATION_OPTS = [
  { value: "left",  label: "Left side",     emoji: "◀️" },
  { value: "right", label: "Right side",    emoji: "▶️" },
  { value: "both",  label: "Both sides",    emoji: "↔️" },
  { value: "back",  label: "Back of head",  emoji: "⬇️" },
  { value: "wrap",  label: "Wraps around",  emoji: "🔄" },
];

function StepMigraineLocation({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <>
      <StepHeader q="Where is the pain?" hint="Tap to continue" />
      <div className="grid grid-cols-1 gap-2">
        {LOCATION_OPTS.map(o => (
          <button key={o.value} onClick={() => onChange(o.value)}
            className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl border text-left transition-all duration-150
              ${value === o.value
                ? "bg-calm-rose/15 border-calm-rose/40 scale-[1.02]"
                : "bg-white/[0.03] border-white/10 hover:border-white/25"}`}>
            <span className="text-xl">{o.emoji}</span>
            <span className={`text-[15px] font-medium ${value === o.value ? "text-calm-rose" : "text-white/65"}`}>
              {o.label}
            </span>
          </button>
        ))}
      </div>
      <SkipButton onSkip={() => onChange("")} label="Not sure — skip" />
    </>
  );
}

// ── Severity ──────────────────────────────────────────────────────────────────
function StepSeverity({ value, onChange, onNext }: {
  value: number; onChange: (v: number) => void; onNext: () => void;
}) {
  return (
    <>
      <StepHeader q="How bad is it?" hint="1 = mild  ·  10 = severe" />
      <div className="grid grid-cols-5 gap-2">
        {[1,2,3,4,5,6,7,8,9,10].map(n => {
          const tone = n <= 3 ? "teal" : n <= 6 ? "gold" : "rose";
          return (
            <button key={n} onClick={() => onChange(n)}
              className={`py-4 rounded-2xl border text-lg font-bold transition-all duration-150
                ${value === n
                  ? tone === "teal" ? "bg-calm-teal/15 border-calm-teal/40 text-calm-teal scale-105"
                  : tone === "gold" ? "bg-calm-honey/15 border-calm-honey/40 text-calm-honey scale-105"
                  :                   "bg-calm-rose/15 border-calm-rose/40 text-calm-rose scale-105"
                  : "bg-white/[0.03] border-white/10 text-white/40 hover:border-white/25"}`}>
              {n}
            </button>
          );
        })}
      </div>
      <NextButton onClick={onNext} label={value === 0 ? "Skip →" : "Next →"} />
    </>
  );
}

// ── Relief ────────────────────────────────────────────────────────────────────
function StepRelief({ selected, onToggle, onNext }: {
  selected: string[]; onToggle: (m: string) => void; onNext: () => void;
}) {
  const [custom, setCustom] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft]   = useState("");
  const inputRef            = useRef<HTMLInputElement>(null);

  useEffect(() => { setCustom(getCustomOptions("relief")); }, []);
  useEffect(() => { if (adding) inputRef.current?.focus(); }, [adding]);

  const saveCustom = () => {
    const val = draft.trim();
    if (!val) { setAdding(false); return; }
    addCustomOption("relief", val);
    setCustom(getCustomOptions("relief"));
    if (!selected.includes(val)) onToggle(val);
    setDraft(""); setAdding(false);
  };

  const handleToggle = (m: string) => {
    if (m === "Nothing helped") {
      selected.filter(s => s !== "Nothing helped").forEach(s => onToggle(s));
      if (!selected.includes("Nothing helped")) onToggle("Nothing helped");
    } else {
      if (selected.includes("Nothing helped")) onToggle("Nothing helped");
      onToggle(m);
    }
  };

  return (
    <>
      <StepHeader q="What helped?" hint="Select all that apply" />
      <div className="flex flex-wrap gap-2">
        {[...RELIEF_METHOD_OPTIONS, ...custom].map(m => (
          <button key={m} onClick={() => handleToggle(m)}
            className={`text-[13px] px-3.5 py-1.5 rounded-full border transition-all duration-150
              ${selected.includes(m)
                ? "bg-calm-teal/15 border-calm-teal/40 text-calm-teal"
                : "bg-white/5 border-white/10 text-white/50 hover:border-white/25"}`}>
            {m}
          </button>
        ))}
        {adding ? (
          <div className="flex items-center gap-2">
            <input ref={inputRef} value={draft} onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") saveCustom(); if (e.key === "Escape") setAdding(false); }}
              placeholder="What helped?"
              className="calm-input text-sm py-1.5 px-3 w-40 rounded-full" />
            <button onClick={saveCustom} className="text-xs text-calm-teal">Add</button>
            <button onClick={() => { setAdding(false); setDraft(""); }} className="text-xs text-white/30">✕</button>
          </div>
        ) : (
          <button onClick={() => setAdding(true)}
            className="text-[13px] px-3.5 py-1.5 rounded-full border border-dashed border-white/15 text-white/35 hover:border-white/30 transition-all">
            + Other…
          </button>
        )}
      </div>
      <NextButton onClick={onNext} label={selected.length === 0 ? "Skip →" : "Next →"} />
    </>
  );
}

// ── Done / Save ───────────────────────────────────────────────────────────────
function StepDone({ log, saving, saved, error, onSave }: {
  log: Log; saving: boolean; saved: boolean; error: boolean; onSave: () => void;
}) {
  const sleepOpt  = SLEEP_OPTS.find(o => o.value === log.sleepQuality);
  const stressOpt = STRESS_OPTS.find(o => o.value === log.stressLevel);

  if (saved) return (
    <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
      <span className="text-6xl">✅</span>
      <p className="text-[22px] font-semibold text-white/95">Logged.</p>
      <p className="text-[15px] text-calm-mist max-w-[260px]">
        Each check-in helps your forecast understand you better.
      </p>
      <a href="/" className="btn-primary mt-2">Back to forecast</a>
    </div>
  );

  return (
    <div className="flex flex-col gap-5">
      <StepHeader q="Looks good —" hint="Review and save" />
      <div className="flex flex-wrap gap-2">
        {sleepOpt && <Pill emoji={sleepOpt.emoji} label={`${log.sleepHours}h · ${sleepOpt.label}`} />}
        {stressOpt && <Pill emoji={stressOpt.emoji} label={`${stressOpt.label} stress`} />}
        <Pill icon="drop" label={`${log.hydration} cups`}
          color={log.hydration >= 6 ? "teal" : log.hydration <= 2 ? "rose" : undefined} />
        {log.prodrome.length > 0 && (
          <Pill label={`${log.prodrome.length} warning sign${log.prodrome.length > 1 ? "s" : ""}`} color="rose" />
        )}
        {log.hasMigraine
          ? <Pill label={`Migraine${log.migraineSeverity ? ` · ${log.migraineSeverity}/10` : ""}${log.migraineLocation ? ` · ${log.migraineLocation}` : ""}`} color="rose" />
          : <Pill icon="check" label="No migraine" color="teal" />
        }
        {log.pressureAtLog > 0 && <Pill icon="wave" label={`${log.pressureAtLog.toFixed(0)} hPa`} />}
      </div>
      {error && <p className="text-calm-rose text-sm">Something went wrong — try again.</p>}
      <button onClick={onSave} disabled={saving}
        className="w-full py-4 rounded-full font-semibold text-calm-bg bg-calm-teal
                   hover:bg-[#3bb8b0] disabled:opacity-50 transition-all duration-200
                   shadow-[0_0_24px_rgba(78,205,196,0.3)]">
        {saving ? "Saving…" : "Save log"}
      </button>
    </div>
  );
}

// ── Shared ────────────────────────────────────────────────────────────────────
function StepHeader({ q, hint }: { q: string; hint?: string }) {
  return (
    <div className="text-center mb-1">
      <h2 className="text-[22px] sm:text-2xl font-semibold text-white/95 tracking-[-0.02em] leading-snug">{q}</h2>
      {hint && <p className="text-[14px] text-white/45 mt-1.5">{hint}</p>}
    </div>
  );
}

function NextButton({ onClick, label = "Next →" }: { onClick: () => void; label?: string }) {
  return (
    <button onClick={onClick} className="btn-primary self-end text-sm px-5 py-2.5">{label}</button>
  );
}

function SkipButton({ onSkip, label = "Skip →" }: { onSkip: () => void; label?: string }) {
  return (
    <button onClick={onSkip}
      className="text-[13px] text-white/30 hover:text-white/55 transition-colors text-center self-center">
      {label}
    </button>
  );
}

function PrivacyNote() {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/[0.03] border border-white/[0.07] self-start">
      <Icon name="lock" size={12} className="text-calm-mist shrink-0" />
      <p className="text-[11px] text-white/45 leading-snug">Stays on your device. Never shared.</p>
    </div>
  );
}

function Pill({ emoji, icon, label, color }: {
  emoji?: string; icon?: "drop" | "check" | "wave"; label: string; color?: "teal" | "rose";
}) {
  return (
    <span className={`flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-full border
      ${color === "teal" ? "bg-calm-teal/10 border-calm-teal/25 text-calm-teal"
      : color === "rose" ? "bg-calm-rose/10 border-calm-rose/25 text-calm-rose"
      : "bg-white/[0.06] border-white/10 text-white/60"}`}>
      {icon && <Icon name={icon} size={12} />}
      {emoji && <span>{emoji}</span>}
      {label}
    </span>
  );
}
