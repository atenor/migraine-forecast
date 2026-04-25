export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { prisma, hasDB } from "@/lib/db";
import { TREATMENTS, CITATIONS } from "@/lib/evidence-data";

export async function GET() {
  if (hasDB) {
    try {
      const rows = await prisma.treatment.findMany({
        orderBy: [{ type: "asc" }, { name: "asc" }],
        include: { citations: { include: { citation: true } } },
      });
      return NextResponse.json({
        source: "db",
        treatments: rows.map(r => ({
          key: r.key,
          name: r.name,
          category: r.category,
          type: r.type,
          description: r.description,
          dosing: r.dosing,
          evidenceLevel: r.evidenceLevel,
          nnt: r.nnt,
          cautions: r.cautions,
          citations: r.citations.map(tc => ({
            slug: tc.citation.slug,
            authors: tc.citation.authors,
            year: tc.citation.year,
            title: tc.citation.title,
            journal: tc.citation.journal,
            url: tc.citation.url,
            evidenceLevel: tc.citation.evidenceLevel,
            studyType: tc.citation.studyType,
            effectNote: tc.effectNote,
          })),
        })),
      });
    } catch { /* fall through */ }
  }
  return NextResponse.json({
    source: "constants",
    treatments: TREATMENTS.map(t => ({
      ...t,
      citations: t.citations.map(({ slug, effectNote }) => {
        const c = CITATIONS.find(x => x.slug === slug);
        return c ? {
          slug, effectNote, authors: c.authors, year: c.year,
          title: c.title, journal: c.journal, url: c.url,
          evidenceLevel: c.evidenceLevel, studyType: c.studyType,
        } : { slug, effectNote };
      }),
    })),
  });
}
