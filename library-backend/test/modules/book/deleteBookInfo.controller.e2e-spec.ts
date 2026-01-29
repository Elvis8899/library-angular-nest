import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { Test, TestingModule } from "@nestjs/testing";
import { AppModule } from "@src/app.module";
import * as request from "supertest";

import { AuthGuard } from "@auth/guards/auth.guard";
import { BookInfoRepository } from "@book/database/bookInfo.repository.port";
import { HttpStatus } from "@nestjs/common";
import { FakeLoggerService } from "@shared/logger/adapters/fake/FakeLogger.service";
import { PrismaService } from "@shared/prisma/adapter/prisma.service";
import { executeTask } from "@shared/utils/executeTask";
import { BookInfoBuilder } from "@test/data-builders/bookInfoBuilder";
import { MockAuthGuardBuilder } from "@test/data-builders/mockAuthGuardBuilder";
import { PinoLogger } from "nestjs-pino";

let app: NestFastifyApplication;
let testingModule: TestingModule;
let prismaService: PrismaService;

let bookInfoRepository: BookInfoRepository;
beforeAll(async () => {
  testingModule = await Test.createTestingModule({
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

  bookInfoRepository =
    testingModule.get<BookInfoRepository>(BookInfoRepository);

  await app.init();
  await app.getHttpAdapter().getInstance().ready();
});

afterAll(async () => {
  await app.close();
  await prismaService.$disconnect();
});

beforeEach(async () => {
  await prismaService.bookInfo.deleteMany();
});

afterEach(async () => {
  await prismaService.bookInfo.deleteMany();
});

describe("[e2e] DELETE /v1/bookInfos/:id", () => {
  const v1Route = (bookInfoId: string) => "/v1/bookInfos/" + bookInfoId;

  it("Should respond 200 for deleted bookInfo", async () => {
    const bookInfo = new BookInfoBuilder().withName("Test").build();
    await executeTask(bookInfoRepository.save(bookInfo));

    const response = await request(app.getHttpServer()).delete(
      v1Route(bookInfo.id),
    );

    expect(response.status).toBe(HttpStatus.OK);
    const bookInfoAmount = await prismaService.bookInfo.count();
    expect(bookInfoAmount).toBe(0);
  });

  it("Should respond 422 for invalid id", async () => {
    const response = await request(app.getHttpServer()).delete(
      v1Route("fakeId"),
    );
    expect(response.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
  });

  it("Should respond 404 for bookInfo not found", async () => {
    const bookInfo = new BookInfoBuilder().withName("Test").build();
    const response = await request(app.getHttpServer()).delete(
      v1Route(bookInfo.id),
    );
    expect(response.status).toBe(HttpStatus.NOT_FOUND);
  });
});
