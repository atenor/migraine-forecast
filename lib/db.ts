import { PrismaClient } from "@prisma/client";

export const hasDB = Boolean(process.env.DATABASE_URL);

/**
 * When no DATABASE_URL is set, `new PrismaClient()` itself throws
 * (Prisma 5 validates the env var at construction time). So we return
 * a Proxy stub instead — any property access returns a model proxy
 * whose methods reject. All API routes are already gated on `hasDB`,
 * so these methods are never actually called; the stub just prevents
 * the import-time crash.
 */
function createStubPrisma(): PrismaClient {
  const reject = () => Promise.reject(new Error("No DATABASE_URL configured"));
  const modelProxy = new Proxy({}, { get: () => reject });
  return new Proxy({} as PrismaClient, {
    get: (_target, prop) => {
      if (prop === "$connect" || prop === "$disconnect") return reject;
      if (prop === "then") return undefined; // not a thenable
      return modelProxy;
    },
  });
}

function createPrismaClient(): PrismaClient {
  if (!hasDB) return createStubPrisma();
  return new PrismaClient({ log: ["error"] });
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || createPrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
