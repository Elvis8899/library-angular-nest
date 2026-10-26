import { HttpStatus } from "@nestjs/common";
import { useE2eApp } from "@test/util/e2eApp";
import { resetDatabase } from "@test/util/resetDatabase";

import { UserRepository } from "@modules/user/database/user.repository.port";
import { UserRoleEnum } from "@modules/user/domain/user.entity";
import { executeTask } from "@shared/utils/application/executeTask";
import { MockAuthGuardBuilder } from "@test/dataBuilders/mockAuthGuardBuilder";
import { UserBuilder } from "@test/dataBuilders/userBuilder";

let userRepository: UserRepository;
const authGuard = new MockAuthGuardBuilder();
const e2e = useE2eApp({ authGuard });

beforeAll(() => {
  userRepository = e2e.get(UserRepository);
});

beforeEach(async () => {
  authGuard.reset();
  await resetDatabase(e2e.prisma);
});

describe("[e2e] POST /v1/users/:id/deactivate and /reactivate", () => {
  const route = (userId: string, action: "deactivate" | "reactivate") =>
    `/v1/users/${userId}/${action}`;
  // Another account than the admin's own (MockAuthGuardBuilder's is 1)
  const user = new UserBuilder(2).build();
  const active = async () =>
    (await e2e.prisma.user.findUniqueOrThrow({ where: { id: user.id } }))
      .active;

  it("Should deactivate an account and reactivate it", async () => {
    await executeTask(userRepository.save(user));

    const deactivated = await e2e.http().post(route(user.id, "deactivate"));

    expect(deactivated.status).toBe(HttpStatus.OK);
    expect(await active()).toBe(false);

    const reactivated = await e2e.http().post(route(user.id, "reactivate"));

    expect(reactivated.status).toBe(HttpStatus.OK);
    expect(await active()).toBe(true);
  });

  it("Should respond 409 user.deactivateSelf for the admin's own account", async () => {
    await executeTask(userRepository.save(user));
    authGuard.withSub(user.id);

    const response = await e2e.http().post(route(user.id, "deactivate"));

    expect(response.status).toBe(HttpStatus.CONFLICT);
    expect(response.body.code).toBe("user.deactivateSelf");
  });

  it.each(["deactivate", "reactivate"] as const)(
    "Should respond 404 to %s a user not found, and 422 an invalid id",
    async (action) => {
      expect((await e2e.http().post(route(user.id, action))).status).toBe(
        HttpStatus.NOT_FOUND,
      );
      expect((await e2e.http().post(route("fakeId", action))).status).toBe(
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    },
  );

  it.each(["deactivate", "reactivate"] as const)(
    "Should respond 403 to a client asking to %s",
    async (action) => {
      await executeTask(userRepository.save(user));
      authGuard.withRole(UserRoleEnum.Client);

      const response = await e2e.http().post(route(user.id, action));

      expect(response.status).toBe(HttpStatus.FORBIDDEN);
    },
  );
});
