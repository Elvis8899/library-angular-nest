import { inject, Injectable } from "@angular/core";
import { Credentials } from "@app/models/credentials.entity";
import { CredentialsService } from "@app/services/credentials.service";
import { UserService } from "@app/services/user.service";
import { map, Observable, of } from "rxjs";

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
   * Logs out the user and clear credentials.
   * @return True if the user was logged out successfully.
   */
  logout(): Observable<boolean> {
    this._credentialsService.clearCredentials();
    return of(true);
  }
}
