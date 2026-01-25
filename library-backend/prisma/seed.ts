import { PrismaClient } from "@prisma/client";
import { userSeed } from "./seed/user.seed";
import { bookSeed } from "./seed/book.seed";
import { hashPassword } from "@src/modules/auth/util/signTokenParams";
import { formatToCPF } from "@src/modules/user/domain/value-object/document";

const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);
  const userWithHashedPassword = await Promise.all(
    userSeed.map(async (user) => {
      user.password = await hashPassword(user.password);
      user.cpf = formatToCPF(user.cpf || "");
      return user;
    }),
  );
  await Promise.all(
    userWithHashedPassword.map((data) => prisma.user.create({ data })),
  );

  console.log(`Created users`);

  await Promise.all(bookSeed.map((data) => prisma.bookInfo.create({ data })));

  console.log(`Created books`);

  console.log(`Seeding finished.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
