import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
} from "@angular/router";
import { CredentialsService } from "@app/services/credentials.service";
import { authenticationGuard } from "@app/shared/guard/authentication.guard";
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
    expect(router.navigate).toBeCalled();
    expect(res).toBe(false);
  });
});
