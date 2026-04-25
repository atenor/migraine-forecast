import { prisma, hasDB } from "@/lib/db";
import Link from "next/link";
export const metadata = { title: "History — Migraine Forecast" };
export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  let logs: Awaited<ReturnType<typeof prisma.dailyLog.findMany>> = [];
  if (hasDB) { try { logs = await prisma.dailyLog.findMany({ orderBy: { date: "desc" }, take: 90 }); } catch { /* no db */ } }
  const tm = logs.filter(l => l.hasMigraine).length;
  const mf = logs.length > 0 ? ((tm / logs.length) * 100).toFixed(0) : "0";

  return (
    <div>
      <div className="mb-6">
        <h1 className="calm-title">History</h1>
        <p className="calm-subtitle mt-1.5">Last 90 days · {logs.length} entries</p>
      </div>

      {/* Stats row */}
      <div className="flex gap-3 mb-6">
        <StatChip label="Days logged" value={`${logs.length}`} />
        <StatChip label="Migraines" value={`${tm}`} accent="rose" />
        <StatChip label="Frequency" value={`${mf}%`} />
      </div>

      {logs.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-white/50 text-lg mb-3">No logs yet.</p>
          <Link href="/checkin" className="btn-primary inline-block">Start logging</Link>
        </div>
      ) : (
        <div className="overflow-x-auto glass">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {["Date", "Sleep", "Stress", "Hydration", "Caffeine", "Exercise", "Migraine", "Severity", "Duration", "Pressure"].map(h => (
                  <th key={h} className="px-4 py-3 text-left calm-label whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log, i) => (
                <tr
                  key={log.id}
                  className={`border-b border-white/[0.04] transition-colors hover:bg-white/[0.03]
                    ${log.hasMigraine ? "bg-calm-rose/5" : ""}
                    ${i % 2 === 0 ? "" : "bg-white/[0.015]"}`}
                >
                  <td className="px-4 py-3 text-white/80 font-medium whitespace-nowrap">
                    {new Date(log.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </td>
                  <td className="px-4 py-3 text-white/60 whitespace-nowrap">
                    {log.sleepHours}h <span className="text-white/30">({log.sleepQuality}/5)</span>
                  </td>
                  <td className="px-4 py-3"><Dots value={log.stressLevel} max={5} color="gold" /></td>
                  <td className="px-4 py-3"><Dots value={log.hydration} max={5} color="teal" /></td>
                  <td className="px-4 py-3 text-white/60 tabular-nums">{log.caffeine} cup{log.caffeine === 1 ? "" : "s"}</td>
                  <td className="px-4 py-3 text-white/60">{log.exercise ? "✓" : <span className="text-white/20">–</span>}</td>
                  <td className="px-4 py-3">
                    {log.hasMigraine
                      ? <span className="text-calm-rose font-medium">Yes</span>
                      : <span className="text-white/25">No</span>}
                  </td>
                  <td className={`px-4 py-3 font-medium ${
                    log.migraineSeverity === 0 ? "text-white/25" :
                    log.migraineSeverity <= 3 ? "text-calm-teal" :
                    log.migraineSeverity <= 6 ? "text-calm-gold" : "text-calm-rose"
                  }`}>
                    {log.hasMigraine ? `${log.migraineSeverity}/10` : <span className="text-white/25">–</span>}
                  </td>
                  <td className="px-4 py-3 text-white/50">
                    {log.hasMigraine && log.migraineDuration > 0 ? `${log.migraineDuration}h` : <span className="text-white/25">–</span>}
                  </td>
                  <td className="px-4 py-3 text-white/40 whitespace-nowrap">
                    {log.pressureAtLog > 0 ? `${log.pressureAtLog.toFixed(1)} hPa` : <span className="text-white/20">–</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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

function Dots({ value, max, color }: { value: number; max: number; color: "gold" | "teal" }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={`w-2 h-2 rounded-full ${
          i < value
            ? color === "gold" ? "bg-calm-gold" : "bg-calm-teal"
            : "bg-white/10"
        }`} />
      ))}
    </div>
  );
}
