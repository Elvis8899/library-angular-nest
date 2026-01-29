import { inject, Injectable } from "@angular/core";
import { CredentialsService, PERMISSIONS, ROLE } from "@app/auth";
import { appPermissionsSetting } from "@core/constants";
import { Credentials } from "@core/entities";

@Injectable({
  providedIn: "root",
})
export class PermissionService {
  private readonly _credentials: Credentials | null;
  private readonly _credentialsService = inject(CredentialsService);
  constructor() {
    this._credentials = this._credentialsService.credentials;
    if (!this._credentials) {
      this._credentials = this._credentialsService.credentials;
    }
  }

  get userRole(): ROLE {
    return this._credentials?.user?.role || ROLE.GUEST;
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
  hasRole(requiredRoles: ROLE[]): boolean {
    const credentials = this._credentialsService.credentials;
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
  hasPermission(permission: PERMISSIONS): boolean {
    const credentials = this._credentialsService.credentials;
    if (!credentials) {
      return false;
    }

    const {
      user: { role },
    } = credentials;

    const rolePermissions = appPermissionsSetting[role];
    if (rolePermissions && this._checkPermission(rolePermissions, permission)) {
      return true;
    }

    return false;
  }

  /* The `private _checkPermission` method is a helper function within the `PermissionService` class.
  Its purpose is to check if a user has a specific permission based on their roles and the
  application settings defined in the `appSetting` object. */
  private _checkPermission(
    rolePermissions: Record<PERMISSIONS, boolean>,
    permission: PERMISSIONS
  ): boolean {
    return rolePermissions[permission] === true;
  }
}
