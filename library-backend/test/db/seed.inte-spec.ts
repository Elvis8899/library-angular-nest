import { comparePassword } from "@auth/util/signTokenParams";
import { seed } from "@db/seed";
import { PrismaService } from "@shared/prisma/adapter/prisma.service";
import { UserBuilder } from "@test/dataBuilders/userBuilder";
import { createTestId, TableNameEnum } from "@test/util/defaultIds";

const prismaService = new PrismaService();

const clearSeededTables = async () => {
  await prismaService.bookRentalDetails.deleteMany();
  await prismaService.bookItem.deleteMany();
  await prismaService.bookInfo.deleteMany();
  await prismaService.refreshSession.deleteMany();
  await prismaService.user.deleteMany();
};

beforeEach(async () => {
  await clearSeededTables();
  jest.spyOn(console, "log").mockImplementation(() => undefined);
});

afterAll(async () => {
  await clearSeededTables();
  await prismaService.$disconnect();
});

describe("[Integration] Database seed", () => {
  it("Should create the demo users and books in an empty database", async () => {
    //When we seed an empty database
    const result = await seed(prismaService);

    //Then the demo users exist, with hashed passwords and a formatted CPF
    expect(result).toBe("seeded");
    const users = await prismaService.user.findMany({
      orderBy: { email: "asc" },
    });
    expect(users.map(({ email, role, cpf }) => ({ email, role, cpf }))).toEqual(
      [
        { email: "admin@admin.com", role: "admin", cpf: "" },
        { email: "client@client.com", role: "client", cpf: "529.982.247-25" },
      ],
    );
    const [admin, client] = users;
    expect(await comparePassword("admin", admin?.password ?? "")).toBe(true);
    expect(await comparePassword("client", client?.password ?? "")).toBe(true);

    //And the books, each with a copy rented by the client
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

  it("Should hash the passwords again when seeding a second database", async () => {
    //Given a database seeded once and then emptied
    await seed(prismaService);
    await clearSeededTables();

    //When we seed it again in the same process
    await seed(prismaService);

    //Then the passwords still match: the seed data was not changed in place
    const admin = await prismaService.user.findUnique({
      where: { email: "admin@admin.com" },
    });
    expect(await comparePassword("admin", admin?.password ?? "")).toBe(true);
  });

  it("Should skip a database that already has users", async () => {
    //Given a database with one user
    const user = new UserBuilder().build();
    await prismaService.user.create({ data: user });

    //When we seed it
    const result = await seed(prismaService);

    //Then nothing is added
    expect(result).toBe("skipped");
    expect(await prismaService.user.count()).toBe(1);
    expect(await prismaService.bookInfo.count()).toBe(0);
  });

  it("Should skip a database that already has books", async () => {
    //Given a database with one book and no users
    await prismaService.bookInfo.create({
      data: {
        id: createTestId(TableNameEnum.BookInfo, 1),
        name: "Dom Casmurro",
        image: "",
        price: 10,
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
