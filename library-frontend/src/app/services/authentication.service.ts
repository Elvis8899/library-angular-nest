import { inject, Injectable } from "@angular/core";
import { Credentials } from "@app/models/credentials.entity";
import { CredentialsService } from "@app/services/credentials.service";
import { UserService } from "@app/services/user.http.service";
import { finalize, map, Observable, of, shareReplay, throwError } from "rxjs";

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
   * Concurrent calls share a single request.
   * @return The new user credentials.
   */
  refresh(): Observable<Credentials> {
    const refreshToken = this._credentialsService.credentials?.refreshToken;
    if (!refreshToken) {
      return throwError(() => new Error("No refresh token"));
    }
    this._refreshInFlight$ ??= this._userService.refresh(refreshToken).pipe(
      map((credentials) => {
        this._credentialsService.setCredentials(credentials);
        return credentials;
      }),
      finalize(() => (this._refreshInFlight$ = null)),
      shareReplay(1)
    );
    return this._refreshInFlight$;
  }

  /**
   * Logs out the user and clear credentials.
   * @return True if the user was logged out successfully.
   */
  logout(): Observable<boolean> {
    this._credentialsService.clearCredentials();
    return of(true);
  }
}
