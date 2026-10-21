import { PrismaClient } from "@db/generated/client";
import { bookSeed } from "@db/seed/book.seed";
import { userSeed } from "@db/seed/user.seed";
import { formatDocument } from "@modules/user/domain/document";
import { BcryptPasswordHasher } from "@modules/user/utils/bcryptPasswordHasher";
import { createPrismaAdapter } from "@shared/prisma/prisma.service";

/**
 * Seeds the demo data. Safe to run on every start: the data refers to
 * itself (the example's rentals point at the seeded client), so it seeds
 * all or nothing, and only into an empty database.
 */
export async function seed(
  prisma: PrismaClient,
): Promise<"seeded" | "skipped"> {
  const counts = await Promise.all([
    prisma.user.count(),
    // Lending example
    prisma.bookInfo.count(),
  ]);
  if (counts.some((count) => count > 0)) {
    console.log("Skipping seed: the database is not empty.");
    return "skipped";
  }

  console.log(`Start seeding ...`);
  const passwordHasher = new BcryptPasswordHasher();
  const usersToCreate = await Promise.all(
    userSeed.map(async (user) => ({
      ...user,
      password: await passwordHasher.hash(user.password),
      cpf: formatDocument(user.cpf || ""),
    })),
  );
  await Promise.all(usersToCreate.map((data) => prisma.user.create({ data })));
  console.log(`Created users`);

  // Lending example
  await Promise.all(bookSeed.map((data) => prisma.bookInfo.create({ data })));
  console.log(`Created books`);

  console.log(`Seeding finished.`);
  return "seeded";
}

// Run by `yarn seed` (prisma db seed), not when a test imports seed()
/* istanbul ignore next */
if (require.main === module) {
  const prisma = new PrismaClient({ adapter: createPrismaAdapter() });
  seed(prisma)
    .then(() => prisma.$disconnect())
    .catch(async (e: unknown) => {
      console.error(e);
      await prisma.$disconnect();
      process.exit(1);
    });
}
