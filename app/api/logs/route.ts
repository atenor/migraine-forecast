export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { prisma, hasDB } from "@/lib/db";
export async function GET(req: NextRequest) {
  const sp = new URL(req.url).searchParams;
  const limit = parseInt(sp.get("limit") || "60");
  const start = sp.get("start"), end = sp.get("end");
  if (!hasDB) return NextResponse.json({ logs: [] });
  const where: Record<string, unknown> = {};
  if (start || end) where.date = { ...(start ? { gte: start } : {}), ...(end ? { lte: end } : {}) };
  try {
    const logs = await prisma.dailyLog.findMany({ where, orderBy: { date: "desc" }, take: limit });
    return NextResponse.json({ logs });
  } catch {
    return NextResponse.json({ logs: [] });
  }
}
