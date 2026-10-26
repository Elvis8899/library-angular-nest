import {
  RefreshTokenCommand,
  RefreshTokenCommandHandler,
} from "@modules/auth/commands/refreshToken/refreshToken.command";
import { FakeRefreshSessionRepository } from "@modules/auth/database/fakeRefreshSession.repository";
import { InvalidRefreshTokenException } from "@modules/auth/domain/auth.errors";
import {
  generateTokens,
  getSignTokenParams,
  refreshSessionExpiry,
  refreshVerifyOptions,
} from "@modules/auth/utils/tokens";
import { UserRepository } from "@modules/user/database/user.repository.port";
import { UnprocessableEntityException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { executeTask } from "@shared/utils/application/executeTask";
import { O } from "@shared/utils/application/monads";
import { UserBuilder } from "@test/dataBuilders/userBuilder";
import { createTestId, TableNameEnum } from "@test/util/defaultIds";
import { useHandlerModule } from "@test/util/handlerModule";

describe("[Unit] Refresh token", () => {
  const user = new UserBuilder().build();
  const session = {
    sessionId: createTestId(TableNameEnum.RefreshSession, 1),
    jti: createTestId(TableNameEnum.None, 1),
  };

  const refresh = (refreshToken: string) =>
    ctx.refreshTokenCommandHandler.execute(
      new RefreshTokenCommand({ refreshToken }),
    );

  // A logged in user: stored, with a refresh session and its token
  const login = async () => {
    await executeTask(ctx.userRepository.save(user));
    await executeTask(
      ctx.refreshSessionRepository.create({
        id: session.sessionId,
        userId: user.id,
        currentJti: session.jti,
        expiresAt: refreshSessionExpiry(),
      }),
    );
    return generateTokens(ctx.jwtService)(user, session);
  };

  const ctx = useHandlerModule(
    { providers: [JwtService, RefreshTokenCommandHandler] },
    (get) => ({
      userRepository: get(UserRepository),
      refreshSessionRepository: get(FakeRefreshSessionRepository),
      jwtService: get(JwtService),
      refreshTokenCommandHandler: get(RefreshTokenCommandHandler),
    }),
  );

  it("Should return new tokens for a valid refresh token", async () => {
    //Given a logged in user
    const { refreshToken } = await login();

    //When we refresh
    const result = await refresh(refreshToken);

    //Then it should return new tokens for that user, in the same session,
    //recording the access
    expect(result.accessToken).toBeTruthy();
    expect(await executeTask(ctx.userRepository.findById(user.id))).toEqual(
      O.some({ ...user, lastAccessAt: new Date("2026-10-21T12:00:00Z") }),
    );
    expect(result.refreshToken).not.toBe(refreshToken);
    expect(result.user.id).toBe(user.id);
    const claims = await ctx.jwtService.verifyAsync<{ sid: string }>(
      result.refreshToken,
      refreshVerifyOptions,
    );
    expect(claims.sid).toBe(session.sessionId);
  });

  it("Should accept the rotated refresh token", async () => {
    const { refreshToken } = await login();
    const first = await refresh(refreshToken);

    const second = await refresh(first.refreshToken);

    expect(second.user.id).toBe(user.id);
  });

  it("Should revoke the session when a refresh token is reused", async () => {
    //Given a refresh token that was already used
    const { refreshToken } = await login();
    const rotated = await refresh(refreshToken);

    //When it is used again
    const reuse = refresh(refreshToken);

    //Then it is rejected and the session ends, so the newer token stops working too
    await ctx.userRepository.recordAccess({ id: user.id, at: new Date(0) })();
    await expect(reuse).rejects.toBeInstanceOf(InvalidRefreshTokenException);
    // A refused refresh isn't an access
    expect(await executeTask(ctx.userRepository.findById(user.id))).toEqual(
      O.some({ ...user, lastAccessAt: new Date(0) }),
    );
    expect(
      await executeTask(
        ctx.refreshSessionRepository.findById(session.sessionId),
      ),
    ).toEqual(O.none);
    await expect(refresh(rotated.refreshToken)).rejects.toBeInstanceOf(
      InvalidRefreshTokenException,
    );
  });

  it("Should not refresh without a session", async () => {
    //Given a refresh token whose session no longer exists
    await executeTask(ctx.userRepository.save(user));
    const { refreshToken } = await generateTokens(ctx.jwtService)(
      user,
      session,
    );

    await expect(refresh(refreshToken)).rejects.toBeInstanceOf(
      InvalidRefreshTokenException,
    );
  });

  it("Should not accept a refresh token issued without a session", async () => {
    //Given a token signed before refresh tokens were rotated
    await executeTask(ctx.userRepository.save(user));
    const refreshToken = await ctx.jwtService.signAsync(
      { sub: user.id, ver: user.tokenVersion },
      getSignTokenParams(user.id, {}).refreshOptions,
    );

    await expect(refresh(refreshToken)).rejects.toBeInstanceOf(
      InvalidRefreshTokenException,
    );
  });

  it("Should not accept an access token as refresh token", async () => {
    const { accessToken } = await login();

    await expect(refresh(accessToken)).rejects.toBeInstanceOf(
      InvalidRefreshTokenException,
    );
  });

  it("Should not accept a malformed refresh token", async () => {
    await expect(refresh("not-a-jwt")).rejects.toBeInstanceOf(
      InvalidRefreshTokenException,
    );
  });

  it("Should not accept an empty refresh token", async () => {
    await expect(refresh("")).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
  });

  it("Should not refresh if the user no longer exists", async () => {
    //Given a valid refresh token for a user that was deleted
    const { refreshToken } = await login();
    await executeTask(ctx.userRepository.deleteById(user.id));

    await expect(refresh(refreshToken)).rejects.toBeInstanceOf(
      InvalidRefreshTokenException,
    );
  });

  it("Should not refresh after the user's tokens were revoked", async () => {
    //Given a refresh token issued before logout
    const { refreshToken } = await login();
    await executeTask(ctx.userRepository.incrementTokenVersion(user.id));

    await expect(refresh(refreshToken)).rejects.toBeInstanceOf(
      InvalidRefreshTokenException,
    );
  });
});
