import { Injectable } from "@angular/core";
import { appPermissionsSetting } from "@app/app.permissions";
import { Credentials, PERMISSIONS, ROLE } from "@app/models/credentials.entity";

const credentialsKey = "credentials";

/**
 * Provides storage for authentication credentials.
 * The Credentials interface should be replaced with proper implementation.
 */
@Injectable({
  providedIn: "root",
})
export class CredentialsService {
  private _credentials: Credentials | null = null;
  constructor() {
    this.refresh();
  }

  refresh() {
    this._credentials =
      this.getSavedCredentials(false) || this.getSavedCredentials();
  }

  getSavedCredentials(remember = true): Credentials | null {
    const storage = remember ? localStorage : sessionStorage;
    const savedCredentials = storage.getItem(credentialsKey);
    if (!savedCredentials) {
      return null;
    }
    return JSON.parse(savedCredentials);
  }

  clearCredentials() {
    this._credentials = null;
    sessionStorage.removeItem(credentialsKey);
    localStorage.removeItem(credentialsKey);
  }

  /**
   * Gets the user credentials.
   * @return The user credentials or null if the user is not authenticated.
   */
  get credentials(): Credentials | null {
    return this._credentials;
  }

  /**
   * Checks is the user is authenticated.
   * @return True if the user is authenticated.
   */
  isAuthenticated(): boolean {
    return !!this.credentials;
  }

  isAdmin(): boolean {
    return this.credentials?.user.role?.includes("admin") || false;
  }

  userId(): string {
    return this.credentials?.user.id || "";
  }
  /**
   * Sets the user credentials.
   * The credentials may be persisted across sessions by setting the `remember` parameter to true.
   * Otherwise, the credentials are only persisted for the current session.
   * @param credentials The user credentials.
   * @param remember True to remember credentials across sessions.
   */
  setCredentials(credentials?: Credentials, remember = true) {
    if (!credentials) {
      this.clearCredentials();
      return;
    }
    this._credentials = credentials;
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem(credentialsKey, JSON.stringify(credentials));
  }

  /**
   * The function `hasRole` checks if a user has any of the required roles based on their credentials.
   * @param {ROLE[]} requiredRoles - The `requiredRoles` parameter in the `hasRole` method is an array of
   * `ROLE` values that represent the roles that a user must have in order to pass the authorization
   * check. The method checks if the user's credentials contain any of the roles specified in the
   * `requiredRoles` array.
   * @returns The `hasRole` method is returning a boolean value. It checks if the user's credentials
   * contain any of the required roles specified in the `requiredRoles` array. If at least one of the
   * required roles matches with the user's roles, it returns `true`. Otherwise, it returns `false`.
   */
  hasRole(requiredRoles?: ROLE[]): boolean {
    if (!requiredRoles?.length) {
      return true;
    }
    const credentials = this.credentials;
    if (!credentials || !credentials.user.role) {
      return false;
    }
    // Check if any of the user's roles match the required roles
    return requiredRoles.some((role) => credentials.user.role.includes(role));
  }

  /**
   * The function `hasPermission` checks if a user has the required permission based on their roles and
   * application settings.
   * @param {PERMISSIONS} permission - The `permission` parameter represents the permission that needs to
   * be checked. This permission is typically a value from an enum or a set of predefined permissions in
   * your application.
   * @returns The `hasPermission` method returns a boolean value, either `true` or `false`, based on
   * whether the user has the specified permission or not.
   */
  hasPermission(permission?: PERMISSIONS[]): boolean {
    if (!permission?.length) {
      return true;
    }
    const role = this.credentials?.user?.role;
    if (!role || !appPermissionsSetting[role]) {
      return false;
    }
    const rolePermissions = appPermissionsSetting[role];
    return permission.every((p) => rolePermissions[p] === true);
  }
}
