import { Test, TestingModule } from "@nestjs/testing";
import * as request from "supertest";
import { AppModule } from "@src/app.module";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { FakeLoggerService } from "@src/shared/logger/adapters/fake/FakeLogger.service";
import { PrismaService } from "@shared/prisma/adapter/prisma.service";
import { BookInfoBuilder } from "@test/data-builders/bookInfoBuilder";
import { PinoLogger } from "nestjs-pino";
import { executeTask } from "@src/shared/utils/executeTask";
import { BookInfoRepository } from "@src/modules/book/database/bookInfo.repository.port";
import { AuthGuard } from "@src/modules/auth/guards/auth.guard";
import { mockAuthGuard } from "@test/data-builders/mockAuthGuard";

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
    .useValue(mockAuthGuard())
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

describe("[e2e] GET /v1/bookInfos", () => {
  const v1Route = "/v1/bookInfos";

  it("Should respond 200 with bookInfo List", async () => {
    const bookInfo = new BookInfoBuilder().withName("Test").build();
    await executeTask(bookInfoRepository.save(bookInfo));

    const response = await request(app.getHttpServer()).get(v1Route).query({
      limit: 10,
      page: 0,
    });
    expect(response.status).toBe(200);
    expect(response.body?.count).toBe(1);
    expect(response.body?.data?.length).toBe(1);
  });

  it("Should respond 200 with empty list", async () => {
    const response = await request(app.getHttpServer()).get(v1Route).query({
      limit: 100,
      page: 1,
    });
    expect(response.status).toBe(200);
    expect(response.body?.count).toBe(0);
  });
});
