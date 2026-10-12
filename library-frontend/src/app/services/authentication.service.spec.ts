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
} from "@ngneat/spectator/vitest";
import { of, Subject } from "rxjs";

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

  it("On refresh, should request new tokens and set credentials", () => {
    // Given stored credentials with a refresh token
    credentialServiceMock.castToWritable().credentials = credential;
    const newCredential = { ...credential, accessToken: "new" };
    userServiceMock.refresh.mockReturnValue(of(newCredential));

    // When refreshing
    let res: Credentials | undefined;
    spectator.service.refresh().subscribe({ next: (v) => (res = v) });

    expect(userServiceMock.refresh).toBeCalledWith(credential.refreshToken);
    expect(credentialServiceMock.setCredentials).toBeCalledWith(newCredential);
    expect(res).toEqual(newCredential);
  });

  it("On concurrent refresh, should send a single request", () => {
    credentialServiceMock.castToWritable().credentials = credential;
    const response$ = new Subject<Credentials>();
    userServiceMock.refresh.mockReturnValue(response$);

    // When refreshing twice before the first response arrives
    const results: Credentials[] = [];
    spectator.service.refresh().subscribe((v) => results.push(v));
    spectator.service.refresh().subscribe((v) => results.push(v));
    response$.next(credential);
    response$.complete();

    expect(userServiceMock.refresh).toHaveBeenCalledTimes(1);
    expect(results).toEqual([credential, credential]);
  });

  it("On refresh without refresh token, should fail", () => {
    credentialServiceMock.castToWritable().credentials = null;

    let failed = false;
    spectator.service.refresh().subscribe({ error: () => (failed = true) });

    expect(failed).toBe(true);
    expect(userServiceMock.refresh).not.toBeCalled();
  });
});
