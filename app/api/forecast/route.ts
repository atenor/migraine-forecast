export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { fetchWeather } from "@/lib/weather";
import {
  computeRiskWindows,
  computePersonalSensitivity,
  peakRiskNext24h,
  lifestyleAdjustment,
  type TodayCheckIn,
} from "@/lib/risk";
import { getSuggestions } from "@/lib/suggestions";
import { prisma, hasDB } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") || "40.7128");
  const lon = parseFloat(searchParams.get("lon") || "-74.0060");

  // Pull every check-in field if it was passed (Dashboard sends them)
  const num = (k: string) => {
    const v = searchParams.get(k);
    return v === null ? undefined : parseFloat(v);
  };
  const bool = (k: string) => {
    const v = searchParams.get(k);
    return v === null ? undefined : v === "true";
  };

  const sleepHours  = num("sleepHours")  ?? 7;
  const stressLevel = num("stressLevel") ?? 2;

  const checkin: TodayCheckIn = {
    sleepHours,
    sleepQuality: num("sleepQuality"),
    stressLevel,
    hydration:    num("hydration"),
    caffeine:     num("caffeine"),
    alcohol:      num("alcohol"),
    exercise:     bool("exercise"),
    menstrual:    bool("menstrual"),
    screenTime:   num("screenTime"),
    hasMigraine:  bool("hasMigraine"),
  };
  // Did the request actually carry today's check-in beyond the defaults?
  const hasCheckin = ["sleepQuality", "hydration", "caffeine", "alcohol", "exercise", "menstrual", "screenTime"]
    .some(k => searchParams.get(k) !== null);

  try {
    const weather = await fetchWeather(lat, lon);

    // DB calls are optional — app works without a database
    let recentLogs: Awaited<ReturnType<typeof prisma.dailyLog.findMany>> = [];
    if (hasDB) { try { recentLogs = await prisma.dailyLog.findMany({ orderBy: { date: "desc" }, take: 90 }); } catch { /* no db */ } }

    const sensitivity = computePersonalSensitivity(recentLogs);
    const windows = computeRiskWindows(weather.hourly, sleepHours, stressLevel, sensitivity, hasCheckin ? checkin : undefined);
    const peak = peakRiskNext24h(windows);

    // Surface the check-in contributions for the UI
    const { contributions, delta: checkinDelta } = lifestyleAdjustment(hasCheckin ? checkin : undefined);

    const reliefCountMap: Record<string, { count: number; ratingTotal: number }> = {};
    recentLogs.filter(l => l.hasMigraine).forEach(l => {
      let methods: string[] = []; try { methods = JSON.parse(l.reliefMethods); } catch { /* empty */ }
      methods.forEach(m => { if (!reliefCountMap[m]) reliefCountMap[m] = { count: 0, ratingTotal: 0 }; reliefCountMap[m].count++; reliefCountMap[m].ratingTotal += l.reliefRating; });
    });
    const reliefPatterns = Object.entries(reliefCountMap).map(([reliefMethod, d]) => ({ reliefMethod, avgSeverityReduction: d.ratingTotal / d.count, useCount: d.count }));
    const suggestions = getSuggestions(peak.riskScore, false, reliefPatterns, stressLevel, sleepHours);

    if (hasDB) { try { await prisma.weatherSnapshot.create({ data: { pressureHpa: weather.current.pressureHpa, tempC: weather.current.tempC, humidity: weather.current.humidity, condition: weather.current.condition, lat, lon } }); } catch { /* no db */ } }

    return NextResponse.json({
      current: weather.current,
      windows,
      peak,
      sensitivity,
      suggestions,
      personalized: hasCheckin,
      checkinContributions: contributions,
      checkinDelta,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch forecast" }, { status: 500 });
  }
}
