import { inject, Injectable } from "@angular/core";
import { Credentials } from "@app/models/credentials.entity";
import { CredentialsService } from "@app/services/credentials.service";
import { UserService } from "@app/services/user.http.service";
import {
  catchError,
  defer,
  finalize,
  firstValueFrom,
  map,
  Observable,
  of,
  shareReplay,
  throwError,
} from "rxjs";

const refreshLockName = "auth-refresh";

// Runs the task while holding a lock shared by every tab of the app (Web
// Locks API), or directly where the API is unavailable
const withRefreshLock = <T>(task: () => Promise<T>): Promise<T> =>
  navigator.locks ? navigator.locks.request(refreshLockName, task) : task();

export interface LoginContext {
  email: string;
  password: string;
  remember?: boolean;
  isMobile?: boolean;
}

/**
 * Provides a base for authentication workflow.
 * The login/logout methods should be replaced with proper implementation.
 */
@Injectable({
  providedIn: "root",
})
export class AuthenticationService {
  private readonly _userService = inject(UserService);
  private readonly _credentialsService = inject(CredentialsService);
  private _refreshInFlight$: Observable<Credentials> | null = null;

  /**
   * Authenticates the user.
   * @param context The login parameters.
   * @return The user credentials.
   */
  login(context: LoginContext): Observable<Credentials> {
    return this._userService.login(context).pipe(
      map((credentials) => {
        this._credentialsService.setCredentials(credentials);
        return credentials;
      })
    );
  }

  /**
   * Gets new tokens using the stored refresh token.
   * Refresh tokens are single-use, so concurrent calls share a single request,
   * and tabs take turns: a tab that waited reuses the tokens another tab got.
   * @return The new user credentials.
   */
  refresh(): Observable<Credentials> {
    const refreshToken = this._credentialsService.credentials?.refreshToken;
    if (!refreshToken) {
      return throwError(() => new Error("No refresh token"));
    }
    this._refreshInFlight$ ??= defer(() =>
      withRefreshLock(() => this.refreshOnce(refreshToken))
    ).pipe(
      finalize(() => (this._refreshInFlight$ = null)),
      shareReplay(1)
    );
    return this._refreshInFlight$;
  }

  private async refreshOnce(refreshToken: string): Promise<Credentials> {
    // Another tab may have refreshed while this one waited for the lock
    this._credentialsService.refresh();
    const stored = this._credentialsService.credentials;
    if (stored?.refreshToken !== refreshToken) {
      if (!stored) {
        throw new Error("Logged out");
      }
      return stored;
    }
    const credentials = await firstValueFrom(
      this._userService.refresh(refreshToken)
    );
    this._credentialsService.setCredentials(credentials);
    return credentials;
  }

  /**
   * Logs out the user: revokes its refresh tokens on the server and clears
   * the stored credentials. The local session ends even if the server call
   * fails.
   * @return True if the user was logged out successfully.
   */
  logout(): Observable<boolean> {
    const revoke$ = this._credentialsService.isAuthenticated()
      ? this._userService.logout().pipe(catchError(() => of(undefined)))
      : of(undefined);
    return revoke$.pipe(
      map(() => {
        this._credentialsService.clearCredentials();
        return true;
      })
    );
  }
}
