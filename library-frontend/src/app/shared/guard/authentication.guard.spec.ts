import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
} from "@angular/router";
import { ROLE } from "@app/models/credentials.entity";
import { CredentialsService } from "@app/services/credentials.service";
import {
  alreadyLoggedCheckGuard,
  authenticationGuard,
} from "@app/shared/guard/authentication.guard";
import {
  createInjectionContextFactory,
  SpectatorInjectionContext,
} from "@ngneat/spectator/vitest";

describe("AuthenticationGuard", () => {
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

  describe("autenticationGuard", () => {
    it("should true if authenticated", () => {
      const route = spectator.inject(ActivatedRouteSnapshot);
      const state = spectator.inject(RouterStateSnapshot);
      const credentialsService = spectator.inject(CredentialsService);
      credentialsService.isAuthenticated.mockReturnValueOnce(true);
      const res = spectator.runInInjectionContext(() =>
        authenticationGuard(route, state)
      );
      expect(res).toBe(true);
    });

    it("should false if not authenticated", () => {
      const route = spectator.inject(ActivatedRouteSnapshot);
      const state = spectator.inject(RouterStateSnapshot);
      const credentialsService = spectator.inject(CredentialsService);
      const router = spectator.inject(Router);
      credentialsService.isAuthenticated.mockReturnValueOnce(false);
      //
      const res = spectator.runInInjectionContext(() =>
        authenticationGuard(route, state)
      );
      //
      expect(router.navigate).toBeCalledWith(["/login"], {
        queryParams: {
          redirect: undefined,
        },
        replaceUrl: true,
      });
      expect(res).toBe(false);
    });
  });

  describe("alreadyLoggedCheckGuard", () => {
    it("should false if authenticated", () => {
      const route = spectator.inject(ActivatedRouteSnapshot);
      const state = spectator.inject(RouterStateSnapshot);
      const credentialsService = spectator.inject(CredentialsService);
      credentialsService.isAuthenticated.mockReturnValueOnce(true);
      credentialsService.getRole.mockReturnValueOnce(ROLE.CLIENT);
      const res = spectator.runInInjectionContext(() =>
        alreadyLoggedCheckGuard(route, state)
      );
      const router = spectator.inject(Router);
      expect(router.navigateByUrl).toBeCalledWith("/books");
      expect(res).toBe(false);
    });

    it("should true if not authenticated", () => {
      const route = spectator.inject(ActivatedRouteSnapshot);
      const state = spectator.inject(RouterStateSnapshot);
      const credentialsService = spectator.inject(CredentialsService);
      credentialsService.isAuthenticated.mockReturnValueOnce(false);
      const res = spectator.runInInjectionContext(() =>
        alreadyLoggedCheckGuard(route, state)
      );
      expect(res).toBe(true);
    });
  });
});
