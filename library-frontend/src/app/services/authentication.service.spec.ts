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
import { of } from "rxjs";

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
});
