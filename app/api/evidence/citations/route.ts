export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma, hasDB } from "@/lib/db";
import { CITATIONS } from "@/lib/evidence-data";

export async function GET() {
  if (hasDB) {
    try {
      const rows = await prisma.citation.findMany({ orderBy: [{ year: "desc" }, { authors: "asc" }] });
      return NextResponse.json({ source: "db", citations: rows });
    } catch { /* fall through */ }
  }
  return NextResponse.json({
    source: "constants",
    citations: [...CITATIONS].sort((a, b) => b.year - a.year || a.authors.localeCompare(b.authors)),
  });
}
