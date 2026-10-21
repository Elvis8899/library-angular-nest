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
import { PinoLogger } from "nestjs-pino";

let app: NestFastifyApplication;
let testingModule: TestingModule;
let prismaService: PrismaService;

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

  await prismaService.bookInfo.deleteMany({});

  const { bookItems: _, ...bookInfo } = new BookInfoBuilder()
    .withBookItems([])
    .build();
  await prismaService.bookInfo.create({
    data: { ...bookInfo },
  });

  await app.init();
  await app.getHttpAdapter().getInstance().ready();
});

afterAll(async () => {
  await prismaService.bookInfo.deleteMany();
  await app.close();
  await prismaService.$disconnect();
});

describe("[e2e] POST /v1/bookInfos/item", () => {
  const v1Route = "/v1/bookInfos/item";

  it("Should respond 201 for a valid bookItem", async () => {
    const bookItem = new BookInfoBuilder(0).buildItem();
    const response = await request(app.getHttpServer())
      .post(v1Route)
      .send(bookItem);

    expect(response.status).toBe(201);
  });

  it("Should respond 422 for invalid book item", async () => {
    const response = await request(app.getHttpServer())
      .post(v1Route)
      .send(FPF.unsafeCoerce({}));
    expect(response.status).toBe(422);
  });
});
