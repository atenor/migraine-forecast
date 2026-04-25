export interface HourlyForecast { time: string; pressureHpa: number; tempC: number; humidity: number; }
export interface WeatherData { current: { pressureHpa: number; tempC: number; humidity: number; condition: string; }; hourly: HourlyForecast[]; lat: number; lon: number; }
export async function fetchWeather(lat: number, lon: number): Promise<WeatherData> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=surface_pressure,temperature_2m,relative_humidity_2m,weather_code&hourly=surface_pressure,temperature_2m,relative_humidity_2m&forecast_days=4&timezone=auto`;
  const res = await fetch(url, { next: { revalidate: 1800 } });
  if (!res.ok) throw new Error("Weather API failed");
  const data = await res.json();
  const current = { pressureHpa: data.current.surface_pressure, tempC: data.current.temperature_2m, humidity: data.current.relative_humidity_2m, condition: wCode(data.current.weather_code) };
  const hourly: HourlyForecast[] = data.hourly.time.slice(0, 72).map((t: string, i: number) => ({ time: t, pressureHpa: data.hourly.surface_pressure[i], tempC: data.hourly.temperature_2m[i], humidity: data.hourly.relative_humidity_2m[i] }));
  return { current, hourly, lat, lon };
}
function wCode(code: number): string {
  if (code === 0) return "Clear"; if (code <= 3) return "Partly Cloudy"; if (code <= 48) return "Foggy"; if (code <= 67) return "Rain"; if (code <= 77) return "Snow"; if (code <= 82) return "Showers"; if (code <= 99) return "Thunderstorm"; return "Unknown";
}
export function getPressureDeltas(hourly: HourlyForecast[]) {
  return hourly.map((h, i) => ({ ...h, delta3h: i >= 3 ? h.pressureHpa - hourly[i-3].pressureHpa : 0, delta6h: i >= 6 ? h.pressureHpa - hourly[i-6].pressureHpa : 0, delta12h: i >= 12 ? h.pressureHpa - hourly[i-12].pressureHpa : 0, delta24h: i >= 24 ? h.pressureHpa - hourly[i-24].pressureHpa : 0 }));
}
