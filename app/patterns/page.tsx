import PatternCharts from "@/components/PatternCharts";
import Link from "next/link";
export const metadata = { title: "Patterns — Migraine Forecast" };
export const dynamic = "force-dynamic";

async function getData() {
  const { prisma } = await import("@/lib/db");
  const logs = await prisma.dailyLog.findMany({ orderBy: { date: "asc" } });
  if (!logs.length) return null;
  const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const pearson = (xs: number[], ys: number[]) => {
    const n = xs.length; if (n < 5) return 0;
    const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
    const num = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0);
    const den = Math.sqrt(xs.reduce((s, x) => s + (x - mx) ** 2, 0) * ys.reduce((s, y) => s + (y - my) ** 2, 0));
    return den === 0 ? 0 : num / den;
  };
  const mf = logs.map(l => l.hasMigraine ? 1 : 0);
  const triggerCorrelations = [
    { factor: "Poor Sleep Quality", values: logs.map(l => 6 - l.sleepQuality) },
    { factor: "Low Sleep Hours",    values: logs.map(l => Math.max(0, 8 - l.sleepHours)) },
    { factor: "High Stress",        values: logs.map(l => l.stressLevel) },
    { factor: "Low Hydration",      values: logs.map(l => 6 - l.hydration) },
    { factor: "High Caffeine",      values: logs.map(l => l.caffeine) },
    { factor: "High Screen Time",   values: logs.map(l => l.screenTime) },
    { factor: "Menstrual",          values: logs.map(l => l.menstrual ? 1 : 0) },
    { factor: "No Exercise",        values: logs.map(l => l.exercise ? 0 : 1) },
    { factor: "Low Pressure",       values: logs.map(l => l.pressureAtLog > 0 ? 1030 - l.pressureAtLog : 0) },
  ].map(({ factor, values }) => ({ factor, correlation: parseFloat(pearson(values, mf).toFixed(3)) }))
   .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));

  const db = Array(7).fill(0).map((_, i) => ({ day: DAYS[i], count: 0, total: 0 }));
  logs.forEach(l => { if (!l.hasMigraine) return; const d = new Date(l.date + "T12:00:00").getDay(); db[d].count++; db[d].total += l.migraineSeverity; });
  const migrainesByDayOfWeek = db.map(b => ({ day: b.day, count: b.count, avgSeverity: b.count > 0 ? parseFloat((b.total / b.count).toFixed(1)) : 0 }));

  const mm: Record<string, { count: number; total: number; days: number }> = {};
  logs.forEach(l => { const m = l.date.slice(0, 7); if (!mm[m]) mm[m] = { count: 0, total: 0, days: 0 }; mm[m].days++; if (l.hasMigraine) { mm[m].count++; mm[m].total += l.migraineSeverity; } });
  const monthlyTrend = Object.entries(mm).sort(([a], [b]) => a.localeCompare(b)).map(([month, d]) => ({ month, count: d.count, avgSeverity: d.count > 0 ? parseFloat((d.total / d.count).toFixed(1)) : 0, frequency: parseFloat(((d.count / d.days) * 100).toFixed(1)) }));

  const rm: Record<string, { count: number; ratingTotal: number }> = {};
  logs.filter(l => l.hasMigraine).forEach(l => {
    let ms: string[] = []; try { ms = JSON.parse(l.reliefMethods); } catch { /**/ }
    ms.forEach(m => { if (!rm[m]) rm[m] = { count: 0, ratingTotal: 0 }; rm[m].count++; rm[m].ratingTotal += l.reliefRating; });
  });
  const reliefPatterns = Object.entries(rm).map(([method, d]) => ({ method, useCount: d.count, avgRating: parseFloat((d.ratingTotal / d.count).toFixed(1)) })).sort((a, b) => b.avgRating - a.avgRating);

  const ml = logs.filter(l => l.hasMigraine);
  return { totalLogs: logs.length, totalMigraines: ml.length, averageSeverity: ml.length > 0 ? parseFloat((ml.reduce((s, l) => s + l.migraineSeverity, 0) / ml.length).toFixed(1)) : 0, triggerCorrelations, migrainesByDayOfWeek, monthlyTrend, reliefPatterns };
}

export default async function PatternsPage() {
  const data = await getData();

  if (!data) return (
    <div>
      <div className="mb-6">
        <h1 className="calm-title">Patterns</h1>
        <p className="calm-subtitle mt-1.5">Statistical analysis of your migraine triggers and trends.</p>
      </div>
      <div className="card text-center py-16">
        <p className="text-white/50 text-lg mb-2">Not enough data yet.</p>
        <p className="calm-subtitle mb-5">Log at least a few days to see your personal patterns.</p>
        <Link href="/checkin" className="btn-primary inline-block">Start Logging</Link>
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="calm-title">Patterns</h1>
        <p className="calm-subtitle mt-1.5">Based on {data.totalLogs} logged days · {data.totalMigraines} migraines</p>
      </div>

      {/* Stats row */}
      <div className="flex gap-3 mb-6">
        <StatChip label="Migraines" value={`${data.totalMigraines}`} accent="rose" />
        <StatChip label="Avg severity" value={`${data.averageSeverity}/10`} />
        <StatChip label="Frequency" value={`${((data.totalMigraines / data.totalLogs) * 100).toFixed(0)}%`} />
      </div>

      <PatternCharts
        triggerCorrelations={data.triggerCorrelations}
        migrainesByDayOfWeek={data.migrainesByDayOfWeek}
        monthlyTrend={data.monthlyTrend}
        reliefPatterns={data.reliefPatterns}
      />

      <p className="text-xs text-white/20 mt-6 leading-relaxed">
        Correlation values range from –1 to +1. Values above 0.3 suggest a meaningful association. Correlation does not prove causation.
      </p>
    </div>
  );
}

function StatChip({ label, value, accent }: { label: string; value: string; accent?: "rose" }) {
  return (
    <div className={`flex-1 glass-sm px-4 py-3 text-center ${accent === "rose" ? "border-calm-rose/20" : ""}`}>
      <p className="calm-label mb-1">{label}</p>
      <p className={`text-base font-semibold ${accent === "rose" ? "text-calm-rose" : "text-white/90"}`}>{value}</p>
    </div>
  );
}
