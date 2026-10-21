import { HttpStatus } from "@nestjs/common";
import { executeTask } from "@shared/utils/application/executeTask";
import { MockAuthGuardBuilder } from "@test/dataBuilders/mockAuthGuardBuilder";
import { UserBuilder } from "@test/dataBuilders/userBuilder";
import { useE2eApp } from "@test/util/e2eApp";
import { resetDatabase } from "@test/util/resetDatabase";
import { UserRepository } from "@user/database/user.repository.port";
import { UserRoleEnum } from "@user/domain/user.entity";
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
  const v1Route = (id: string) => "/v1/users/" + id;

  it("Should respond 200 with user List", async () => {
    const user = new UserBuilder().withName("Test").build();
    await executeTask(userRepository.save(user));

    const response = await e2e.http().get(v1Route(user.id)).query({
      limit: 10,
      page: 0,
    });
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body?.id).toBe(user.id);
    expect(response.body).not.toHaveProperty("password");
  });

  it("Should respond 403 for client role", async () => {
    mockAuthGuard.withRole(UserRoleEnum.Client);
    const response = await e2e
      .http()
      .get(v1Route("00000000-0000-0000-0001-000000000000"));
    mockAuthGuard.reset();
    expect(response.status).toBe(HttpStatus.FORBIDDEN);
  });

  it("Should respond 404 when user not found", async () => {
    const response = await e2e
      .http()
      .get(v1Route("00000000-0000-0000-0001-000000000000"))
      .query({
        limit: 100,
        page: 1,
      });
    expect(response.status).toBe(HttpStatus.NOT_FOUND);
  });
});
