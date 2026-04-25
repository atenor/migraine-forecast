"use client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from "recharts";
import { format, parseISO } from "date-fns";
import { useSettings } from "@/lib/settings-context";
import { convertPressure, pressureDecimals } from "@/lib/units";
import type { RiskWindow } from "@/lib/risk";

const TOOLTIP_STYLE = {
  background: "rgba(5,13,26,0.95)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 16,
  boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
};

export default function PressureChart({ windows }: { windows: RiskWindow[] }) {
  const { pressureUnit } = useSettings();
  const dec = pressureDecimals(pressureUnit);

  const data = windows.slice(0, 48).map(w => ({
    time: format(parseISO(w.time), "EEE ha"),
    pressure: parseFloat(convertPressure(w.pressureHpa, pressureUnit).toFixed(dec)),
    risk: w.riskScore,
  }));

  const pressures = data.map(d => d.pressure);
  const pMin = parseFloat((Math.min(...pressures) - convertPressure(2, pressureUnit)).toFixed(dec));
  const pMax = parseFloat((Math.max(...pressures) + convertPressure(2, pressureUnit)).toFixed(dec));

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis dataKey="time" tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 11 }} tickLine={false} interval={5} />
          <YAxis yAxisId="p" domain={[pMin, pMax]} tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 11 }} tickLine={false} width={46}
            tickFormatter={v => v.toFixed(dec)} />
          <YAxis yAxisId="r" orientation="right" domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.25)", fontSize: 11 }} tickLine={false} width={36} />
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            labelStyle={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}
            itemStyle={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}
            formatter={(v: number, name: string) => name === `Pressure (${pressureUnit})` ? [`${v.toFixed(dec)} ${pressureUnit}`, name] : [v, name]}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }} />
          <ReferenceLine yAxisId="r" y={50} stroke="#f0c27f" strokeDasharray="4 4" opacity={0.4} />
          <ReferenceLine yAxisId="r" y={70} stroke="#c85a5a" strokeDasharray="4 4" opacity={0.4} />
          <Line yAxisId="p" type="monotone" dataKey="pressure" stroke="#a89ec9" dot={false} strokeWidth={2} name={`Pressure (${pressureUnit})`} />
          <Line yAxisId="r" type="monotone" dataKey="risk" stroke="#f0c27f" dot={false} strokeWidth={2} name="Risk Score" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
