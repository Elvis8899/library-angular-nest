import { jwtModuleOptions } from "@modules/auth/auth.config";
import { FakeTokenRevocationRepository } from "@modules/auth/database/fakeTokenRevocation.repository";
import { revokeAccessTokens } from "@modules/auth/domain/tokenRevocation.entity";
import { UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { SocketAuthService } from "@shared/socket/socketAuth.service";

describe("[Unit] SocketAuthService", () => {
  const jwtService = new JwtService(jwtModuleOptions());
  const revocations = new FakeTokenRevocationRepository();
  const socketAuth = new SocketAuthService(jwtService, revocations);
  const claims = {
    sub: "user-id",
    email: "a@a.com",
    role: "admin",
  };

  it("Should answer the claims of a valid access token", async () => {
    const token = await jwtService.signAsync(claims);

    await expect(socketAuth.authenticate({ token })).resolves.toMatchObject(
      claims,
    );
  });

  it("Should reject a revoked token", async () => {
    const token = await jwtService.signAsync({ ...claims, ver: 0 });
    const at = new Date();
    revocations.revoke(revokeAccessTokens(claims.sub, 1, at), at);

    await expect(socketAuth.authenticate({ token })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    revocations.removeUser(claims.sub);
  });

  it("Should reject a token signed with another secret", async () => {
    const token = await new JwtService({
      ...jwtModuleOptions(),
      secret: "another-secret-at-least-32-characters",
    }).signAsync(claims);

    await expect(socketAuth.authenticate({ token })).rejects.toThrow();
  });

  it.each([
    ["no auth", undefined],
    ["no token", {}],
    ["an empty token", { token: "" }],
    ["a token that isn't a string", { token: 1 }],
  ])("Should reject a handshake with %s", async (_, auth) => {
    await expect(socketAuth.authenticate(auth)).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });
});
