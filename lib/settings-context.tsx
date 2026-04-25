"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import type { PressureUnit, TempUnit } from "./units";

export interface Location {
  lat: number;
  lon: number;
  name: string;          // human-readable label (e.g. "New York")
  source: "auto" | "manual";
}

interface Settings {
  pressureUnit: PressureUnit;
  tempUnit: TempUnit;
  location: Location | null;
}

interface SettingsCtx extends Settings {
  setPressureUnit: (u: PressureUnit) => void;
  setTempUnit: (u: TempUnit) => void;
  setLocation: (l: Location | null) => void;
}

const DEFAULT: Settings = { pressureUnit: "hPa", tempUnit: "C", location: null };
const STORAGE_KEY = "mf-settings-v1";

const SettingsContext = createContext<SettingsCtx>({
  ...DEFAULT,
  setPressureUnit: () => {},
  setTempUnit: () => {},
  setLocation: () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULT);

  // Load from localStorage after mount (avoids SSR hydration mismatch)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: Partial<Settings> = JSON.parse(raw);
        setSettings(prev => ({ ...prev, ...parsed }));
      }
    } catch { /* ignore */ }
  }, []);

  const persist = (next: Settings) => {
    setSettings(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  return (
    <SettingsContext.Provider value={{
      ...settings,
      setPressureUnit: (pressureUnit) => persist({ ...settings, pressureUnit }),
      setTempUnit:     (tempUnit)     => persist({ ...settings, tempUnit }),
      setLocation:     (location)     => persist({ ...settings, location }),
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsCtx {
  return useContext(SettingsContext);
}
