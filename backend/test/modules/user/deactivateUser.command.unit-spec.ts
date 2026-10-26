import {
  DeactivateUser,
  DeactivateUserHandler,
} from "@modules/user/commands/deactivateUser/deactivateUser.command";
import {
  ReactivateUser,
  ReactivateUserHandler,
} from "@modules/user/commands/reactivateUser/reactivateUser.command";
import { UserRepository } from "@modules/user/database/user.repository.port";
import {
  UserDeactivatesSelfException,
  UserNotFoundException,
} from "@modules/user/domain/user.errors";
import { UnprocessableEntityException } from "@nestjs/common";
import { DomainEventPublisher } from "@shared/domainEventPublisher/domainEventPublisher";
import { executeTask } from "@shared/utils/application/executeTask";
import { O } from "@shared/utils/application/monads";
import { UserBuilder } from "@test/dataBuilders/userBuilder";
import { createTestId, TableNameEnum } from "@test/util/defaultIds";
import { useHandlerModule } from "@test/util/handlerModule";

const adminId = createTestId(TableNameEnum.User, 50);
const missingId = createTestId(TableNameEnum.User, 99);

describe("[Unit] Deactivate and reactivate User", () => {
  const ctx = useHandlerModule(
    { providers: [DeactivateUserHandler, ReactivateUserHandler] },
    (get) => ({
      users: get(UserRepository),
      deactivate: get(DeactivateUserHandler),
      reactivate: get(ReactivateUserHandler),
      events: get(DomainEventPublisher),
    }),
  );

  const user = new UserBuilder().build();
  const stored = async () =>
    O.toUndefined(await executeTask(ctx.users.findById(user.id)));

  beforeEach(async () => {
    await executeTask(ctx.users.save(user));
  });

  it("Should deactivate the account, keep it and end its sessions", async () => {
    const spy = vi.spyOn(ctx.events, "publishEvent");

    await ctx.deactivate.execute(new DeactivateUser(user.id, adminId));

    expect(await stored()).toMatchObject({
      active: false,
      tokenVersion: user.tokenVersion + 1,
      updatedAt: new Date("2026-10-21T12:00:00Z"),
    });
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ eventKey: "user.deactivated" }),
    );
  });

  it("Should not let an admin deactivate their own account", async () => {
    const result = ctx.deactivate.execute(new DeactivateUser(user.id, user.id));

    await expect(result).rejects.toBeInstanceOf(UserDeactivatesSelfException);
    expect(await stored()).toMatchObject({ active: true });
  });

  it("Should reactivate a deactivated account", async () => {
    await ctx.deactivate.execute(new DeactivateUser(user.id, adminId));
    const spy = vi.spyOn(ctx.events, "publishEvent");

    await ctx.reactivate.execute(new ReactivateUser(user.id));

    expect(await stored()).toMatchObject({
      active: true,
      updatedAt: new Date("2026-10-21T12:00:00Z"),
    });
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ eventKey: "user.reactivated" }),
    );
  });

  it.each([
    [
      "deactivate",
      () => ctx.deactivate.execute(new DeactivateUser(missingId, adminId)),
    ],
    ["reactivate", () => ctx.reactivate.execute(new ReactivateUser(missingId))],
  ])("Should not %s a user that doesn't exist", async (_name, run) => {
    await expect(run()).rejects.toBeInstanceOf(UserNotFoundException);
  });

  it.each([
    [
      "deactivate",
      () => ctx.deactivate.execute(new DeactivateUser("fakeId", adminId)),
    ],
    ["reactivate", () => ctx.reactivate.execute(new ReactivateUser("fakeId"))],
  ])("Should not %s an invalid id", async (_name, run) => {
    await expect(run()).rejects.toBeInstanceOf(UnprocessableEntityException);
  });
});
