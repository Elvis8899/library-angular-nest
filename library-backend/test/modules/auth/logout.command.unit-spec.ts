import {
  LogoutCommand,
  LogoutCommandHandler,
} from "@auth/commands/logout/logout.command";
import { UnprocessableEntityException } from "@nestjs/common";
import { executeTask } from "@shared/utils/application/executeTask";
import { O } from "@shared/utils/application/monads";
import { UserBuilder } from "@test/dataBuilders/userBuilder";
import { createTestId, TableNameEnum } from "@test/util/defaultIds";
import { useHandlerModule } from "@test/util/handlerModule";
import { UserRepository } from "@user/database/user.repository.port";

describe("[Unit] Logout", () => {
  const user = new UserBuilder().build();

  const ctx = useHandlerModule(
    { providers: [LogoutCommandHandler] },
    (get) => ({
      userRepository: get(UserRepository),
      logoutCommandHandler: get(LogoutCommandHandler),
    }),
  );

  it("Should revoke the user's refresh tokens", async () => {
    await executeTask(ctx.userRepository.save(user));

    await ctx.logoutCommandHandler.execute(new LogoutCommand(user.id));

    const stored = await executeTask(ctx.userRepository.findById(user.id));
    expect(stored).toEqual(
      O.some(expect.objectContaining({ tokenVersion: user.tokenVersion + 1 })),
    );
  });

  it("Should succeed for a user that no longer exists", async () => {
    const resultPromise = ctx.logoutCommandHandler.execute(
      new LogoutCommand(createTestId(TableNameEnum.User, 9)),
    );

    await expect(resultPromise).resolves.toBeUndefined();
  });

  it("Should reject an invalid user id", async () => {
    const resultPromise = ctx.logoutCommandHandler.execute(
      new LogoutCommand("not-a-uuid"),
    );

    await expect(resultPromise).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
  });
});
