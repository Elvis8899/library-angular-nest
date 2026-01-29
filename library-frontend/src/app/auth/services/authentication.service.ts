import { inject, Injectable } from "@angular/core";
import { UserService } from "@auth";
import { Credentials } from "@core/entities";
import { Observable, of } from "rxjs";

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

  /**
   * Authenticates the user.
   * @param context The login parameters.
   * @return The user credentials.
   */
  login(context: LoginContext): Observable<Credentials> {
    return this._userService.login(context);
  }

  /**
   * Logs out the user and clear credentials.
   * @return True if the user was logged out successfully.
   */
  logout(): Observable<boolean> {
    return of(true);
  }
}
