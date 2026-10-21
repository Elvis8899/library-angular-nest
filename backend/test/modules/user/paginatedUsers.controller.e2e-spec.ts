import { Prisma } from "@db/generated/client";
import { UserRepository } from "@modules/user/database/user.repository.port";
import { UserRoleEnum } from "@modules/user/domain/user.entity";
import { HttpStatus } from "@nestjs/common";
import { executeTask } from "@shared/utils/application/executeTask";
import { MockAuthGuardBuilder } from "@test/dataBuilders/mockAuthGuardBuilder";
import { UserBuilder } from "@test/dataBuilders/userBuilder";
import { useE2eApp } from "@test/util/e2eApp";
import { resetDatabase } from "@test/util/resetDatabase";
const mockAuthGuard = new MockAuthGuardBuilder();

let userRepository: UserRepository;
const e2e = useE2eApp({ authGuard: mockAuthGuard });

beforeAll(() => {
  userRepository = e2e.get(UserRepository);
});

beforeEach(async () => {
  await resetDatabase(e2e.prisma);
});

describe("[e2e] GET /v1/users", () => {
  const v1Route = "/v1/users";

  it("Should respond 200 with user List", async () => {
    const user = new UserBuilder().withName("Test").build();
    await executeTask(userRepository.save(user));

    const response = await e2e.http().get(v1Route).query({
      limit: 10,
      page: 0,
    });
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body?.count).toBe(1);
    expect(response.body?.data?.length).toBe(1);
    expect(response.body?.data?.[0]).not.toHaveProperty("password");
  });

  it("Should respond 403 for client role", async () => {
    mockAuthGuard.withRole(UserRoleEnum.Client);
    const response = await e2e.http().get(v1Route).query({
      limit: 10,
      page: 0,
    });
    mockAuthGuard.reset();
    expect(response.status).toBe(HttpStatus.FORBIDDEN);
  });

  it("Should respond 500 without the database's error details", async () => {
    // The kind of error Prisma throws for a unique constraint, with the
    // constraint and table names in its fields
    const databaseError = new Prisma.PrismaClientKnownRequestError(
      'duplicate key value violates unique constraint "User_email_key"',
      { code: "P2002", clientVersion: "7.10.1", meta: { modelName: "User" } },
    );
    const findMany = vi
      .spyOn(e2e.prisma.user, "findMany")
      .mockRejectedValueOnce(databaseError);

    const response = await e2e.http().get("/v1/users");

    findMany.mockRestore();
    expect(response.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(response.body).toEqual({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: "Internal Server Error",
      message: "Erro interno do servidor.",
      code: "unknown",
    });
  });

  it("Should respond 200 with empty list", async () => {
    const response = await e2e.http().get(v1Route).query({
      limit: 100,
      page: 1,
    });
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body?.count).toBe(0);
  });
});
