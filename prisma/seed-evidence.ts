/**
 * Seeds Citation, Trigger, Treatment, and link tables from lib/evidence-data.ts.
 *
 * Run after `prisma migrate deploy` (or `prisma db push`) on a connected DB:
 *
 *   npx tsx prisma/seed-evidence.ts
 *
 * Idempotent: safe to re-run. Uses upsert on `slug` / `key`.
 */

import { PrismaClient } from "@prisma/client";
import { CITATIONS, TRIGGERS, TREATMENTS } from "../lib/evidence-data";

const prisma = new PrismaClient();

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("✗ No DATABASE_URL set — nothing to seed.");
    process.exit(1);
  }

  console.log(`→ Seeding ${CITATIONS.length} citations…`);
  for (const c of CITATIONS) {
    await prisma.citation.upsert({
      where: { slug: c.slug },
      update: {
        authors: c.authors, year: c.year, title: c.title, journal: c.journal,
        pmid: c.pmid ?? null, doi: c.doi ?? null, url: c.url ?? null,
        studyType: c.studyType, evidenceLevel: c.evidenceLevel,
        sampleSize: c.sampleSize ?? null,
        summary: c.summary, keyFinding: c.keyFinding ?? null,
      },
      create: {
        slug: c.slug, authors: c.authors, year: c.year, title: c.title, journal: c.journal,
        pmid: c.pmid ?? null, doi: c.doi ?? null, url: c.url ?? null,
        studyType: c.studyType, evidenceLevel: c.evidenceLevel,
        sampleSize: c.sampleSize ?? null,
        summary: c.summary, keyFinding: c.keyFinding ?? null,
      },
    });
  }

  console.log(`→ Seeding ${TRIGGERS.length} triggers…`);
  for (const t of TRIGGERS) {
    const trigger = await prisma.trigger.upsert({
      where: { key: t.key },
      update: {
        name: t.name, category: t.category, direction: t.direction,
        description: t.description, weight: t.weight, weightCap: t.weightCap,
        rationale: t.rationale,
      },
      create: {
        key: t.key, name: t.name, category: t.category, direction: t.direction,
        description: t.description, weight: t.weight, weightCap: t.weightCap,
        rationale: t.rationale,
      },
    });
    // Replace its citation links
    await prisma.triggerCitation.deleteMany({ where: { triggerId: trigger.id } });
    for (const cite of t.citations) {
      const c = await prisma.citation.findUnique({ where: { slug: cite.slug } });
      if (!c) { console.warn(`  ! trigger "${t.key}" references unknown citation "${cite.slug}"`); continue; }
      await prisma.triggerCitation.create({
        data: { triggerId: trigger.id, citationId: c.id, effectNote: cite.effectNote },
      });
    }
  }

  console.log(`→ Seeding ${TREATMENTS.length} treatments…`);
  for (const t of TREATMENTS) {
    const treatment = await prisma.treatment.upsert({
      where: { key: t.key },
      update: {
        name: t.name, category: t.category, type: t.type,
        description: t.description, dosing: t.dosing ?? null,
        evidenceLevel: t.evidenceLevel, nnt: t.nnt ?? null, cautions: t.cautions ?? null,
      },
      create: {
        key: t.key, name: t.name, category: t.category, type: t.type,
        description: t.description, dosing: t.dosing ?? null,
        evidenceLevel: t.evidenceLevel, nnt: t.nnt ?? null, cautions: t.cautions ?? null,
      },
    });
    await prisma.treatmentCitation.deleteMany({ where: { treatmentId: treatment.id } });
    for (const cite of t.citations) {
      const c = await prisma.citation.findUnique({ where: { slug: cite.slug } });
      if (!c) { console.warn(`  ! treatment "${t.key}" references unknown citation "${cite.slug}"`); continue; }
      await prisma.treatmentCitation.create({
        data: { treatmentId: treatment.id, citationId: c.id, effectNote: cite.effectNote },
      });
    }
  }

  const totals = {
    citations: await prisma.citation.count(),
    triggers: await prisma.trigger.count(),
    treatments: await prisma.treatment.count(),
  };
  console.log(`✓ Seed complete:`, totals);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
