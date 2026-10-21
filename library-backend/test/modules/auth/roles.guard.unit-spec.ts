import { RequestJWTPayload } from "@auth/domain/login.entity";
import { RolesGuard } from "@auth/guards/roles.guard";
import { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { FPF } from "@shared/utils/application/monads";
import { UserRoleEnum } from "@user/domain/user.entity";

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
    jest.spyOn(reflector, "getAllAndOverride").mockReturnValue(null);

    const result = guard.canActivate(mockContext);

    expect(result).toBe(true);
  });

  it("should allow access when user has required role", () => {
    const mockContext = createMockExecutionContext({
      user: { role: UserRoleEnum.Admin },
    });
    jest
      .spyOn(reflector, "getAllAndOverride")
      .mockReturnValue([UserRoleEnum.Admin]);

    const result = guard.canActivate(mockContext);

    expect(result).toBe(true);
  });

  it("should deny access when user does not have required role", () => {
    const mockContext = createMockExecutionContext({
      user: { role: UserRoleEnum.Client },
    });
    jest
      .spyOn(reflector, "getAllAndOverride")
      .mockReturnValue([UserRoleEnum.Admin]);

    const result = guard.canActivate(mockContext);

    expect(result).toBe(false);
  });

  it("should deny access when user roles is undefined", () => {
    const mockContext = createMockExecutionContext({
      user: {},
    });
    jest
      .spyOn(reflector, "getAllAndOverride")
      .mockReturnValue([UserRoleEnum.Admin]);

    const result = guard.canActivate(mockContext);

    expect(result).toBe(false);
  });

  it("should deny access when user is undefined", () => {
    const mockContext = createMockExecutionContext({
      user: undefined,
    });
    jest
      .spyOn(reflector, "getAllAndOverride")
      .mockReturnValue([UserRoleEnum.Admin]);

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
        getNext: FPF.unsafeCoerce(() => jest.fn()),
      }),
      getHandler: FPF.unsafeCoerce(() => jest.fn()),
      getClass: FPF.unsafeCoerce(() => jest.fn()),
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
