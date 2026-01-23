import { Test, TestingModule } from "@nestjs/testing";
import * as request from "supertest";
import { AppModule } from "@src/app.module";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";

import { FakeLoggerService } from "@src/shared/logger/adapters/fake/FakeLogger.service";
import { PrismaService } from "@shared/prisma/adapter/prisma.service";
import { PinoLogger } from "nestjs-pino";
import { BookInfoBuilder } from "@test/data-builders/bookInfoBuilder";
import { unsafeCoerce } from "fp-ts/lib/function";

let app: NestFastifyApplication;
let testingModule: TestingModule;
let prismaService: PrismaService;
const bookInfoBuilder = new BookInfoBuilder(1);

beforeAll(async () => {
  testingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PinoLogger)
    .useClass(FakeLoggerService)
    .compile();

  app = testingModule.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter(),
  );
  prismaService = testingModule.get<PrismaService>(PrismaService);

  await app.init();
  await app.getHttpAdapter().getInstance().ready();
});

afterAll(async () => {
  await app.close();
  await prismaService.$disconnect();
});

beforeEach(async () => {
  await prismaService.bookInfo.deleteMany();
  bookInfoBuilder.reset();
});

afterEach(async () => {
  await prismaService.bookInfo.deleteMany();
});

describe("[e2e] POST /v1/bookInfos", () => {
  const v1Route = "/v1/bookInfos";

  it("Should respond 201 for a valid bookInfo", async () => {
    const bookInfo = bookInfoBuilder.withName("Test").buildCreateDTO();
    const response = await request(app.getHttpServer())
      .post(v1Route)
      .send(bookInfo);
    expect(response.status).toBe(201);
  });

  it("Should respond 422 for invalid name", async () => {
    const bookInfo = bookInfoBuilder.withName("").buildCreateDTO();
    const response = await request(app.getHttpServer())
      .post(v1Route)
      .send(bookInfo);
    expect(response.status).toBe(422);
  });

  it("Should respond 422 for invalid name type", async () => {
    const bookInfo = bookInfoBuilder.withName(unsafeCoerce(1)).buildCreateDTO();
    const response = await request(app.getHttpServer())
      .post(v1Route)
      .send(bookInfo);
    expect(response.status).toBe(422);
  });
});
