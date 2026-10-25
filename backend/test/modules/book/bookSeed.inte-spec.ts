import { seed } from "@db/seed";
import { PrismaService } from "@shared/prisma/prisma.service";
import { UserBuilder } from "@test/dataBuilders/userBuilder";
import { createTestId, TableNameEnum } from "@test/util/defaultIds";
import { resetDatabase } from "@test/util/resetDatabase";

// The lending example's part of prisma/seed.ts (test/db/seed.inte-spec.ts
// checks the users)

const prismaService = new PrismaService();

beforeEach(async () => {
  await resetDatabase(prismaService);
  vi.spyOn(console, "log").mockImplementation(() => undefined);
});

afterAll(async () => {
  await prismaService.$disconnect();
});

describe("[Integration] Database seed: books", () => {
  it("Should create the books, each with a copy rented by the client", async () => {
    //When we seed an empty database
    await seed(prismaService);

    //Then each book has one copy, rented by the demo client
    const client = await prismaService.user.findUnique({
      where: { email: "client@client.com" },
    });
    const books = await prismaService.bookInfo.findMany({
      include: { bookItems: { include: { bookRental: true } } },
    });
    expect(books).toHaveLength(3);
    for (const book of books) {
      expect(book.bookItems).toHaveLength(1);
      expect(book.bookItems[0]?.bookRental).toHaveLength(1);
      expect(book.bookItems[0]?.bookRental[0]?.userId).toBe(client?.id);
    }
  });

  it("Should add no books to a database that already has users", async () => {
    //Given a database with one user
    await prismaService.user.create({ data: new UserBuilder().build() });

    //When we seed it
    await seed(prismaService);

    //Then no books are added
    expect(await prismaService.bookInfo.count()).toBe(0);
  });

  it("Should skip a database that already has books", async () => {
    //Given a database with one book and no users
    await prismaService.bookInfo.create({
      data: {
        id: createTestId(TableNameEnum.BookInfo, 1),
        name: "Dom Casmurro",
        priceCents: 1000,
      },
    });

    //When we seed it
    const result = await seed(prismaService);

    //Then nothing is added
    expect(result).toBe("skipped");
    expect(await prismaService.user.count()).toBe(0);
    expect(await prismaService.bookInfo.count()).toBe(1);
  });
});
