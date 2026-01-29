import { inject, Injectable } from "@angular/core";
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
} from "@angular/router";

import { CredentialsService } from "@app/auth";
import { Logger } from "@app/core/services";
import { UntilDestroy } from "@ngneat/until-destroy";

const log = new Logger("AuthenticationGuard");

/* The `AlreadyLoggedCheckGuard` class is a guard in TypeScript that checks if a user is already
authenticated and redirects them to the initial page if they are. */
@UntilDestroy()
@Injectable({
  providedIn: "root",
})
export class AlreadyLoggedCheckGuard {
  private readonly _credentialsService = inject(CredentialsService);
  private readonly _router = inject(Router);

  async canActivate(): Promise<boolean> {
    const isAuthenticated = this._credentialsService.isAuthenticated();
    const isAdmin = this._credentialsService.isAdmin();
    if (isAuthenticated) {
      const page = isAdmin ? "/users/list" : "/books";
      this._router.navigateByUrl(page);
      return false;
    } else {
      return true;
    }
  }
}

/* The AuthenticationGuard class in TypeScript is used to check if a user is authenticated and redirect
to the login page if not. */
@Injectable({
  providedIn: "root",
})
export class AuthenticationGuard {
  private readonly _credentialsService = inject(CredentialsService);
  private readonly _router = inject(Router);
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    if (this._credentialsService.isAuthenticated()) {
      return true;
    }

    log.debug("Not authenticated, redirecting and adding redirect url...");
    this._router.navigate(["/login"], {
      queryParams: { redirect: state.url },
      replaceUrl: true,
    });
    return false;
  }
}
