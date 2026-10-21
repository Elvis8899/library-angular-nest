import { NestFastifyApplication } from "@nestjs/platform-fastify";
import { Test, TestingModule } from "@nestjs/testing";
import { FPF } from "@shared/utils/application/monads";
import { AppModule } from "@src/app.module";
import { createTestApp } from "@test/util/createTestApp";
import request from "supertest";

import { AuthGuard } from "@auth/guards/auth.guard";
import { FakeLoggerService } from "@shared/logger/adapters/fake/fakeLogger.service";
import { PrismaService } from "@shared/prisma/adapter/prisma.service";
import { MockAuthGuardBuilder } from "@test/dataBuilders/mockAuthGuardBuilder";
import { UserBuilder } from "@test/dataBuilders/userBuilder";
import { PinoLogger } from "nestjs-pino";

let app: NestFastifyApplication;
let testingModule: TestingModule;
let prismaService: PrismaService;
const userBuilder = new UserBuilder(1);

beforeAll(async () => {
  testingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PinoLogger)
    .useClass(FakeLoggerService)
    .overrideGuard(AuthGuard)
    .useValue(new MockAuthGuardBuilder())
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

beforeEach(async () => {
  await prismaService.user.deleteMany();
  userBuilder.reset();
});

afterEach(async () => {
  await prismaService.user.deleteMany();
});

describe("[e2e] POST /v1/users", () => {
  const v1Route = "/v1/users";

  it("Should respond 201 for a valid user", async () => {
    const user = userBuilder.withName("Test").buildCreateDTO();
    const response = await request(app.getHttpServer())
      .post(v1Route)
      .send(user);
    expect(response.status).toBe(201);
  });

  it("Should respond 422 for invalid name", async () => {
    const user = userBuilder.withName("").buildCreateDTO();
    const response = await request(app.getHttpServer())
      .post(v1Route)
      .send(user);
    expect(response.status).toBe(422);
  });

  it("Should respond 422 for invalid cpf", async () => {
    const user = userBuilder.withCPF("12312").buildCreateDTO();
    const response = await request(app.getHttpServer())
      .post(v1Route)
      .send(user);
    expect(response.status).toBe(422);
  });

  it("Should respond 422 for cpf with invalid check digits", async () => {
    const user = userBuilder.withCPF("12345678901").buildCreateDTO();
    const response = await request(app.getHttpServer())
      .post(v1Route)
      .send(user);
    expect(response.status).toBe(422);
  });

  it("Should respond 422 for invalid name type", async () => {
    const user = userBuilder.withName(FPF.unsafeCoerce(1)).buildCreateDTO();
    const response = await request(app.getHttpServer())
      .post(v1Route)
      .send(user);
    expect(response.status).toBe(422);
  });

  it("Should respond 409 for two users with same cpf", async () => {
    const user = userBuilder.buildCreateDTO();
    const userCopy = user;
    const newuserResponse = await request(app.getHttpServer())
      .post(v1Route)
      .send(user);
    expect(newuserResponse.status).toBe(201);
    const response = await request(app.getHttpServer())
      .post(v1Route)
      .send(userCopy);
    expect(response.status).toBe(409);
  });
});
