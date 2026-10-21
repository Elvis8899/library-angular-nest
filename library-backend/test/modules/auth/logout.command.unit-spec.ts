import {
  LogoutCommand,
  LogoutCommandHandler,
} from "@auth/commands/logout/logout.command";
import { UnprocessableEntityException } from "@nestjs/common";
import { executeTask } from "@shared/utils/application/executeTask";
import { O } from "@shared/utils/application/monads";
import { UserBuilder } from "@test/dataBuilders/userBuilder";
import { createTestId, TableNameEnum } from "@test/util/defaultIds";
import { createHandlerModule } from "@test/util/handlerModule";
import { UserRepository } from "@user/database/user.repository.port";

describe("[Unit] Logout", () => {
  let logoutCommandHandler: LogoutCommandHandler;
  let userRepository: UserRepository;
  const user = new UserBuilder().build();

  beforeEach(async () => {
    const moduleRef = await createHandlerModule([LogoutCommandHandler]);

    userRepository = moduleRef.get<UserRepository>(UserRepository);
    logoutCommandHandler =
      moduleRef.get<LogoutCommandHandler>(LogoutCommandHandler);
  });

  it("Should revoke the user's refresh tokens", async () => {
    await executeTask(userRepository.save(user));

    await logoutCommandHandler.execute(new LogoutCommand(user.id));

    const stored = await executeTask(userRepository.findById(user.id));
    expect(stored).toEqual(
      O.some(expect.objectContaining({ tokenVersion: user.tokenVersion + 1 })),
    );
  });

  it("Should succeed for a user that no longer exists", async () => {
    const resultPromise = logoutCommandHandler.execute(
      new LogoutCommand(createTestId(TableNameEnum.User, 9)),
    );

    await expect(resultPromise).resolves.toBeUndefined();
  });

  it("Should reject an invalid user id", async () => {
    const resultPromise = logoutCommandHandler.execute(
      new LogoutCommand("not-a-uuid"),
    );

    await expect(resultPromise).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
  });
});
