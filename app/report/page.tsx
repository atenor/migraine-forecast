/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState } from "react";

const toDate = (d: Date) => d.toISOString().slice(0, 10);
const nDaysAgo = (n: number) => { const d = new Date(); d.setDate(d.getDate() - n); return toDate(d); };

export default function ReportPage() {
  const [start, setStart] = useState(nDaysAgo(30));
  const [end, setEnd]     = useState(toDate(new Date()));
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setLoading(true); setError(""); setReport(null);
    try {
      const r = await fetch(`/api/report?start=${start}&end=${end}`);
      if (r.status === 404) { setError("No data found in this date range."); return; }
      if (!r.ok) throw new Error();
      setReport(await r.json());
    } catch { setError("Failed to generate report."); }
    finally { setLoading(false); }
  };

  const copy = async () => {
    if (!report) return;
    await navigator.clipboard.writeText(report.plainTextSummary);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const dl = () => {
    if (!report) return;
    const b = new Blob([report.plainTextSummary], { type: "text/plain" });
    const u = URL.createObjectURL(b);
    const a = document.createElement("a");
    a.href = u; a.download = `migraine-report-${start}-to-${end}.txt`; a.click();
    URL.revokeObjectURL(u);
  };

  const s = report?.stats;

  return (
    <div>
      <div className="mb-6">
        <h1 className="calm-title">Doctor&rsquo;s Report</h1>
        <p className="calm-subtitle mt-1.5">
          Generate a plain-language summary to share with your neurologist.
        </p>
      </div>

      {/* Date range picker */}
      <div className="card mb-5">
        {/* Quick range buttons */}
        <div className="flex flex-wrap gap-2 mb-5">
          {([[30,"30 days"],[60,"60 days"],[90,"90 days"],[180,"6 months"]] as [number,string][]).map(([n, l]) => (
            <button key={n}
              onClick={() => { setStart(nDaysAgo(n)); setEnd(toDate(new Date())); }}
              className="btn-ghost text-sm"
            >{l}</button>
          ))}
        </div>

        {/* Date inputs */}
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <p className="calm-label mb-2">From</p>
            <input type="date" value={start} onChange={e => setStart(e.target.value)} className="calm-input w-auto" />
          </div>
          <div>
            <p className="calm-label mb-2">To</p>
            <input type="date" value={end} onChange={e => setEnd(e.target.value)} className="calm-input w-auto" />
          </div>
          <button onClick={generate} disabled={loading} className="btn-primary disabled:opacity-50">
            {loading ? "Generating…" : "Generate"}
          </button>
        </div>

        {error && <p className="text-calm-rose text-sm mt-4">{error}</p>}
      </div>

      {/* Stats grid */}
      {s && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {([
            ["Days tracked",    s.totalDays,                  undefined],
            ["Migraines",       s.totalMigraines,             "rose"],
            ["Frequency",       `${s.migraineFrequency}%`,    s.migraineFrequency >= 30 ? "rose" : undefined],
            ["Avg severity",    `${s.avgSeverity}/10`,        undefined],
            ["Avg duration",    `${s.avgDuration}h`,          undefined],
            ["Hours disabled",  s.totalDisabledHours.toFixed(1), "rose"],
            ["Avg sleep",       `${s.avgSleep}h`,             s.avgSleep < 6.5 ? "gold" : "teal"],
            ["Exercise days",   `${s.exerciseDays}/${s.totalDays}`, undefined],
          ] as [string, any, string | undefined][]).map(([l, v, a]) => (
            <div key={l} className="glass-sm px-4 py-4 text-center">
              <p className="calm-label mb-1">{l}</p>
              <p className={`text-xl font-semibold tracking-[-0.02em] ${
                a === "rose" ? "text-calm-rose" :
                a === "gold" ? "text-calm-gold" :
                a === "teal" ? "text-calm-teal" : "text-white/90"
              }`}>{v}</p>
            </div>
          ))}
        </div>
      )}

      {/* Relief methods */}
      {report?.topReliefMethods?.length > 0 && (
        <div className="card mb-5">
          <p className="calm-label mb-4">Most Effective Relief</p>
          <div className="flex flex-col gap-3">
            {report.topReliefMethods.map((m: any, i: number) => (
              <div key={m.method} className="flex items-center gap-3">
                <span className="text-white/25 text-sm w-4">{i + 1}.</span>
                <span className="flex-1 text-white/80 text-sm">{m.method}</span>
                <span className="text-xs text-white/30">{m.count}×</span>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }, (_, j) => (
                    <span key={j} className={`w-2.5 h-2.5 rounded-full ${j < Math.round(m.avgRating) ? "bg-calm-teal" : "bg-white/10"}`} />
                  ))}
                </div>
                <span className="text-xs text-calm-teal w-10 text-right">{m.avgRating}/5</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Migraine log */}
      {report?.migraineDates?.length > 0 && (
        <div className="card mb-5">
          <p className="calm-label mb-4">Migraine Log</p>
          <div className="flex flex-col gap-2">
            {report.migraineDates.map((m: any) => (
              <div key={m.date} className="flex items-center gap-4 text-sm">
                <span className="text-white/60 w-28">
                  {new Date(m.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                </span>
                <div className="flex-1 max-w-32 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${m.severity <= 3 ? "bg-calm-teal" : m.severity <= 6 ? "bg-calm-gold" : "bg-calm-rose"}`}
                    style={{ width: `${(m.severity / 10) * 100}%` }}
                  />
                </div>
                <span className="text-white/50">{m.severity}/10</span>
                <span className="text-white/30">{m.duration > 0 ? `${m.duration}h` : ""}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Plain text report */}
      {report && (
        <div className="card">
          <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
            <p className="calm-label">Plain-Text Summary</p>
            <div className="flex gap-2">
              <button onClick={copy} className="btn-ghost text-sm">{copied ? "✓ Copied" : "Copy"}</button>
              <button onClick={dl}   className="btn-ghost text-sm">Download .txt</button>
            </div>
          </div>
          <pre className="text-xs text-white/40 font-mono bg-white/[0.02] rounded-2xl p-4 overflow-x-auto whitespace-pre-wrap leading-relaxed border border-white/[0.05]">
            {report.plainTextSummary}
          </pre>
        </div>
      )}
    </div>
  );
}
