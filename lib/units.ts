export type PressureUnit = "hPa" | "mbar" | "inHg" | "mmHg" | "kPa";
export type TempUnit = "C" | "F";

export const PRESSURE_UNITS: { value: PressureUnit; label: string; symbol: string }[] = [
  { value: "hPa",  label: "Hectopascals",          symbol: "hPa"  },
  { value: "mbar", label: "Millibars",              symbol: "mbar" },
  { value: "inHg", label: "Inches of mercury",      symbol: "inHg" },
  { value: "mmHg", label: "Millimeters of mercury", symbol: "mmHg" },
  { value: "kPa",  label: "Kilopascals",            symbol: "kPa"  },
];

export const TEMP_UNITS: { value: TempUnit; label: string; symbol: string }[] = [
  { value: "C", label: "Celsius",    symbol: "°C" },
  { value: "F", label: "Fahrenheit", symbol: "°F" },
];

/** Convert hPa → target unit */
export function convertPressure(hPa: number, unit: PressureUnit): number {
  switch (unit) {
    case "hPa":  return hPa;
    case "mbar": return hPa;            // 1 hPa = 1 mbar exactly
    case "inHg": return hPa * 0.02953;
    case "mmHg": return hPa * 0.75006;
    case "kPa":  return hPa * 0.1;
  }
}

export function pressureDecimals(unit: PressureUnit): number {
  switch (unit) {
    case "inHg": return 2;
    case "kPa":  return 2;
    case "mmHg": return 1;
    default:     return 1;
  }
}

export function formatPressure(hPa: number, unit: PressureUnit): string {
  const v = convertPressure(hPa, unit);
  return `${v.toFixed(pressureDecimals(unit))} ${unit}`;
}

/** Convert °C → target unit */
export function convertTemp(c: number, unit: TempUnit): number {
  return unit === "F" ? c * 9 / 5 + 32 : c;
}

export function formatTemp(c: number, unit: TempUnit): string {
  return `${convertTemp(c, unit).toFixed(0)}°${unit}`;
}
