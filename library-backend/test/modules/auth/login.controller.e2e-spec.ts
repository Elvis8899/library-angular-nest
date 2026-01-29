import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import { AppModule } from "@src/app.module";
import * as request from "supertest";

import { AuthGuard } from "@auth/guards/auth.guard";
import { hashPassword } from "@auth/util/signTokenParams";
import { HttpStatus } from "@nestjs/common";
import { FakeLoggerService } from "@shared/logger/adapters/fake/FakeLogger.service";
import { PrismaService } from "@shared/prisma/adapter/prisma.service";
import { MockAuthGuardBuilder } from "@test/data-builders/mockAuthGuardBuilder";
import { UserBuilder } from "@test/data-builders/userBuilder";
import { PinoLogger } from "nestjs-pino";

let app: NestFastifyApplication;
let prismaService: PrismaService;

beforeAll(async () => {
  const testingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PinoLogger)
    .useClass(FakeLoggerService)
    .overrideGuard(AuthGuard)
    .useValue(new MockAuthGuardBuilder())
    .compile();

  app = testingModule.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter(),
  );
  prismaService = testingModule.get<PrismaService>(PrismaService);
  const userBuilder = new UserBuilder();
  await prismaService.user.deleteMany();
  await prismaService.user.create({
    data: userBuilder
      .withPassword(await hashPassword(userBuilder.build().password))
      .build(),
  });
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
});

afterAll(async () => {
  await prismaService.user.deleteMany();
  await app.close();
  await prismaService.$disconnect();
});

describe("[e2e] POST /v1/login", () => {
  const v1Route = "/v1/login";

  it("Should respond 201 for a valid login", async () => {
    const userInfo = new UserBuilder().buildCreateDTO();
    const response = await request(app.getHttpServer())
      .post(v1Route)
      .send(userInfo);
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
    const responseWrongEmail = await request(app.getHttpServer())
      .post(v1Route)
      .send(userWrongEmail);
    const responseWrongPassword = await request(app.getHttpServer())
      .post(v1Route)
      .send(userWrongPassword);

    // Then it should respond 401
    expect(responseWrongEmail.status).toBe(HttpStatus.UNAUTHORIZED);
    expect(responseWrongPassword.status).toBe(HttpStatus.UNAUTHORIZED);
  });
});
