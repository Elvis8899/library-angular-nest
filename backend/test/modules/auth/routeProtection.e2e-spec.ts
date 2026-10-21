import { UserRoleEnum } from "@modules/user/domain/user.entity";
import { BcryptPasswordHasher } from "@modules/user/utils/bcryptPasswordHasher";
import { HttpStatus } from "@nestjs/common";
import { UserBuilder } from "@test/dataBuilders/userBuilder";
import { createTestId, TableNameEnum } from "@test/util/defaultIds";
import { useE2eApp } from "@test/util/e2eApp";
import { TokensBody } from "@test/util/responseBodies";
import { z } from "zod";

const passwordHasher = new BcryptPasswordHasher();

// Unlike the other e2e specs, AuthGuard is not replaced here: requests go
// through the real guard with real tokens from POST /v1/login

// Every route not listed here must require a token. Adding a public route
// means adding it to this list on purpose.
const HttpMethod = z.enum(["get", "post", "put", "patch", "delete"]);

const publicRoutes = [
  "POST /v1/login",
  "POST /v1/refresh",
  "GET /check/status",
];

const checkedMethods = ["GET", "POST", "PUT", "PATCH", "DELETE"];
const routes: string[] = [];

const admin = new UserBuilder(1)
  .withEmail("route-admin@example.com")
  .withCPF("")
  .withRole(UserRoleEnum.Admin);
const client = new UserBuilder(2)
  .withEmail("route-client@example.com")
  .withRole(UserRoleEnum.Client);

const saveWithHashedPassword = async (builder: UserBuilder) => {
  const user = builder.build();
  await e2e.prisma.user.create({
    data: {
      ...user,
      // As RealUserRepository stores it: no CPF is NULL
      cpf: user.cpf || null,
      password: await passwordHasher.hash(user.password),
    },
  });
};

const login = async (builder: UserBuilder) => {
  const { email, password } = builder.build();
  const response = await e2e.http().post("/v1/login").send({ email, password });
  expect(response.status).toBe(HttpStatus.OK);
  return TokensBody.parse(response.body).accessToken;
};

const e2e = useE2eApp({
  // Nest registers its routes during init, so this sees every one of them
  beforeInit: (app) => {
    app
      .getHttpAdapter()
      .getInstance()
      .addHook("onRoute", ({ method, url }) => {
        for (const m of [method].flat()) {
          if (checkedMethods.includes(m)) routes.push(`${m} ${url}`);
        }
      });
  },
});

beforeAll(async () => {
  await saveWithHashedPassword(admin);
  await saveWithHashedPassword(client);
});

describe("[e2e] Route protection", () => {
  it("Should register the public routes", () => {
    expect(routes).toEqual(expect.arrayContaining(publicRoutes));
  });

  it("Should reject every other route without a token", async () => {
    const protectedRoutes = routes.filter((r) => !publicRoutes.includes(r));
    // Guards run before validation, so placeholder ids and no body are enough
    const id = createTestId(TableNameEnum.None, 1);

    // One at a time: supertest starts the server per request, and firing
    // them all at once resets connections
    const results: string[] = [];
    for (const route of protectedRoutes) {
      const [method = "", url = ""] = route.split(" ");
      const path = url.replace(/:\w+/g, id);
      const response = await e2e
        .http()
        [HttpMethod.parse(method.toLowerCase())](path);
      results.push(`${route} -> ${String(response.status)}`);
    }

    expect(protectedRoutes.length).toBeGreaterThan(0);
    expect(results).toEqual(
      protectedRoutes.map(
        (route) => `${route} -> ${String(HttpStatus.UNAUTHORIZED)}`,
      ),
    );
  });

  it("Should reject a token that is not a valid JWT", async () => {
    const response = await e2e
      .http()
      .post("/v1/logout")
      .set("Authorization", "Bearer not-a-jwt");

    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it("Should let a client with a login token log out but not list users", async () => {
    const token = await login(client);

    const users = await e2e
      .http()
      .get("/v1/users")
      .set("Authorization", `Bearer ${token}`);
    // Revokes the refresh tokens only; the access token stays valid
    const logout = await e2e
      .http()
      .post("/v1/logout")
      .set("Authorization", `Bearer ${token}`);

    expect(users.status).toBe(HttpStatus.FORBIDDEN);
    expect(logout.status).toBe(HttpStatus.NO_CONTENT);
  });

  it("Should let an admin with a login token list users", async () => {
    const token = await login(admin);

    const response = await e2e
      .http()
      .get("/v1/users")
      .set("Authorization", `Bearer ${token}`);

    expect(response.status).toBe(HttpStatus.OK);
  });
});
