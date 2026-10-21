import { seed } from "@db/seed";
import { BcryptPasswordHasher } from "@modules/user/utils/bcryptPasswordHasher";
import { PrismaService } from "@shared/prisma/prisma.service";
import { UserBuilder } from "@test/dataBuilders/userBuilder";
import { resetDatabase } from "@test/util/resetDatabase";

const passwordHasher = new BcryptPasswordHasher();

const prismaService = new PrismaService();

beforeEach(async () => {
  await resetDatabase(prismaService);
  vi.spyOn(console, "log").mockImplementation(() => undefined);
});

afterAll(async () => {
  await prismaService.$disconnect();
});

describe("[Integration] Database seed", () => {
  it("Should create the demo users in an empty database", async () => {
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
    expect(await passwordHasher.matches("admin", admin?.password ?? "")).toBe(
      true,
    );
    expect(await passwordHasher.matches("client", client?.password ?? "")).toBe(
      true,
    );
  });

  it("Should hash the passwords again when seeding a second database", async () => {
    //Given a database seeded once and then emptied
    await seed(prismaService);
    await resetDatabase(prismaService);

    //When we seed it again in the same process
    await seed(prismaService);

    //Then the passwords still match: the seed data was not changed in place
    const admin = await prismaService.user.findUnique({
      where: { email: "admin@admin.com" },
    });
    expect(await passwordHasher.matches("admin", admin?.password ?? "")).toBe(
      true,
    );
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
  });
});
