"use client";
import { useEffect, useState, useRef } from "react";
import { useSettings } from "@/lib/settings-context";
import { PRESSURE_UNITS, TEMP_UNITS, convertPressure, pressureDecimals, formatTemp } from "@/lib/units";
import { getCustomOptions, updateCustomOption, deleteCustomOption } from "@/lib/custom-options";

export default function SettingsPage() {
  const { pressureUnit, tempUnit, setPressureUnit, setTempUnit } = useSettings();
  const [notifStatus, setNotifStatus] = useState<"default" | "granted" | "denied" | "unsupported">("unsupported");

  useEffect(() => {
    if (!("Notification" in window)) { setNotifStatus("unsupported"); return; }
    setNotifStatus(Notification.permission as typeof notifStatus);
  }, []);

  const requestNotifications = async () => {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    setNotifStatus(perm as typeof notifStatus);
    if (perm === "granted" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  };

  // Sample values for the preview
  const sampleHpa = 1013.25;
  const sampleC   = 22;
  const dec = pressureDecimals(pressureUnit);

  return (
    <div>
      <div className="mb-8">
        <h1 className="calm-title">Settings</h1>
        <p className="calm-subtitle mt-1.5">Customize units and display preferences.</p>
      </div>

      {/* Research / evidence link — sage glow */}
      <div className="relative mb-7">
        <div className="absolute pointer-events-none"
          style={{ inset: "-16px", background: "radial-gradient(ellipse at 50% 50%, rgba(134,212,164,0.18) 0%, transparent 70%)" }} />
        <a href="/research"
          className="relative block overflow-hidden rounded-3xl p-5 flex items-center gap-4 transition-all duration-700"
          style={{
            background: "linear-gradient(155deg, rgba(134,212,164,0.10) 0%, rgba(255,255,255,0.025) 55%)",
            backdropFilter: "blur(24px)",
            border: "1px solid rgba(134,212,164,0.28)",
            boxShadow: "0 0 50px -16px rgba(134,212,164,0.4)",
          }}
        >
          <div className="w-11 h-11 rounded-2xl bg-calm-sage/15 border border-calm-sage/30 text-calm-sage
                          flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[16px] font-semibold text-white/95">Research behind your forecast</p>
            <p className="text-[14px] text-white/60 mt-1 leading-relaxed">
              See every study that informs the algorithm — triggers, treatments, weights, and rationale.
            </p>
          </div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-calm-sage shrink-0">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </a>
      </div>

      {/* Pressure unit */}
      <SettingSection title="Pressure Unit" icon="🌬️" description="Used throughout the forecast, charts, and history.">
        <div className="flex flex-col">
          {PRESSURE_UNITS.map((u, i) => (
            <button
              key={u.value}
              onClick={() => setPressureUnit(u.value)}
              className={`flex items-center justify-between px-2 py-3.5 text-left transition-colors rounded-2xl ${
                i < PRESSURE_UNITS.length - 1 ? "border-b border-white/[0.06]" : ""
              } hover:bg-white/[0.03]`}
            >
              <div>
                <p className={`text-sm font-medium ${pressureUnit === u.value ? "text-calm-teal" : "text-white/80"}`}>
                  {u.label}
                </p>
                <p className="text-xs text-calm-mist mt-0.5">{u.symbol}</p>
              </div>
              {/* Radio indicator */}
              <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ml-4 transition-all ${
                pressureUnit === u.value ? "border-calm-teal" : "border-white/20"
              }`}>
                {pressureUnit === u.value && (
                  <span className="w-2 h-2 rounded-full bg-calm-teal" />
                )}
              </span>
            </button>
          ))}
        </div>
      </SettingSection>

      {/* Temperature unit */}
      <SettingSection title="Temperature" icon="🌡️" description="Shown on the forecast dashboard.">
        <div className="flex gap-3">
          {TEMP_UNITS.map(u => (
            <button
              key={u.value}
              onClick={() => setTempUnit(u.value)}
              className={`flex-1 py-5 rounded-2xl border text-sm font-semibold transition-all duration-200 ${
                tempUnit === u.value
                  ? "bg-calm-teal/15 border-calm-teal/40 text-calm-teal shadow-[0_0_16px_rgba(78,205,196,0.15)]"
                  : "bg-white/[0.03] border-white/10 text-white/50 hover:border-white/20"
              }`}
            >
              <span className="text-3xl block mb-2">{u.symbol}</span>
              {u.label}
            </button>
          ))}
        </div>
      </SettingSection>

      {/* Notifications */}
      <SettingSection title="Notifications" icon="🔔" description="Get alerted when migraine risk reaches 50% or higher.">
        {notifStatus === "unsupported" && (
          <p className="text-sm text-white/40">Your browser doesn&rsquo;t support notifications.</p>
        )}
        {notifStatus === "denied" && (
          <div>
            <p className="text-sm text-calm-rose mb-2">Notifications are blocked in your browser settings.</p>
            <p className="text-xs text-white/40">To enable: open browser settings → Site Settings → Notifications → allow this site.</p>
          </div>
        )}
        {notifStatus === "default" && (
          <button onClick={requestNotifications} className="btn-primary">
            Enable notifications
          </button>
        )}
        {notifStatus === "granted" && (
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-calm-teal animate-pulse" />
            <p className="text-sm text-calm-teal font-medium">Notifications are on</p>
            <p className="text-xs text-white/30 ml-auto">You&rsquo;ll be alerted at risk ≥ 50</p>
          </div>
        )}
      </SettingSection>

      {/* Custom options */}
      <CustomOptionsSection />

      {/* Live preview */}
      <SettingSection title="Preview" icon="👁️" description="How the same value looks in your selected units.">
        <div className="flex flex-wrap gap-3">
          <PreviewChip
            label="Pressure (standard atm)"
            value={`${convertPressure(sampleHpa, pressureUnit).toFixed(dec)} ${pressureUnit}`}
          />
          <PreviewChip
            label="Temperature (room)"
            value={formatTemp(sampleC, tempUnit)}
          />
        </div>
      </SettingSection>
    </div>
  );
}

function SettingSection({ title, icon, description, children }: {
  title: string; icon: string; description: string; children: React.ReactNode;
}) {
  return (
    <div className="card mb-4">
      <div className="flex items-start gap-3 mb-5">
        <span className="text-xl">{icon}</span>
        <div>
          <p className="font-medium text-white/90 text-sm">{title}</p>
          <p className="text-xs text-calm-mist mt-0.5">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function CustomOptionsSection() {
  const [meds, setMeds]     = useState<string[]>([]);
  const [relief, setRelief] = useState<string[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editVal, setEditVal]       = useState("");
  const editRef = useRef<HTMLInputElement>(null);

  const reload = () => {
    setMeds(getCustomOptions("medications"));
    setRelief(getCustomOptions("relief"));
  };
  useEffect(() => { reload(); }, []);
  useEffect(() => { if (editingKey) editRef.current?.focus(); }, [editingKey]);

  const startEdit = (key: string, current: string) => { setEditingKey(key); setEditVal(current); };
  const saveEdit  = (type: "medications" | "relief", old: string) => {
    if (editVal.trim()) updateCustomOption(type, old, editVal.trim());
    setEditingKey(null); reload();
  };
  const del = (type: "medications" | "relief", val: string) => { deleteCustomOption(type, val); reload(); };

  if (meds.length === 0 && relief.length === 0) return null;

  return (
    <SettingSection title="My Custom Options" icon="✏️" description="Edit or remove options you've added during check-in.">
      {([{ label: "Medications", type: "medications", items: meds },
        { label: "Relief methods", type: "relief", items: relief }] as { label: string; type: "medications"|"relief"; items: string[] }[])
        .filter(g => g.items.length > 0)
        .map(group => (
          <div key={group.type} className="mb-5 last:mb-0">
            <p className="calm-label mb-3">{group.label}</p>
            <div className="flex flex-col gap-1">
              {group.items.map(item => {
                const key = `${group.type}:${item}`;
                return editingKey === key ? (
                  <div key={key} className="flex items-center gap-2">
                    <input ref={editRef} value={editVal} onChange={e => setEditVal(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") saveEdit(group.type, item); if (e.key === "Escape") setEditingKey(null); }}
                      className="calm-input text-sm py-1.5 px-3 flex-1 rounded-xl" />
                    <button onClick={() => saveEdit(group.type, item)} className="text-xs text-calm-teal hover:text-white transition-colors px-2">Save</button>
                    <button onClick={() => setEditingKey(null)} className="text-xs text-white/30 hover:text-white/60 transition-colors px-1">✕</button>
                  </div>
                ) : (
                  <div key={key} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.03] group transition-colors">
                    <span className="text-sm text-white/70">{item}</span>
                    <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(key, item)} className="text-xs text-white/40 hover:text-calm-teal transition-colors">Edit</button>
                      <button onClick={() => del(group.type, item)} className="text-xs text-white/40 hover:text-calm-rose transition-colors">Delete</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
    </SettingSection>
  );
}

function PreviewChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-sm px-5 py-3 text-center flex-1 min-w-32">
      <p className="calm-label mb-1.5">{label}</p>
      <p className="text-white/90 font-semibold text-lg">{value}</p>
    </div>
  );
}
