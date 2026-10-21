import { HttpStatus } from "@nestjs/common";
import { useE2eApp } from "@test/util/e2eApp";
import { resetDatabase } from "@test/util/resetDatabase";

import { UserRepository } from "@modules/user/database/user.repository.port";
import { executeTask } from "@shared/utils/application/executeTask";
import { MockAuthGuardBuilder } from "@test/dataBuilders/mockAuthGuardBuilder";
import { UserBuilder } from "@test/dataBuilders/userBuilder";

let userRepository: UserRepository;
const e2e = useE2eApp({ authGuard: new MockAuthGuardBuilder() });

beforeAll(() => {
  userRepository = e2e.get(UserRepository);
});

beforeEach(async () => {
  await resetDatabase(e2e.prisma);
});

describe("[e2e] DELETE /v1/users/:id", () => {
  const v1Route = (userId: string) => "/v1/users/" + userId;

  it("Should respond 200 for deleted user", async () => {
    const user = new UserBuilder().withName("Test").build();
    await executeTask(userRepository.save(user));

    const response = await e2e.http().delete(v1Route(user.id));

    expect(response.status).toBe(HttpStatus.OK);
    const userAmount = await e2e.prisma.user.count();
    expect(userAmount).toBe(0);
  });

  it("Should respond 422 for invalid id", async () => {
    const response = await e2e.http().delete(v1Route("fakeId"));
    expect(response.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
  });

  it("Should respond 404 for user not found", async () => {
    const user = new UserBuilder().withName("Test").build();
    const response = await e2e.http().delete(v1Route(user.id));
    expect(response.status).toBe(HttpStatus.NOT_FOUND);
  });
});
