import { authConfig, jwtModuleOptions } from "@auth/auth.config";
import { AuthGuard } from "@auth/guards/auth.guard";
import { generateTokens } from "@auth/util/signTokenParams";
import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserBuilder } from "@test/dataBuilders/userBuilder";
import { unsafeCoerce } from "fp-ts/lib/function";

// Uses the real JwtService configured like JwtModule, unlike
// auth.guard.unit-spec.ts which mocks token verification
describe("[Unit] JWT verification", () => {
  const jwtService = new JwtService(jwtModuleOptions());
  const guard = new AuthGuard(jwtService);
  const user = new UserBuilder().build();

  const contextWithToken = (token: string) =>
    unsafeCoerce<unknown, ExecutionContext>({
      switchToHttp: () => ({
        getRequest: () => ({ headers: { authorization: `Bearer ${token}` } }),
      }),
    });

  const signAccessToken = (options: { audience: string; issuer: string }) =>
    jwtService.signAsync(
      { sub: user.id, email: user.email, role: user.role },
      { secret: authConfig.secret, ...options },
    );

  it("Should accept an access token issued at login", async () => {
    const { accessToken } = await generateTokens(jwtService)(user);

    await expect(
      guard.canActivate(contextWithToken(accessToken)),
    ).resolves.toBe(true);
  });

  it("Should reject a token with the wrong audience", async () => {
    const token = await signAccessToken({
      audience: "another-app",
      issuer: authConfig.issuer,
    });

    await expect(
      guard.canActivate(contextWithToken(token)),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("Should reject a token with the wrong issuer", async () => {
    const token = await signAccessToken({
      audience: authConfig.audience,
      issuer: "another-issuer",
    });

    await expect(
      guard.canActivate(contextWithToken(token)),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("Should reject a refresh token used as access token", async () => {
    const { refreshToken } = await generateTokens(jwtService)(user);

    await expect(
      guard.canActivate(contextWithToken(refreshToken)),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
