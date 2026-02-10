import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
} from "@angular/router";
import { PERMISSIONS, ROLE } from "@app/models/credentials.entity";
import { CredentialsService } from "@app/services/credentials.service";
import { permissionGuard } from "@app/shared/guard/permission.guard";
import {
  createInjectionContextFactory,
  SpectatorInjectionContext,
} from "@ngneat/spectator/vitest";

describe("PermissionGuard", () => {
  let spectator: SpectatorInjectionContext;
  const createContext = createInjectionContextFactory({
    mocks: [
      ActivatedRouteSnapshot,
      RouterStateSnapshot,
      Router,
      CredentialsService,
    ],
  });

  beforeEach(() => {
    spectator = createContext();
  });

  it("should return true no role or permission needed", () => {
    const route = spectator.inject(ActivatedRouteSnapshot);
    const state = spectator.inject(RouterStateSnapshot);
    const credentialsService = spectator.inject(CredentialsService);
    credentialsService.hasRole.mockReturnValueOnce(true);
    credentialsService.hasPermission.mockReturnValueOnce(true);
    const res = spectator.runInInjectionContext(() =>
      permissionGuard(route, state)
    );
    //
    expect(res).toBe(true);
  });

  it("should return true if user has roles and permissions", () => {
    const route = spectator.inject(ActivatedRouteSnapshot);
    const state = spectator.inject(RouterStateSnapshot);
    route.data = {
      roles: [ROLE.ADMIN],
      permissions: [PERMISSIONS.CREATE_BOOK],
    };
    const credentialsService = spectator.inject(CredentialsService);
    credentialsService.hasRole.mockReturnValueOnce(true);
    credentialsService.hasPermission.mockReturnValueOnce(true);
    const res = spectator.runInInjectionContext(() =>
      permissionGuard(route, state)
    );
    expect(res).toBe(true);
  });

  it("should return false if user does not have role", () => {
    const route = spectator.inject(ActivatedRouteSnapshot);
    const state = spectator.inject(RouterStateSnapshot);
    route.data = {
      roles: [ROLE.ADMIN],
      permissions: [PERMISSIONS.CREATE_BOOK],
    };
    const credentialsService = spectator.inject(CredentialsService);
    credentialsService.hasRole.mockReturnValueOnce(false);
    const res = spectator.runInInjectionContext(() =>
      permissionGuard(route, state)
    );
    expect(res).toBe(false);
  });

  it("should return false if user does not have permissions", () => {
    const route = spectator.inject(ActivatedRouteSnapshot);
    const state = spectator.inject(RouterStateSnapshot);
    route.data = {
      roles: [ROLE.ADMIN],
      permissions: [PERMISSIONS.CREATE_BOOK],
    };
    const credentialsService = spectator.inject(CredentialsService);
    credentialsService.hasRole.mockReturnValueOnce(true);
    credentialsService.hasPermission.mockReturnValueOnce(false);
    const res = spectator.runInInjectionContext(() =>
      permissionGuard(route, state)
    );
    expect(res).toBe(false);
  });
});
