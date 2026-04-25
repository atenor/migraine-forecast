import { NextRequest, NextResponse } from "next/server";
import { broadcastPush, getNotifyCopy } from "@/lib/push";

export const dynamic = "force-dynamic";

// POST /api/notify  { level: "high" | "very-high" | "moderate" }
// Called client-side when forecast returns risk ≥ 50
export async function POST(req: NextRequest) {
  try {
    const { level } = await req.json();
    const copy = getNotifyCopy(level);
    await broadcastPush({ ...copy, url: "/" });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("notify error", e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
