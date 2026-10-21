import { NestFastifyApplication } from "@nestjs/platform-fastify";
import { Test, TestingModule } from "@nestjs/testing";
import { FPF } from "@shared/utils/application/monads";
import { AppModule } from "@src/app.module";
import { createTestApp } from "@test/util/createTestApp";
import request from "supertest";

import { AuthGuard } from "@auth/guards/auth.guard";
import { FakeLoggerService } from "@shared/logger/adapters/fake/fakeLogger.service";
import { PrismaService } from "@shared/prisma/adapter/prisma.service";
import { BookInfoBuilder } from "@test/dataBuilders/bookInfoBuilder";
import { MockAuthGuardBuilder } from "@test/dataBuilders/mockAuthGuardBuilder";
import { UserRoleEnum } from "@user/domain/user.entity";
import { PinoLogger } from "nestjs-pino";

let app: NestFastifyApplication;
let testingModule: TestingModule;
let prismaService: PrismaService;
const mockAuthGuard = new MockAuthGuardBuilder();

beforeAll(async () => {
  testingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PinoLogger)
    .useClass(FakeLoggerService)
    .overrideGuard(AuthGuard)
    .useValue(mockAuthGuard)
    .compile();

  app = await createTestApp(testingModule);
  prismaService = testingModule.get<PrismaService>(PrismaService);

  await app.init();
  await app.getHttpAdapter().getInstance().ready();
});

afterAll(async () => {
  await prismaService.bookInfo.deleteMany();
  await app.close();
  await prismaService.$disconnect();
});

describe("[e2e] POST /v1/bookInfos", () => {
  const v1Route = "/v1/bookInfos";

  it("Should respond 201 for a valid bookInfo", async () => {
    const bookInfo = new BookInfoBuilder(0).withName("Test").buildCreateDTO();
    const response = await request(app.getHttpServer())
      .post(v1Route)
      .send(bookInfo);
    expect(response.status).toBe(201);
  });

  it("Should respond 422 for invalid name", async () => {
    const bookInfo = new BookInfoBuilder(1).withName("").buildCreateDTO();
    const response = await request(app.getHttpServer())
      .post(v1Route)
      .send(bookInfo);
    expect(response.status).toBe(422);
  });

  it("Should respond 422 for invalid name type", async () => {
    const bookInfo = new BookInfoBuilder(2)
      .withName(FPF.unsafeCoerce(1))
      .buildCreateDTO();
    const response = await request(app.getHttpServer())
      .post(v1Route)
      .send(bookInfo);
    expect(response.status).toBe(422);
  });

  it("Should respond 403 for client role", async () => {
    mockAuthGuard.withRole(UserRoleEnum.Client);
    const bookInfo = new BookInfoBuilder(3).withName("Test").buildCreateDTO();
    const response = await request(app.getHttpServer())
      .post(v1Route)
      .send(bookInfo);
    mockAuthGuard.reset();
    expect(response.status).toBe(403);
  });
});
