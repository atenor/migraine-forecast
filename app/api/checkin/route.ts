export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma, hasDB } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    if (!b.date) return NextResponse.json({ error: "date required" }, { status: 400 });
    if (!hasDB) return NextResponse.json({ success: true, noDB: true });

    const data = {
      checkinRole:      b.checkinRole      ?? "",
      sleepHours:       b.sleepHours       ?? 7,
      sleepQuality:     b.sleepQuality     ?? 3,
      stressLevel:      b.stressLevel      ?? 2,
      hydration:        b.hydration        ?? 0,
      caffeine:         b.caffeine         ?? 0,
      alcohol:          b.alcohol          ?? 0,
      exercise:         b.exercise         ?? false,
      menstrual:        b.menstrual        ?? false,
      medications:      Array.isArray(b.medications)
                          ? JSON.stringify(b.medications)
                          : (b.medications ?? "[]"),
      prodrome:         Array.isArray(b.prodrome)
                          ? JSON.stringify(b.prodrome)
                          : (b.prodrome ?? "[]"),
      notes:            b.notes            ?? "",
      hasMigraine:      b.hasMigraine      ?? false,
      migraineSeverity: b.migraineSeverity ?? 0,
      migraineDuration: b.migraineDuration ?? 0,
      migraineLocation: b.migraineLocation ?? "",
      reliefMethods:    Array.isArray(b.reliefMethods)
                          ? JSON.stringify(b.reliefMethods)
                          : (b.reliefMethods ?? "[]"),
      reliefRating:     b.reliefRating     ?? 0,
      pressureAtLog:    b.pressureAtLog    ?? 0,
    };

    const log = await prisma.dailyLog.upsert({
      where:  { date: b.date },
      update: data,
      create: { date: b.date, ...data },
    });

    return NextResponse.json({ success: true, log });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const date = new URL(req.url).searchParams.get("date");
  if (!date) return NextResponse.json({ error: "date required" }, { status: 400 });
  if (!hasDB) return NextResponse.json({ log: null });
  try {
    const log = await prisma.dailyLog.findUnique({ where: { date } });
    return NextResponse.json({ log });
  } catch {
    return NextResponse.json({ log: null });
  }
}
