import { Credentials, PERMISSIONS, ROLE } from "@app/models/credentials.entity";
import { CredentialsService } from "@app/services/credentials.service";
import {
  createServiceFactory,
  SpectatorService,
} from "@ngneat/spectator/vitest";

describe("AuthService", () => {
  const credential: Credentials = {
    accessToken: "string",
    refreshToken: "string",
    user: {
      id: "id",
      name: "name",
      email: "email",
      role: ROLE.ADMIN,
    },
  };
  //
  let spectator: SpectatorService<CredentialsService>;
  const createService = createServiceFactory({
    service: CredentialsService,
    mocks: [],
  });

  beforeEach(() => {
    spectator = createService();
    spectator.service.clearCredentials();
  });

  it("should save credentials", () => {
    // When saving the credentials
    spectator.service.setCredentials(credential);
    expect(spectator.service.credentials).toEqual(credential);
  });

  it("should save credentials", () => {
    // const dateService = spectator.inject<DateService>(DateService);
    spectator.service.setCredentials(credential);
    expect(spectator.service.credentials).toEqual(credential);
  });

  it("should clear credentials", () => {
    spectator.service.setCredentials(credential);
    spectator.service.clearCredentials();
    expect(spectator.service.credentials).toBeNull();
  });

  it("isAdmin should return false if not authenticated", () => {
    expect(spectator.service.isAdmin()).toBe(false);
  });

  it("isAdmin should return true if authenticated as admin", () => {
    spectator.service.setCredentials(credential);
    expect(spectator.service.isAdmin()).toBe(true);
  });

  it("isAdmin should return false if authenticated as client", () => {
    const credential = {
      accessToken: "string",
      refreshToken: "string",
      user: {
        id: "id",
        name: "name",
        email: "email",
        role: ROLE.CLIENT,
      },
    };
    spectator.service.setCredentials(credential);
    expect(spectator.service.isAdmin()).toBe(false);
  });

  it("isAuthenticated should return false if not authenticated", () => {
    expect(spectator.service.isAuthenticated()).toBe(false);
  });

  it("isAuthenticated should return true if authenticated", () => {
    spectator.service.setCredentials(credential);
    expect(spectator.service.isAuthenticated()).toBe(true);
  });

  it("userId should return user id", () => {
    spectator.service.setCredentials(credential);
    expect(spectator.service.userId()).toBe(credential.user.id);
  });

  it("userId should return user '' if not authenticated", () => {
    expect(spectator.service.userId()).toBe("");
  });

  it("setCredentials with null should clear credentials after authenticated", () => {
    spectator.service.setCredentials(credential);
    spectator.service.setCredentials(undefined);
    expect(spectator.service.credentials).toBeNull();
  });

  it("hasRole should return true if authenticated and user has admin role", () => {
    spectator.service.setCredentials(credential);
    expect(spectator.service.hasRole([ROLE.ADMIN])).toBe(true);
  });

  it("hasRole should return false if not authenticated", () => {
    expect(spectator.service.hasRole([ROLE.ADMIN])).toBe(false);
  });

  it("hasRole should return true if no roles are needed", () => {
    spectator.service.setCredentials(credential);
    expect(spectator.service.hasRole([])).toBe(true);
  });

  it("hasRole should return true if no user has at least 1 roleneeded", () => {
    spectator.service.setCredentials(credential);
    expect(spectator.service.hasRole()).toBe(true);
  });

  it("hasPermission should return false if not authenticated", () => {
    expect(spectator.service.hasPermission([PERMISSIONS.CREATE_BOOK])).toBe(
      false
    );
  });

  it("hasPermission should return true if authenticated and user has admin role", () => {
    spectator.service.setCredentials(credential);
    expect(spectator.service.hasPermission([PERMISSIONS.CREATE_BOOK])).toBe(
      true
    );
  });

  it("hasPermission should return true if no permissions are needed", () => {
    spectator.service.setCredentials(credential);
    expect(spectator.service.hasPermission()).toBe(true);
  });

  it("session storage credentials should be preffered ove local storage", () => {
    const newCredential = { ...credential, accessToken: "new" };
    spectator.service.setCredentials(credential, false);
    expect(spectator.service.credentials).toEqual(credential);
    spectator.service.setCredentials(newCredential, true);
    expect(spectator.service.credentials).toEqual(newCredential);
    spectator.service.refresh();
    expect(spectator.service.credentials).toEqual(credential);
  });
});
