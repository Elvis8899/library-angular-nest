import { Prisma } from "@db/generated/client";
import { PrismaService } from "@shared/prisma/adapter/prisma.service";

// Every model's table, so a new model is emptied too
const tables = Object.values(Prisma.ModelName)
  .map((table) => `"${table}"`)
  .join(", ");

/** Empties every table of the test database. */
export const resetDatabase = async (prisma: PrismaService): Promise<void> => {
  // Model names from Prisma's own enum, never user input
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE`);
};
