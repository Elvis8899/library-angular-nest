import {
  RefreshTokenCommand,
  RefreshTokenCommandHandler,
} from "@auth/commands/refreshToken/refreshToken.command";
import { InvalidRefreshTokenException } from "@auth/domain/auth.errors";
import { generateTokens } from "@auth/util/signTokenParams";
import { UnprocessableEntityException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import { FakeLoggerService } from "@shared/logger/adapters/fake/FakeLogger.service";
import { executeTask } from "@shared/utils/application/executeTask";
import { UserBuilder } from "@test/data-builders/userBuilder";
import { FakeUserRepository } from "@user/database/fakeUser.repository";
import { UserRepository } from "@user/database/user.repository.port";
import { PinoLogger } from "nestjs-pino";

describe("[Unit] Refresh token", () => {
  let refreshTokenCommandHandler: RefreshTokenCommandHandler;
  let userRepository: UserRepository;
  let jwtService: JwtService;
  const user = new UserBuilder().build();

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        JwtService,
        RefreshTokenCommandHandler,
        { provide: UserRepository, useClass: FakeUserRepository },
        { provide: PinoLogger, useClass: FakeLoggerService },
      ],
    }).compile();

    userRepository = moduleRef.get<UserRepository>(UserRepository);
    jwtService = moduleRef.get<JwtService>(JwtService);
    refreshTokenCommandHandler = moduleRef.get<RefreshTokenCommandHandler>(
      RefreshTokenCommandHandler,
    );
  });

  it("Should return new tokens for a valid refresh token", async () => {
    //Given an existing user with a valid refresh token
    await executeTask(userRepository.save(user));
    const { refreshToken } = await generateTokens(jwtService)(user);

    //When we refresh
    const result = await refreshTokenCommandHandler.execute(
      new RefreshTokenCommand({ refreshToken }),
    );

    //Then it should return new tokens for that user
    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
    expect(result.user.id).toBe(user.id);
  });

  it("Should not accept an access token as refresh token", async () => {
    await executeTask(userRepository.save(user));
    const { accessToken } = await generateTokens(jwtService)(user);

    const resultPromise = refreshTokenCommandHandler.execute(
      new RefreshTokenCommand({ refreshToken: accessToken }),
    );

    await expect(resultPromise).rejects.toBeInstanceOf(
      InvalidRefreshTokenException,
    );
  });

  it("Should not accept a malformed refresh token", async () => {
    const resultPromise = refreshTokenCommandHandler.execute(
      new RefreshTokenCommand({ refreshToken: "not-a-jwt" }),
    );

    await expect(resultPromise).rejects.toBeInstanceOf(
      InvalidRefreshTokenException,
    );
  });

  it("Should not accept an empty refresh token", async () => {
    const resultPromise = refreshTokenCommandHandler.execute(
      new RefreshTokenCommand({ refreshToken: "" }),
    );

    await expect(resultPromise).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
  });

  it("Should not refresh if the user no longer exists", async () => {
    //Given a valid refresh token for a user that is not stored
    const { refreshToken } = await generateTokens(jwtService)(user);

    const resultPromise = refreshTokenCommandHandler.execute(
      new RefreshTokenCommand({ refreshToken }),
    );

    await expect(resultPromise).rejects.toBeInstanceOf(
      InvalidRefreshTokenException,
    );
  });
});
