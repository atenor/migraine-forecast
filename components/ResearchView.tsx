"use client";
import { useEffect, useState } from "react";
import Icon from "./Icon";

interface CiteSummary {
  slug: string;
  authors: string;
  year: number;
  title: string;
  journal: string;
  url?: string | null;
  evidenceLevel: string;
  studyType: string;
  effectNote: string;
}

interface TriggerRow {
  key: string;
  name: string;
  category: string;
  direction: string;
  description: string;
  weight: number;
  weightCap: number;
  rationale: string;
  citations: CiteSummary[];
}

interface TreatmentRow {
  key: string;
  name: string;
  category: string;
  type: string;
  description: string;
  dosing?: string | null;
  evidenceLevel: string;
  nnt?: number | null;
  cautions?: string | null;
  citations: CiteSummary[];
}

const EVIDENCE_HEX: Record<string, string> = {
  A: "#86d4a4",
  B: "#7ed3c4",
  C: "#e8c485",
  U: "#cf7d8a",
};

const EVIDENCE_FRIENDLY: Record<string, string> = {
  A: "Strong evidence",
  B: "Good evidence",
  C: "Some evidence",
  U: "Early research",
};

const QUICK_FACTS = [
  {
    icon: "🌦️",
    heading: "Not everyone is weather-sensitive",
    text: "Only about 1 in 8 people with migraines are significantly affected by weather — but for those who are, pressure changes can account for nearly a third of their attacks.",
    color: "#7ed3c4",
  },
  {
    icon: "📉",
    heading: "It's the shift, not the number",
    text: "It's the change in atmospheric pressure that triggers migraines, not just how high or low it is. A rapid rise or drop over a few hours is what your body notices.",
    color: "#86d4a4",
  },
  {
    icon: "💧",
    heading: "Water is your first line of defense",
    text: "Even mild dehydration makes your brain more reactive to pressure changes. Staying well-hydrated is one of the simplest and most effective things you can do.",
    color: "#7ed3c4",
  },
  {
    icon: "😴",
    heading: "Consistency matters more than hours",
    text: "Both too little sleep and too much can trigger migraines. Your brain prefers a steady rhythm — going to bed and waking at the same time helps more than sleeping in.",
    color: "#86d4a4",
  },
  {
    icon: "☕",
    heading: "Caffeine cuts both ways",
    text: "In small, consistent amounts caffeine can actually help. But when your intake fluctuates or suddenly drops, that's when it becomes a trigger.",
    color: "#e8c485",
  },
  {
    icon: "💊",
    heading: "Triptans were built for this",
    text: "Triptans work for roughly 7 in 10 people who use them. Unlike general pain relievers, they're specifically designed to interrupt a migraine once it starts — not just dull the pain.",
    color: "#7ed3c4",
  },
];

type Tab = "triggers" | "treatments";

export default function ResearchView() {
  const [tab, setTab] = useState<Tab>("triggers");
  const [triggers, setTriggers]     = useState<TriggerRow[] | null>(null);
  const [treatments, setTreatments] = useState<TreatmentRow[] | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/evidence/triggers").then(r => r.json()),
      fetch("/api/evidence/treatments").then(r => r.json()),
    ]).then(([t, tx]) => {
      setTriggers(t.triggers || []);
      setTreatments(tx.treatments || []);
    }).catch(() => { setTriggers([]); setTreatments([]); });
  }, []);

  const loading = triggers === null || treatments === null;

  return (
    <div className="flex flex-col gap-6">

      {/* Did you know strip */}
      <div className="flex flex-col gap-3">
        <p className="text-[12px] uppercase tracking-[0.14em] font-semibold text-white/35">Did you know</p>
        {QUICK_FACTS.map((f, i) => (
          <div key={i} className="flex items-start gap-3 px-4 py-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.07]">
            <span className="text-xl shrink-0 mt-0.5">{f.icon}</span>
            <div>
              <p className="text-[13px] font-semibold mb-0.5" style={{ color: f.color }}>{f.heading}</p>
              <p className="text-[13px] text-white/60 leading-relaxed">{f.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-white/[0.07]" />
        <p className="text-[11px] uppercase tracking-[0.16em] text-white/25 shrink-0">The science in detail</p>
        <div className="flex-1 h-px bg-white/[0.07]" />
      </div>

      {/* Tab strip */}
      <div className="flex gap-2 p-1 bg-white/[0.04] rounded-2xl border border-white/[0.06] self-start">
        <TabBtn label="Triggers"   active={tab === "triggers"}   onClick={() => setTab("triggers")}   count={triggers?.length} />
        <TabBtn label="Treatments" active={tab === "treatments"} onClick={() => setTab("treatments")} count={treatments?.length} />
      </div>

      {loading ? (
        <div className="py-16 text-center text-white/45">Loading…</div>
      ) : tab === "triggers" ? (
        <div className="flex flex-col gap-4">
          {triggers!.length === 0 && <Empty />}
          {triggers!.map(t => <TriggerCard key={t.key} t={t} />)}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {treatments!.length === 0 && <Empty />}
          {treatments!.map(t => <TreatmentCard key={t.key} t={t} />)}
        </div>
      )}

      <DisclaimerBanner />
    </div>
  );
}

/* ─────────── Trigger card ─────────── */
function TriggerCard({ t }: { t: TriggerRow }) {
  const [open, setOpen] = useState(false);
  const tone = t.direction === "raises" ? "#dd9876" : t.direction === "lowers" ? "#86d4a4" : "#7a9ab8";
  const dirLabel = t.direction === "raises" ? "can raise risk" : t.direction === "lowers" ? "can lower risk" : "effect varies by person";

  return (
    <div className="relative overflow-hidden rounded-3xl p-5 flex flex-col gap-3"
      style={{
        background: `linear-gradient(155deg, ${tone}0d 0%, rgba(255,255,255,0.02) 60%)`,
        border: `1px solid ${tone}22`,
      }}>

      {/* Tag row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full"
          style={{ background: `${tone}18`, color: tone }}>
          {t.category}
        </span>
        <span className="text-[12px] text-white/40">{dirLabel}</span>
      </div>

      {/* Name + description */}
      <div>
        <h3 className="text-[17px] font-semibold text-white/95 mb-1.5 tracking-[-0.01em]">{t.name}</h3>
        <p className="text-[14px] text-white/65 leading-relaxed">{t.description}</p>
      </div>

      {/* What the research says */}
      <div className="text-[13px] text-white/50 leading-relaxed pt-1">
        {t.rationale}
      </div>

      {/* Studies — collapsed by default */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-[12px] text-white/35 hover:text-white/60 transition-colors self-start mt-1">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
          className={`transition-transform ${open ? "rotate-90" : ""}`}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
        {t.citations.length} {t.citations.length === 1 ? "study" : "studies"} behind this
      </button>

      {open && (
        <div className="flex flex-col gap-1.5 pt-1">
          {t.citations.map(c => <CitationLine key={c.slug} c={c} />)}
        </div>
      )}
    </div>
  );
}

/* ─────────── Treatment card ─────────── */
function TreatmentCard({ t }: { t: TreatmentRow }) {
  const [open, setOpen] = useState(false);
  const tone = EVIDENCE_HEX[t.evidenceLevel] || "#7a9ab8";
  const typeLabel = t.type === "preventive" ? "Preventive" : "For attacks in progress";

  return (
    <div className="relative overflow-hidden rounded-3xl p-5 flex flex-col gap-3"
      style={{
        background: `linear-gradient(155deg, ${tone}0d 0%, rgba(255,255,255,0.02) 60%)`,
        border: `1px solid ${tone}22`,
      }}>

      {/* Tag row */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full"
          style={{ background: `${tone}18`, color: tone }}>
          {typeLabel}
        </span>
        <span className="text-[12px] text-white/40">{EVIDENCE_FRIENDLY[t.evidenceLevel]}</span>
      </div>

      {/* Name + description */}
      <div>
        <h3 className="text-[17px] font-semibold text-white/95 mb-1.5 tracking-[-0.01em]">{t.name}</h3>
        <p className="text-[14px] text-white/65 leading-relaxed">{t.description}</p>
      </div>

      {/* Dosing — friendly label */}
      {t.dosing && (
        <p className="text-[13px] text-white/50 leading-relaxed">
          <span className="text-white/70 font-medium">How it&apos;s typically used: </span>{t.dosing}
        </p>
      )}

      {/* Cautions */}
      {t.cautions && (
        <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-calm-dusk/10 border border-calm-dusk/20">
          <Icon name="lock" size={12} className="text-calm-dusk mt-0.5 shrink-0" />
          <p className="text-[13px] text-calm-dusk/85 leading-relaxed">{t.cautions}</p>
        </div>
      )}

      {/* Studies — collapsed */}
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-[12px] text-white/35 hover:text-white/60 transition-colors self-start mt-1">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round"
          className={`transition-transform ${open ? "rotate-90" : ""}`}>
          <polyline points="9 18 15 12 9 6" />
        </svg>
        {t.citations.length} {t.citations.length === 1 ? "study" : "studies"} behind this
      </button>

      {open && (
        <div className="flex flex-col gap-1.5 pt-1">
          {t.citations.map(c => <CitationLine key={c.slug} c={c} />)}
        </div>
      )}
    </div>
  );
}

/* ─────────── Citation — minimal attribution line ─────────── */
function CitationLine({ c }: { c: CiteSummary }) {
  const tone = EVIDENCE_HEX[c.evidenceLevel] || "#7a9ab8";
  return (
    <div className="px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
      <div className="flex items-baseline gap-2 flex-wrap mb-1">
        <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full shrink-0"
          style={{ background: `${tone}20`, color: tone }}>
          {EVIDENCE_FRIENDLY[c.evidenceLevel] || c.evidenceLevel}
        </span>
        <span className="text-[12px] text-white/45">
          {c.authors.split(",")[0].trim()} et al., {c.year} · <em>{c.journal}</em>
        </span>
      </div>
      <p className="text-[13px] text-white/60 leading-relaxed">{c.effectNote}</p>
    </div>
  );
}

/* ─────────── Helpers ─────────── */
function TabBtn({ label, active, onClick, count }: { label: string; active: boolean; onClick: () => void; count?: number }) {
  return (
    <button onClick={onClick}
      className={`px-4 py-2 rounded-xl text-[14px] font-semibold transition-all
        ${active ? "bg-calm-sage/15 text-calm-sage border border-calm-sage/30"
                 : "text-white/55 hover:text-white/85 border border-transparent"}`}>
      {label}
      {count !== undefined && (
        <span className={`ml-2 text-[11px] font-bold ${active ? "text-calm-sage/70" : "text-white/30"}`}>
          {count}
        </span>
      )}
    </button>
  );
}

function Empty() {
  return <div className="py-12 text-center text-white/40">No entries yet.</div>;
}

function DisclaimerBanner() {
  return (
    <div className="mt-4 px-5 py-4 rounded-2xl border border-white/[0.07] bg-white/[0.03]">
      <p className="text-[13px] text-white/50 leading-relaxed">
        <span className="font-semibold text-white/70">This is a wellness tool, not medical advice.</span>{" "}
        Everything here is grounded in peer-reviewed research, but every body is different.
        Talk with your doctor before changing any medication or treatment plan.
      </p>
    </div>
  );
}
