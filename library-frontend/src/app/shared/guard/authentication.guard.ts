import { inject } from "@angular/core";
import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
} from "@angular/router";
import { defaultRolePage } from "@app/models/credentials.entity";
import { CredentialsService } from "@app/services/credentials.service";
import { Logger } from "@app/services/logger.service";

//https://medium.com/ngconf/functional-route-guards-in-angular-8829f0e4ca5c

const log = new Logger("AuthenticationGuard");

/* The `alreadyLoggedCheckGuard` is a functional guard that checks if a user is already
authenticated and redirects them to the initial page if they are. */
export const alreadyLoggedCheckGuard: CanActivateFn = () => {
  const credentialsService = inject(CredentialsService);
  const router = inject(Router);

  const isAuthenticated = credentialsService.isAuthenticated();
  if (isAuthenticated) {
    const role = credentialsService.getRole();
    const page = defaultRolePage(role);
    router.navigateByUrl(page);
    return false;
  }
  return true;
};

/* The authenticationGuard is used to check if a user is authenticated and redirect
to the login page if not. */
export const authenticationGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const credentialsService = inject(CredentialsService);
  const router = inject(Router);
  if (credentialsService.isAuthenticated()) {
    return true;
  }

  log.debug("Not authenticated, redirecting and adding redirect url...");
  router.navigate(["/login"], {
    queryParams: { redirect: state.url },
    replaceUrl: true,
  });
  return false;
};
