"use client";
import { useState, useRef, useEffect } from "react";
import Icon from "./Icon";
import type { Location } from "@/lib/settings-context";

interface Props {
  current: Location | null;
  /** Human label to show on the trigger when no stored location yet. */
  fallbackLabel?: string;
  onChange: (loc: Location) => void;
}

export default function LocationPicker({ current, fallbackLabel, onChange }: Props) {
  const [open, setOpen]       = useState(false);
  const [query, setQuery]     = useState("");
  const [working, setWorking] = useState<"" | "geo" | "search">("");
  const [error, setError]     = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const popRef   = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const fn = (e: MouseEvent) => {
      if (popRef.current && !popRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, [open]);

  // Autofocus input when opened
  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 60); }, [open]);

  const useMyLocation = () => {
    setError("");
    if (!navigator.geolocation) { setError("Your browser doesn't share location."); return; }
    setWorking("geo");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude: lat, longitude: lon } = pos.coords;
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
          const d = await r.json();
          const name = d.address?.city || d.address?.town || d.address?.village || d.address?.county || "Current location";
          onChange({ lat, lon, name, source: "auto" });
          setOpen(false);
        } catch {
          onChange({ lat: pos.coords.latitude, lon: pos.coords.longitude, name: "Current location", source: "auto" });
          setOpen(false);
        } finally { setWorking(""); }
      },
      () => { setError("Couldn't read your location. Try entering it manually."); setWorking(""); },
      { timeout: 6000, maximumAge: 60_000 }
    );
  };

  const submitSearch = async () => {
    const q = query.trim();
    if (!q) return;
    setError("");
    setWorking("search");
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`);
      const d = await r.json();
      if (!d.length) { setError("No place by that name. Try adding the country."); return; }
      const top = d[0];
      const lat = parseFloat(top.lat), lon = parseFloat(top.lon);
      // Friendly short label — first segment of display_name
      const friendly = (top.display_name || q).split(",")[0].trim();
      onChange({ lat, lon, name: friendly, source: "manual" });
      setOpen(false);
      setQuery("");
    } catch { setError("Couldn't reach location service. Try again in a moment."); }
    finally { setWorking(""); }
  };

  const label = current?.name || fallbackLabel || "Set location";

  return (
    <div ref={popRef} className="relative inline-flex">
      {/* Trigger */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 text-[14px] -ml-1 px-1 py-0.5 rounded-md transition-colors
          ${open ? "text-white/85 bg-white/[0.06]" : "text-white/55 hover:text-white/80"}`}
      >
        <Icon name="pin" size={14} className="text-white/45 shrink-0" />
        <span className="truncate max-w-[180px]">{label}</span>
        <Icon name="chevron-down" size={11} className={`opacity-50 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Popover */}
      {open && (
        <div
          className="absolute top-full left-0 mt-2 z-50 w-[280px] rounded-2xl overflow-hidden
                     bg-[rgba(8,19,34,0.98)] backdrop-blur-2xl border border-white/10
                     shadow-[0_16px_48px_rgba(0,0,0,0.7)]"
        >
          {/* Use my location */}
          <button
            onClick={useMyLocation}
            disabled={working === "geo"}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left
                       hover:bg-white/[0.05] transition-colors border-b border-white/[0.06]
                       disabled:opacity-50"
          >
            <span className="w-9 h-9 rounded-xl bg-calm-sage/15 border border-calm-sage/30 text-calm-sage
                             flex items-center justify-center shrink-0">
              <Icon name="pin" size={16} />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-[14px] font-medium text-white/85">
                {working === "geo" ? "Finding you…" : "Use my current location"}
              </span>
              <span className="block text-[12px] text-white/45 mt-0.5">
                Asked once · stays on your device
              </span>
            </span>
          </button>

          {/* Manual entry */}
          <div className="px-4 py-3.5">
            <p className="calm-label mb-2">Enter a city</p>
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") submitSearch(); }}
                placeholder="e.g. Austin, TX"
                className="flex-1 bg-white/[0.05] border border-white/10 rounded-xl px-3 py-2
                           text-[14px] text-white/90 placeholder-white/25
                           focus:outline-none focus:border-calm-sage/50 focus:ring-2 focus:ring-calm-sage/20"
              />
              <button
                onClick={submitSearch}
                disabled={working === "search" || !query.trim()}
                className="px-3.5 rounded-xl text-[13px] font-semibold
                           bg-calm-sage/20 text-calm-sage border border-calm-sage/30
                           hover:bg-calm-sage/30 disabled:opacity-40 transition-colors"
              >
                {working === "search" ? "…" : "Set"}
              </button>
            </div>
            {error && <p className="text-[12px] text-calm-dusk mt-2">{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
