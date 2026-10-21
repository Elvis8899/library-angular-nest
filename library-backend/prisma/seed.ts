import { hashPassword } from "@auth/utils/password";
import { PrismaClient } from "@db/generated/client";
import { bookSeed } from "@db/seed/book.seed";
import { userSeed } from "@db/seed/user.seed";
import { createPrismaAdapter } from "@shared/prisma/prisma.service";
import { formatDocument } from "@user/domain/document";

/**
 * Seeds the demo users and books. Safe to run on every start: the seeded
 * books' rentals point at the seeded client, so it seeds all or nothing,
 * and only into an empty database.
 */
export async function seed(
  prisma: PrismaClient,
): Promise<"seeded" | "skipped"> {
  const [users, books] = await Promise.all([
    prisma.user.count(),
    prisma.bookInfo.count(),
  ]);
  if (users > 0 || books > 0) {
    console.log(
      `Skipping seed: the database already has ${String(users)} users and ${String(books)} books.`,
    );
    return "skipped";
  }

  console.log(`Start seeding ...`);
  const usersToCreate = await Promise.all(
    userSeed.map(async (user) => ({
      ...user,
      password: await hashPassword(user.password),
      cpf: formatDocument(user.cpf || ""),
    })),
  );
  await Promise.all(usersToCreate.map((data) => prisma.user.create({ data })));
  console.log(`Created users`);

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
