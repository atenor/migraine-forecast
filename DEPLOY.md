# Deployment — Vercel + Railway Postgres

This app runs on Vercel with a Railway PostgreSQL database. Without `DATABASE_URL` set, the app still works — every API route falls back gracefully — but logs aren't persisted and the evidence base is read from in-app constants instead of the DB.

## 1. Provision a Railway database

1. Go to [railway.app](https://railway.app) → **New Project → Provision PostgreSQL**
2. Once created, open the database service → **Connect** tab
3. Copy the **DATABASE_URL** (the full `postgresql://...` connection string)

## 2. Add env vars to Vercel

In your Vercel project → **Settings → Environment Variables**, add to **Production** + **Preview**:

| Key | Value |
|---|---|
| `DATABASE_URL` | Railway connection string |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | (optional, for push notifications — generate via `npx web-push generate-vapid-keys`) |
| `VAPID_PRIVATE_KEY` | (optional) |
| `VAPID_SUBJECT` | `mailto:you@example.com` |

Also copy these into your local `.env.local` for development.

## 3. Run the migration

```bash
# From your local machine, with .env.local pointing at Railway
npm run db:push
```

This pushes the Prisma schema (DailyLog, WeatherSnapshot, Citation, Trigger, TriggerCitation, Treatment, TreatmentCitation) into Railway.

For prod-grade migrations, prefer:

```bash
npx prisma migrate dev --name init        # generate the migration locally
git add prisma/migrations && git commit
# Vercel will run `npm run db:migrate` (= prisma migrate deploy) on each deploy
```

## 4. Seed the evidence base

The first time (and any time `lib/evidence-data.ts` is updated):

```bash
npm run db:seed-evidence
```

You should see something like:

```
→ Seeding 25 citations…
→ Seeding 12 triggers…
→ Seeding 14 treatments…
✓ Seed complete: { citations: 25, triggers: 12, treatments: 14 }
```

The seed is **idempotent** — safe to re-run. It upserts on `slug` (citations) and `key` (triggers/treatments), and replaces the link rows.

## 5. Deploy to Vercel

```bash
git push origin main
```

Vercel detects Next.js and runs `npm run build` automatically. The `postinstall` script (`prisma generate`) makes sure the Prisma client is regenerated on every install.

## 6. Verify the live deploy

Once deployed, hit:

- `https://yoursite.vercel.app/api/forecast?lat=40.7&lon=-74` — should return real weather + risk
- `https://yoursite.vercel.app/api/evidence/triggers` — `source` should be `"db"`
- `https://yoursite.vercel.app/research` — the science page should list 25 citations

## What if I don't connect a database?

The app is designed to work without one for development:

- `/api/checkin` GET returns `{ log: null }`, POST returns `{ success: true, noDB: true }`
- `/api/forecast` uses live weather but skips the personalisation cache
- `/api/evidence/*` serves from `lib/evidence-data.ts`
- All Dashboard features work; the only thing missing is *persistence* of user logs

When you eventually provision a DB, all the routes start using it automatically (the `hasDB` short-circuit in `lib/db.ts`).

## Troubleshooting

**`error: Environment variable not found: DATABASE_URL` at import time**
The codebase handles this — `lib/db.ts` returns a Proxy stub when `DATABASE_URL` is missing. If you see this, you've likely added a Prisma call that bypasses the `hasDB` gate.

**Seed fails with "Can't reach database server"**
Double-check that `DATABASE_URL` in `.env.local` points to your Railway database. Railway connection strings work directly with Prisma — no separate direct URL needed.

**Seeded rows but `/research` still shows "Reading from in-app cache"**
The `/api/evidence/*` routes only return `source: "db"` if `hasDB` is true. Make sure `DATABASE_URL` is set for the runtime that's serving the request.
