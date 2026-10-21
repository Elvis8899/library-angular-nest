import { useE2eApp } from "@test/util/e2eApp";
import { LoginBody, TokensBody } from "@test/util/responseBodies";

import { hashPassword } from "@auth/utils/password";
import { HttpStatus } from "@nestjs/common";
import { MockAuthGuardBuilder } from "@test/dataBuilders/mockAuthGuardBuilder";
import { UserBuilder } from "@test/dataBuilders/userBuilder";
const authGuardMock = new MockAuthGuardBuilder();

const e2e = useE2eApp({ authGuard: authGuardMock.build() });

beforeAll(async () => {
  const userBuilder = new UserBuilder();
  await e2e.prisma.user.create({
    data: userBuilder
      .withPassword(await hashPassword(userBuilder.build().password))
      .build(),
  });
});

describe("[e2e] POST /v1/login", () => {
  const v1Route = "/v1/login";

  it("Should respond 201 for a valid login", async () => {
    const userInfo = new UserBuilder().buildCreateDTO();
    const response = await e2e.http().post(v1Route).send(userInfo);
    expect(response.status).toBe(HttpStatus.OK);
  });

  it("Should accept the email in any case", async () => {
    const { email, password } = new UserBuilder().build();
    const response = await e2e
      .http()
      .post(v1Route)
      .send({ email: email.toUpperCase(), password });
    expect(response.status).toBe(HttpStatus.OK);
  });

  it("Should respond 401 for invalid email or password", async () => {
    // Given a potentially valid user
    // with wrong email
    const userWrongEmail = new UserBuilder(0)
      .withEmail("email2@example.com")
      .buildCreateDTO();

    // or with wrong password
    const userWrongPassword = new UserBuilder(0)
      .withPassword("1234567")
      .buildCreateDTO();

    // When it tries to login
    const responseWrongEmail = await e2e
      .http()
      .post(v1Route)
      .send(userWrongEmail);
    const responseWrongPassword = await e2e
      .http()
      .post(v1Route)
      .send(userWrongPassword);

    // Then it should respond 401
    expect(responseWrongEmail.status).toBe(HttpStatus.UNAUTHORIZED);
    expect(responseWrongPassword.status).toBe(HttpStatus.UNAUTHORIZED);
  });
});

describe("[e2e] POST /v1/refresh", () => {
  const v1Route = "/v1/refresh";

  it("Should respond 200 with new tokens for a valid refresh token", async () => {
    // Given a logged in user
    const login = await e2e
      .http()
      .post("/v1/login")
      .send(new UserBuilder().buildCreateDTO());
    const { refreshToken } = TokensBody.parse(login.body);

    // When it refreshes its tokens
    const response = await e2e.http().post(v1Route).send({ refreshToken });

    // Then it should receive new tokens
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body?.accessToken).toBeTruthy();
    expect(response.body?.refreshToken).toBeTruthy();
  });

  it("Should accept a refresh token only once", async () => {
    // Given a refresh token that was already exchanged
    const login = await e2e
      .http()
      .post("/v1/login")
      .send(new UserBuilder().buildCreateDTO());
    const { refreshToken } = TokensBody.parse(login.body);
    const rotated = await e2e.http().post(v1Route).send({ refreshToken });

    // When it is used again
    const reuse = await e2e.http().post(v1Route).send({ refreshToken });

    // Then it is rejected, and the session is revoked
    expect(rotated.status).toBe(HttpStatus.OK);
    expect(reuse.status).toBe(HttpStatus.UNAUTHORIZED);
    const afterReuse = await e2e
      .http()
      .post(v1Route)
      .send({ refreshToken: TokensBody.parse(rotated.body).refreshToken });
    expect(afterReuse.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it("Should respond 401 for an invalid refresh token", async () => {
    const response = await e2e
      .http()
      .post(v1Route)
      .send({ refreshToken: "not-a-jwt" });
    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  });
});

describe("[e2e] POST /v1/logout", () => {
  it("Should revoke refresh tokens issued before logout", async () => {
    // Given a logged in user whose refresh token works
    const userInfo = new UserBuilder().buildCreateDTO();
    const login = await e2e.http().post("/v1/login").send(userInfo);
    const { refreshToken, user } = LoginBody.parse(login.body);

    // When the user logs out
    authGuardMock.withSub(user.id);
    const logout = await e2e.http().post("/v1/logout");
    authGuardMock.reset();

    // Then the old refresh token is rejected
    expect(logout.status).toBe(HttpStatus.NO_CONTENT);
    const refresh = await e2e.http().post("/v1/refresh").send({ refreshToken });
    expect(refresh.status).toBe(HttpStatus.UNAUTHORIZED);
  });
});
