import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Prisma } from "@/generated/prisma/client";
import { getEnv } from "./env";

const globalForDb = globalThis as unknown as { __levelupPrisma?: PrismaClient };

function client(): PrismaClient {
  if (!globalForDb.__levelupPrisma) {
    const adapter = new PrismaPg({ connectionString: getEnv().DATABASE_URL, max: 10 });
    globalForDb.__levelupPrisma = new PrismaClient({ adapter });
  }
  return globalForDb.__levelupPrisma;
}

/** Lazily-connected Prisma client: importing this module never touches the environment or the network. */
export const db: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    return Reflect.get(client(), prop, receiver);
  },
});

export type Tx = Prisma.TransactionClient;
export { Prisma };

/** True when a Prisma error is a unique-constraint violation (optionally on a given target fragment). */
export function isUniqueViolation(err: unknown, targetFragment?: string): boolean {
  if (!(err instanceof Prisma.PrismaClientKnownRequestError) || err.code !== "P2002") return false;
  if (!targetFragment) return true;
  return JSON.stringify(err.meta ?? {}).includes(targetFragment) || err.message.includes(targetFragment);
}

export async function disconnectDb(): Promise<void> {
  if (globalForDb.__levelupPrisma) {
    await globalForDb.__levelupPrisma.$disconnect();
    globalForDb.__levelupPrisma = undefined;
  }
}
