import {
  LoginCommand,
  LoginCommandHandler,
} from "@modules/auth/commands/login/login.command";
import { FakeRefreshSessionRepository } from "@modules/auth/database/fakeRefreshSession.repository";
import {
  AccountDeactivatedException,
  WrongAuthException,
} from "@modules/auth/domain/auth.errors";
import { UserRepository } from "@modules/user/database/user.repository.port";
import { BcryptPasswordHasher } from "@modules/user/utils/bcryptPasswordHasher";
import { JwtService } from "@nestjs/jwt";
import { executeTask } from "@shared/utils/application/executeTask";
import { O } from "@shared/utils/application/monads";
import { UserBuilder } from "@test/dataBuilders/userBuilder";
import { createTestId, TableNameEnum } from "@test/util/defaultIds";
import { useHandlerModule } from "@test/util/handlerModule";
import * as bcrypt from "bcrypt";

const passwordHasher = new BcryptPasswordHasher();

//Adapters

describe("[Unit] Create User", () => {
  const ctx = useHandlerModule(
    { providers: [JwtService, LoginCommandHandler] },
    (get) => ({
      userRepository: get(UserRepository),
      refreshSessionRepository: get(FakeRefreshSessionRepository),
      loginCommandHandler: get(LoginCommandHandler),
    }),
  );

  it("Should login user if user is valid", async () => {
    //Given a potentially valid user
    const password = "123456";
    const hash = await passwordHasher.hash(password);
    const user = new UserBuilder().withPassword(hash);
    await executeTask(ctx.userRepository.save(user.build()));

    //When we create a user
    const result = await ctx.loginCommandHandler.execute(
      new LoginCommand(user.withPassword(password).buildCreateDTO()),
    );

    //Then it should have logged the user, recording the access
    expect(result.accessToken).toBeTruthy();
    expect(
      await executeTask(ctx.userRepository.findById(user.build().id)),
    ).toMatchObject(O.some({ lastAccessAt: new Date("2026-10-21T12:00:00Z") }));
  });

  it("Should start a refresh session and remove the user's expired ones", async () => {
    //Given a user with an expired session, and another user's expired session
    const password = "123456";
    const user = new UserBuilder().withPassword(
      await passwordHasher.hash(password),
    );
    await executeTask(ctx.userRepository.save(user.build()));
    const yesterday = new Date(Date.now() - 86400 * 1000);
    const otherUserId = createTestId(TableNameEnum.User, 99);
    const expired = (n: number, userId: string) => ({
      id: createTestId(TableNameEnum.RefreshSession, n),
      userId,
      currentJti: createTestId(TableNameEnum.None, n),
      expiresAt: yesterday,
    });
    await executeTask(
      ctx.refreshSessionRepository.create(expired(1, user.build().id)),
    );
    await executeTask(
      ctx.refreshSessionRepository.create(expired(2, otherUserId)),
    );

    //When the user logs in
    const result = await ctx.loginCommandHandler.execute(
      new LoginCommand(user.withPassword(password).buildCreateDTO()),
    );

    //Then only its new session and the other user's session remain
    const sessions = await executeTask(ctx.refreshSessionRepository.findAll());
    expect(sessions.map((s) => s.userId).sort()).toEqual(
      [result.user.id, otherUserId].sort(),
    );
    expect(
      sessions.find((s) => s.userId === result.user.id)?.expiresAt.getTime(),
    ).toBeGreaterThan(Date.now());
  });

  it("Should not login a user if email is invalid", async () => {
    const password = "123456";
    const hash = await passwordHasher.hash(password);
    //Given a potentially invalid name
    const user = new UserBuilder().withPassword(hash).buildCreateDTO();
    //When we create a user
    const resultPromise = ctx.loginCommandHandler.execute(
      new LoginCommand(user),
    );

    //Then it should have thrown an error and not have created a user
    await expect(resultPromise).rejects.toBeInstanceOf(WrongAuthException);
  });

  it("Should not login a user if password is invalid", async () => {
    //Given an existing user
    const password = "123456";
    const hash = await passwordHasher.hash(password);
    const user = new UserBuilder().withPassword(hash);
    await executeTask(ctx.userRepository.save(user.build()));

    const resultPromise = ctx.loginCommandHandler.execute(
      new LoginCommand(user.buildCreateDTO()),
    );

    await expect(resultPromise).rejects.toBeInstanceOf(WrongAuthException);
  });

  it("Should replace a weaker hash on login, keeping the password", async () => {
    //Given an account whose hash has fewer rounds than new ones
    const user = new UserBuilder().withPassword(
      await bcrypt.hash("senha123", 4),
    );
    await executeTask(ctx.userRepository.save(user.build()));

    //When it logs in
    const result = await ctx.loginCommandHandler.execute(
      new LoginCommand(user.withPassword("senha123").buildCreateDTO()),
    );

    //Then its password is hashed as new ones are
    const stored = O.toUndefined(
      await executeTask(ctx.userRepository.findById(result.user.id)),
    );
    expect(passwordHasher.needsRehash(stored?.password ?? "")).toBe(false);
    expect(
      await passwordHasher.matches("senha123", stored?.password ?? ""),
    ).toBe(true);
  });

  it("Should not login a deactivated account, nor record the access", async () => {
    //Given a deactivated user
    const password = "123456";
    const user = new UserBuilder().withPassword(
      await passwordHasher.hash(password),
    );
    await executeTask(
      ctx.userRepository.save({ ...user.build(), active: false }),
    );

    //When it logs in with the right password
    const resultPromise = ctx.loginCommandHandler.execute(
      new LoginCommand(user.withPassword(password).buildCreateDTO()),
    );

    //Then it is told the account is deactivated
    await expect(resultPromise).rejects.toBeInstanceOf(
      AccountDeactivatedException,
    );
    expect(
      await executeTask(ctx.userRepository.findById(user.build().id)),
    ).toMatchObject(O.some({ lastAccessAt: null }));
  });
});
