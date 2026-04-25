/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Cell,
} from "recharts";

interface TC  { factor: string; correlation: number; }
interface DOW { day: string; count: number; avgSeverity: number; }
interface MT  { month: string; count: number; avgSeverity: number; frequency: number; }
interface RP  { method: string; useCount: number; avgRating: number; }
interface Props { triggerCorrelations: TC[]; migrainesByDayOfWeek: DOW[]; monthlyTrend: MT[]; reliefPatterns: RP[]; }

const TOOLTIP_STYLE = {
  background: "rgba(5,13,26,0.95)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 16,
  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
};
const TICK = { fill: "rgba(255,255,255,0.25)", fontSize: 11 };
const GRID = "rgba(255,255,255,0.05)";

// Calm correlation color — teal=protective, gold→terra→rose = risk
const cc = (v: number) =>
  v >= 0.4 ? "#c85a5a" :
  v >= 0.2 ? "#e07b54" :
  v >= 0.1 ? "#f0c27f" :
  v <= -0.1 ? "#4ecdc4" : "rgba(255,255,255,0.15)";

export default function PatternCharts({ triggerCorrelations, migrainesByDayOfWeek, monthlyTrend, reliefPatterns }: Props) {
  const sd = (d: string) => d.slice(0, 3);
  const sm = (m: string) => {
    const [y, mo] = m.split("-");
    return new Date(parseInt(y), parseInt(mo) - 1).toLocaleString("en-US", { month: "short" });
  };

  return (
    <div className="flex flex-col gap-6">

      {/* Trigger correlations */}
      <div className="card">
        <p className="calm-label mb-1">Trigger Correlations</p>
        <p className="text-xs text-white/35 mb-4 leading-relaxed">
          Pearson correlation between daily factors and migraine occurrence.
          Teal = protective, warm = risk.
        </p>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={triggerCorrelations} layout="vertical" margin={{ top: 0, right: 32, bottom: 0, left: 120 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
              <XAxis type="number" domain={[-1, 1]} tick={TICK} tickLine={false} tickFormatter={v => v.toFixed(1)} />
              <YAxis type="category" dataKey="factor" tick={TICK} tickLine={false} width={118} />
              <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "rgba(255,255,255,0.5)" }}
                formatter={(v: number) => [v.toFixed(3), "Correlation"]} />
              <Bar dataKey="correlation" radius={[0, 6, 6, 0]}>
                {triggerCorrelations.map((e, i) => <Cell key={i} fill={cc(e.correlation)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Day of week + monthly */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="card">
          <p className="calm-label mb-4">Migraines by Day</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={migrainesByDayOfWeek} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                <XAxis dataKey="day" tickFormatter={sd} tick={TICK} tickLine={false} />
                <YAxis tick={TICK} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "rgba(255,255,255,0.5)" }} />
                <Bar dataKey="count" name="Migraines" fill="#a89ec9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <p className="calm-label mb-4">Monthly Frequency</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                <XAxis dataKey="month" tickFormatter={sm} tick={TICK} tickLine={false} />
                <YAxis tick={TICK} tickLine={false} tickFormatter={v => `${v}%`} />
                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "rgba(255,255,255,0.5)" }}
                  formatter={(v: number) => [`${v}%`, "Migraine days"]} />
                <Line type="monotone" dataKey="frequency" stroke="#f0c27f" strokeWidth={2}
                  dot={{ fill: "#f0c27f", r: 3 }} name="Frequency" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Relief effectiveness */}
      {reliefPatterns.length > 0 && (
        <div className="card">
          <p className="calm-label mb-1">Relief Effectiveness</p>
          <p className="text-xs text-white/35 mb-4">Average self-reported rating (1–5).</p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reliefPatterns.slice(0, 10)} layout="vertical" margin={{ top: 0, right: 32, bottom: 0, left: 140 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} horizontal={false} />
                <XAxis type="number" domain={[0, 5]} tick={TICK} tickLine={false} />
                <YAxis type="category" dataKey="method" tick={TICK} tickLine={false} width={138} />
                <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "rgba(255,255,255,0.5)" }}
                  formatter={(v: number, _: string, p: any) => [`${v.toFixed(1)}/5 (used ${p.payload.useCount}×)`, "Avg rating"]} />
                <Bar dataKey="avgRating" name="Avg rating" fill="#4ecdc4" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
