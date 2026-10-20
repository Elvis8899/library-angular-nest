import { Credentials, ROLE } from "@app/models/credentials.entity";
import {
  AuthenticationService,
  LoginContext,
} from "@app/services/authentication.service";
import { CredentialsService } from "@app/services/credentials.service";
import { UserService } from "@app/services/user.http.service";
import {
  createServiceFactory,
  SpectatorService,
  SpyObject,
} from "@openng/spectator/vitest";
import { firstValueFrom, of, throwError } from "rxjs";

describe("AuthService", () => {
  const loginContext: LoginContext = {
    email: "email",
    password: "password",
    remember: true,
    isMobile: false,
  };

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

  let userServiceMock: SpyObject<UserService>;
  let credentialServiceMock: SpyObject<CredentialsService>;
  let spectator: SpectatorService<AuthenticationService>;
  const createService = createServiceFactory({
    service: AuthenticationService,
    mocks: [UserService, CredentialsService],
  });

  beforeEach(() => {
    spectator = createService();
    userServiceMock = spectator.inject(UserService);
    userServiceMock.login.mockReturnValue(of(credential));
    credentialServiceMock = spectator.inject(CredentialsService);
    credentialServiceMock.setCredentials.mockReturnValue(undefined);
    credentialServiceMock.clearCredentials.mockReturnValue(undefined);
  });

  afterEach(() => vi.unstubAllGlobals());

  it("On login, should set credentials", () => {
    // When saving the credentials
    spectator.service.login(loginContext).subscribe();

    expect(credentialServiceMock.setCredentials).toBeCalledWith(credential);
  });

  it("On logout, should clear credentials", () => {
    // When saving the credentials
    let res = false;
    spectator.service.logout().subscribe({ next: (v) => (res = v) });

    expect(credentialServiceMock.clearCredentials).toBeCalled();
    expect(res).toBe(true);
  });

  it("On refresh, should request new tokens and set credentials", async () => {
    // Given stored credentials with a refresh token
    credentialServiceMock.castToWritable().credentials = credential;
    const newCredential = { ...credential, accessToken: "new" };
    userServiceMock.refresh.mockReturnValue(of(newCredential));

    // When refreshing
    const res = await firstValueFrom(spectator.service.refresh());

    expect(userServiceMock.refresh).toBeCalledWith(credential.refreshToken);
    expect(credentialServiceMock.setCredentials).toBeCalledWith(newCredential);
    expect(res).toEqual(newCredential);
  });

  it("On concurrent refresh, should send a single request", async () => {
    credentialServiceMock.castToWritable().credentials = credential;
    userServiceMock.refresh.mockReturnValue(of(credential));

    // When refreshing twice before the first response arrives
    const results = await Promise.all([
      firstValueFrom(spectator.service.refresh()),
      firstValueFrom(spectator.service.refresh()),
    ]);

    expect(userServiceMock.refresh).toHaveBeenCalledTimes(1);
    expect(results).toEqual([credential, credential]);
  });

  it("On refresh, should reuse the tokens another tab already got", async () => {
    // Given another tab that used the same refresh token while this one waited
    const otherTabCredential = { ...credential, refreshToken: "rotated" };
    credentialServiceMock.castToWritable().credentials = credential;
    credentialServiceMock.refresh.mockImplementation(() => {
      credentialServiceMock.castToWritable().credentials = otherTabCredential;
    });

    const res = await firstValueFrom(spectator.service.refresh());

    // Then the single-use token is not sent again
    expect(userServiceMock.refresh).not.toBeCalled();
    expect(res).toEqual(otherTabCredential);
  });

  it("On refresh, should fail if another tab logged out", async () => {
    credentialServiceMock.castToWritable().credentials = credential;
    credentialServiceMock.refresh.mockImplementation(() => {
      credentialServiceMock.castToWritable().credentials = null;
    });

    await expect(firstValueFrom(spectator.service.refresh())).rejects.toThrow();
    expect(userServiceMock.refresh).not.toBeCalled();
  });

  it("On refresh, should hold the lock shared between tabs", async () => {
    // Given a browser with the Web Locks API
    const request = vi.fn((_name: string, task: () => Promise<Credentials>) =>
      task()
    );
    vi.stubGlobal("navigator", { ...navigator, locks: { request } });
    credentialServiceMock.castToWritable().credentials = credential;
    userServiceMock.refresh.mockReturnValue(of(credential));

    await firstValueFrom(spectator.service.refresh());

    expect(request).toBeCalledWith("auth-refresh", expect.any(Function));
  });

  it("On refresh without refresh token, should fail", () => {
    credentialServiceMock.castToWritable().credentials = null;

    let failed = false;
    spectator.service.refresh().subscribe({ error: () => (failed = true) });

    expect(failed).toBe(true);
    expect(userServiceMock.refresh).not.toBeCalled();
  });

  it("On logout while authenticated, should revoke tokens on the server", () => {
    credentialServiceMock.isAuthenticated.mockReturnValue(true);
    userServiceMock.logout.mockReturnValue(of(undefined));

    let res = false;
    spectator.service.logout().subscribe({ next: (v) => (res = v) });

    expect(userServiceMock.logout).toHaveBeenCalledTimes(1);
    expect(credentialServiceMock.clearCredentials).toBeCalled();
    expect(res).toBe(true);
  });

  it("On logout, should clear credentials even if the server call fails", () => {
    credentialServiceMock.isAuthenticated.mockReturnValue(true);
    userServiceMock.logout.mockReturnValue(
      throwError(() => new Error("offline"))
    );

    let res = false;
    spectator.service.logout().subscribe({ next: (v) => (res = v) });

    expect(credentialServiceMock.clearCredentials).toBeCalled();
    expect(res).toBe(true);
  });
});
