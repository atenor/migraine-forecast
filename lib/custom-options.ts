"use client";

export type OptionType = "medications" | "relief";

const KEYS: Record<OptionType, string> = {
  medications: "mf-custom-medications",
  relief:      "mf-custom-relief",
};

export function getCustomOptions(type: OptionType): string[] {
  try { return JSON.parse(localStorage.getItem(KEYS[type]) || "[]"); }
  catch { return []; }
}

export function addCustomOption(type: OptionType, value: string): void {
  const trimmed = value.trim();
  if (!trimmed) return;
  const existing = getCustomOptions(type);
  if (existing.map(s => s.toLowerCase()).includes(trimmed.toLowerCase())) return;
  localStorage.setItem(KEYS[type], JSON.stringify([...existing, trimmed]));
}

export function updateCustomOption(type: OptionType, oldVal: string, newVal: string): void {
  const trimmed = newVal.trim();
  if (!trimmed) return;
  const existing = getCustomOptions(type);
  localStorage.setItem(KEYS[type], JSON.stringify(existing.map(v => v === oldVal ? trimmed : v)));
}

export function deleteCustomOption(type: OptionType, value: string): void {
  const existing = getCustomOptions(type);
  localStorage.setItem(KEYS[type], JSON.stringify(existing.filter(v => v !== value)));
}
