import { HttpStatus } from "@nestjs/common";
import { NestFastifyApplication } from "@nestjs/platform-fastify";
import { Test, TestingModule } from "@nestjs/testing";
import { FakeLoggerService } from "@shared/logger/adapters/fake/fakeLogger.service";
import { AppModule } from "@src/app.module";
import { createTestApp } from "@test/util/createTestApp";
import { PinoLogger } from "nestjs-pino";
import request from "supertest";

describe("AppController (e2e)", () => {
  let app: NestFastifyApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PinoLogger)
      .useClass(FakeLoggerService)
      .compile();

    app = await createTestApp(moduleFixture);
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  it("/check (GET)", () => {
    return request(app.getHttpServer())
      .get("/check/status")
      .expect(HttpStatus.OK)
      .expect("ok");
  });
});
