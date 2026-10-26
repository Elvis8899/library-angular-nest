import { FakeTokenRevocationRepository } from "@modules/auth/database/fakeTokenRevocation.repository";
import { TokenRevocationRepository } from "@modules/auth/database/tokenRevocation.repository.port";
import { revokeAccessTokens } from "@modules/auth/domain/tokenRevocation.entity";
import { AuthGuard } from "@modules/auth/guards/auth.guard";
import { RequestJWTPayload } from "@modules/auth/guards/authenticatedRequest";
import { UserRoleEnum } from "@modules/user/domain/user.entity";
import { ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing";
import { FPF, TE } from "@shared/utils/application/monads";

describe("AuthGuard", () => {
  let guard: AuthGuard;
  let revocations: FakeTokenRevocationRepository;
  let fnToUse: () => unknown = () => ({ sub: "user-1", ver: 0 });
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          // Provide a mock for the JwtService
          provide: JwtService,
          useValue: {
            // Mock the 'verify' method (or 'sign', 'decode', etc.)
            verifyAsync: vi.fn(() => Promise.resolve().then(fnToUse)),
          },
        },
        FakeTokenRevocationRepository,
        {
          provide: TokenRevocationRepository,
          useExisting: FakeTokenRevocationRepository,
        },
      ],
    }).compile();

    guard = module.get(AuthGuard);
    revocations = module.get(FakeTokenRevocationRepository);
  });

  it("should be defined", () => {
    expect(guard).toBeDefined();
  });

  describe("canActivate", () => {
    // Mock the ExecutionContext (request object is key)
    const defaultInput = {
      user: { email: "admin@admin.com", role: UserRoleEnum.Admin },
      headers: { authorization: "Bearer token" },
    };
    it("should return true if the token is valid", async () => {
      fnToUse = () => ({ sub: "user-1", ver: 0 });
      const result = await guard.canActivate(
        createMockExecutionContext(defaultInput),
      );
      expect(result).toBe(true);
    });

    it("should return error if there is no token", async () => {
      const resultPromise = guard.canActivate(
        createMockExecutionContext({
          headers: {},
        }),
      );
      await expect(resultPromise).rejects.toThrow(UnauthorizedException);
    });

    it("should return error if the token is invalid", async () => {
      fnToUse = () => {
        throw new Error();
      };
      const resultPromise = guard.canActivate(
        createMockExecutionContext(defaultInput),
      );
      await expect(resultPromise).rejects.toThrow(UnauthorizedException);
    });

    it.each([
      ["below the revocation", 0, false],
      ["without a version", undefined, false],
      ["issued since", 1, true],
    ])(
      "should check a token %s against the user's revocation",
      async (_, ver, accepted) => {
        const at = new Date();
        revocations.revoke(revokeAccessTokens("user-1", 1, at), at);
        fnToUse = () => ({ sub: "user-1", ver });

        const result = guard.canActivate(
          createMockExecutionContext(defaultInput),
        );

        await (accepted
          ? expect(result).resolves.toBe(true)
          : expect(result).rejects.toThrow(UnauthorizedException));
      },
    );

    it("should fail with the read's error, not as unauthorized", async () => {
      const failure = new Error("database down");
      vi.spyOn(revocations, "findByUserId").mockReturnValue(TE.left(failure));

      await expect(
        guard.canActivate(createMockExecutionContext(defaultInput)),
      ).rejects.toBe(failure);
    });
  });
});

function createMockExecutionContext(request: {
  user?: Partial<RequestJWTPayload>;
  headers?: Record<string, string>;
}): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: FPF.unsafeCoerce(() => request),
      getResponse: FPF.unsafeCoerce(() => ({})),
      getNext: FPF.unsafeCoerce(() => vi.fn()),
    }),
    getHandler: FPF.unsafeCoerce(() => vi.fn()),
    getClass: FPF.unsafeCoerce(() => vi.fn()),
    getArgs: FPF.unsafeCoerce(() => []),
    getArgByIndex: FPF.unsafeCoerce(() => ({})),
    switchToRpc: () => ({
      getContext: FPF.unsafeCoerce(() => ({})),
      getData: FPF.unsafeCoerce(() => ({})),
    }),
    switchToWs: () => ({
      getClient: FPF.unsafeCoerce(() => ({})),
      getData: FPF.unsafeCoerce(() => ({})),
      getPattern: () => "test-pattern",
    }),
    getType: FPF.unsafeCoerce(() => "http"),
  };
}
