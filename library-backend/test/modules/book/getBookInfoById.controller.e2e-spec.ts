import { AuthGuard } from "@auth/guards/auth.guard";
import { BookInfoRepository } from "@book/database/bookInfo.repository.port";
import { NestFastifyApplication } from "@nestjs/platform-fastify";
import { Test, TestingModule } from "@nestjs/testing";
import { FakeLoggerService } from "@shared/logger/adapters/fake/fakeLogger.service";
import { PrismaService } from "@shared/prisma/adapter/prisma.service";
import { executeTask } from "@shared/utils/application/executeTask";
import { AppModule } from "@src/app.module";
import { BookInfoBuilder } from "@test/dataBuilders/bookInfoBuilder";
import { MockAuthGuardBuilder } from "@test/dataBuilders/mockAuthGuardBuilder";
import { createTestApp } from "@test/util/createTestApp";
import { PinoLogger } from "nestjs-pino";
import request from "supertest";

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

  app = await createTestApp(testingModule);
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
  const v1Route = (id: string) => "/v1/bookInfos/" + id;

  it("Should respond 200 with bookInfo", async () => {
    const bookInfo = new BookInfoBuilder().withName("Test").build();
    await executeTask(bookInfoRepository.save(bookInfo));

    const response = await request(app.getHttpServer())
      .get(v1Route(bookInfo.id))
      .query({
        limit: 10,
        page: 0,
      });
    expect(response.status).toBe(200);
    expect(response.body?.id).toBe(bookInfo.id);
  });

  it("Should respond 404 when bookInfo not found", async () => {
    const response = await request(app.getHttpServer())
      .get(v1Route("00000000-0000-0000-0000-000000000000"))
      .query({
        limit: 100,
        page: 1,
      });
    expect(response.status).toBe(404);
  });
});
