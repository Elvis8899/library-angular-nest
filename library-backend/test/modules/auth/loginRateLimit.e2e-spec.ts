import { authConfig } from "@auth/auth.config";
import { AuthGuard } from "@auth/guards/auth.guard";
import { HttpStatus } from "@nestjs/common";
import { NestFastifyApplication } from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import { FakeLoggerService } from "@shared/logger/adapters/fake/fakeLogger.service";
import { PrismaService } from "@shared/prisma/adapter/prisma.service";
import { AppModule } from "@src/app.module";
import { MockAuthGuardBuilder } from "@test/dataBuilders/mockAuthGuardBuilder";
import { createTestApp } from "@test/util/createTestApp";
import { PinoLogger } from "nestjs-pino";
import request from "supertest";

let app: NestFastifyApplication;
let prismaService: PrismaService;

beforeAll(async () => {
  const testingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PinoLogger)
    .useClass(FakeLoggerService)
    .overrideGuard(AuthGuard)
    .useValue(new MockAuthGuardBuilder().build())
    .compile();

  app = await createTestApp(testingModule);
  prismaService = testingModule.get<PrismaService>(PrismaService);
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
});

afterAll(async () => {
  await app.close();
  await prismaService.$disconnect();
});

describe("[e2e] POST /v1/login rate limit", () => {
  const login = (email: string) =>
    request(app.getHttpServer())
      .post("/v1/login")
      .send({ email, password: "wrong-password" });

  it("Should respond 429 after too many attempts for the same email", async () => {
    // Given the allowed number of failed attempts for one email
    for (let i = 0; i < authConfig.loginRateLimit; i++) {
      const response = await login("target@example.com");
      expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
    }

    // Then the next attempt is throttled, regardless of email case
    const throttled = await login("TARGET@example.com");
    expect(throttled.status).toBe(HttpStatus.TOO_MANY_REQUESTS);

    // And other accounts are not affected
    const otherEmail = await login("someone-else@example.com");
    expect(otherEmail.status).toBe(HttpStatus.UNAUTHORIZED);
  });
});
