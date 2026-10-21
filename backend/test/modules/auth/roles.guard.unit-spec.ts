import { RequestJWTPayload } from "@modules/auth/domain/login.entity";
import { RolesGuard } from "@modules/auth/guards/roles.guard";
import { UserRoleEnum } from "@modules/user/domain/user.entity";
import { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { FPF } from "@shared/utils/application/monads";

describe("RolesGuard", () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it("should be defined", () => {
    expect(guard).toBeDefined();
  });

  it("should allow access when no roles are required", () => {
    const mockContext = createMockExecutionContext({});
    vi.spyOn(reflector, "getAllAndOverride").mockReturnValue(null);

    const result = guard.canActivate(mockContext);

    expect(result).toBe(true);
  });

  it("should allow access when user has required role", () => {
    const mockContext = createMockExecutionContext({
      user: { role: UserRoleEnum.Admin },
    });
    vi.spyOn(reflector, "getAllAndOverride").mockReturnValue([
      UserRoleEnum.Admin,
    ]);

    const result = guard.canActivate(mockContext);

    expect(result).toBe(true);
  });

  it("should deny access when user does not have required role", () => {
    const mockContext = createMockExecutionContext({
      user: { role: UserRoleEnum.Client },
    });
    vi.spyOn(reflector, "getAllAndOverride").mockReturnValue([
      UserRoleEnum.Admin,
    ]);

    const result = guard.canActivate(mockContext);

    expect(result).toBe(false);
  });

  it("should deny access when user roles is undefined", () => {
    const mockContext = createMockExecutionContext({
      user: {},
    });
    vi.spyOn(reflector, "getAllAndOverride").mockReturnValue([
      UserRoleEnum.Admin,
    ]);

    const result = guard.canActivate(mockContext);

    expect(result).toBe(false);
  });

  it("should deny access when user is undefined", () => {
    const mockContext = createMockExecutionContext({
      user: undefined,
    });
    vi.spyOn(reflector, "getAllAndOverride").mockReturnValue([
      UserRoleEnum.Admin,
    ]);

    const result = guard.canActivate(mockContext);

    expect(result).toBe(false);
  });

  function createMockExecutionContext(request: {
    user?: Partial<RequestJWTPayload>;
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
});
