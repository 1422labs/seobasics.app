import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { getRequiredEnv } from "@/lib/env";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function prisma() {
  if (!globalForPrisma.prisma) {
    const adapter = new PrismaPg({ connectionString: getRequiredEnv("DATABASE_URL") });
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }
  return globalForPrisma.prisma;
}
