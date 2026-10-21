import { authConfig } from "@auth/auth.config";
import { HttpStatus } from "@nestjs/common";
import { NestFastifyApplication } from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import { FakeLoggerService } from "@shared/logger/adapters/fake/fakeLogger.service";
import { PrismaService } from "@shared/prisma/adapter/prisma.service";
import { AppModule } from "@src/app.module";
import { createTestApp } from "@test/util/createTestApp";
import { SwaggerDocumentBody } from "@test/util/responseBodies";
import { PinoLogger } from "nestjs-pino";
import request from "supertest";

// Checks the setup that main.ts gets from app.setup.ts: helmet, Swagger
// and how client IPs are read behind a proxy

const buildApp = async (trustProxy?: boolean | string[]) => {
  const testingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PinoLogger)
    .useClass(FakeLoggerService)
    .compile();
  const app = await createTestApp(testingModule, trustProxy);
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
  return app;
};

const closeApp = async (app: NestFastifyApplication) => {
  await app.get(PrismaService).$disconnect();
  await app.close();
};

describe("[e2e] App setup", () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await buildApp();
  });

  afterAll(async () => {
    await closeApp(app);
  });

  it("Should send helmet's security headers, without a CSP", async () => {
    const response = await request(app.getHttpServer()).get("/check/status");

    expect(response.status).toBe(HttpStatus.OK);
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["x-frame-options"]).toBe("SAMEORIGIN");
    expect(response.headers["strict-transport-security"]).toBeDefined();
    // Disabled on purpose in app.setup.ts
    expect(response.headers["content-security-policy"]).toBeUndefined();
  });

  it("Should serve the Swagger UI and the OpenAPI document", async () => {
    const [ui, document] = await Promise.all([
      request(app.getHttpServer()).get("/swagger"),
      request(app.getHttpServer()).get("/swagger-json"),
    ]);

    expect(ui.status).toBe(HttpStatus.OK);
    expect(ui.headers["content-type"]).toContain("text/html");
    expect(document.status).toBe(HttpStatus.OK);
    const body = SwaggerDocumentBody.parse(document.body);
    expect(body.info.title).toBe("Biblioteca");
    expect(body.paths).toHaveProperty("/v1/bookInfos");
    expect(body.components.securitySchemes).toHaveProperty("bearer");
  });
});

describe("[e2e] Client IP for login rate limiting", () => {
  // Failed logins for one email, each claiming another client IP
  const attemptLogins = async (
    app: NestFastifyApplication,
    email: string,
    count: number,
  ) => {
    const statuses: number[] = [];
    for (let i = 1; i <= count; i++) {
      const response = await request(app.getHttpServer())
        .post("/v1/login")
        .set("X-Forwarded-For", `203.0.113.${String(i)}`)
        .send({ email, password: "wrong-password" });
      statuses.push(response.status);
    }
    return statuses;
  };

  it("Should ignore X-Forwarded-For when no proxy is trusted", async () => {
    const app = await buildApp(false);
    try {
      const statuses = await attemptLogins(
        app,
        "untrusted-proxy@example.com",
        authConfig.loginRateLimit + 1,
      );

      // Changing the header doesn't get around the limit
      expect(statuses.at(-1)).toBe(HttpStatus.TOO_MANY_REQUESTS);
    } finally {
      await closeApp(app);
    }
  });

  it("Should limit each forwarded client IP separately behind a trusted proxy", async () => {
    const app = await buildApp(["loopback"]);
    try {
      const statuses = await attemptLogins(
        app,
        "trusted-proxy@example.com",
        authConfig.loginRateLimit + 1,
      );

      // Every request comes from another client, so none is limited
      expect(statuses).not.toContain(HttpStatus.TOO_MANY_REQUESTS);
      expect(new Set(statuses)).toEqual(new Set([HttpStatus.UNAUTHORIZED]));
    } finally {
      await closeApp(app);
    }
  });
});
