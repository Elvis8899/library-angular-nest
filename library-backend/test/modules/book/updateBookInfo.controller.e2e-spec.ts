import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { Test } from "@nestjs/testing";
import { AppModule } from "@src/app.module";
import * as request from "supertest";

import { AuthGuard } from "@auth/guards/auth.guard";
import { BookInfoRepository } from "@book/database/bookInfo.repository.port";
import { FakeLoggerService } from "@shared/logger/adapters/fake/FakeLogger.service";
import { PrismaService } from "@shared/prisma/adapter/prisma.service";
import { executeTask } from "@shared/utils/executeTask";
import { BookInfoBuilder } from "@test/data-builders/bookInfoBuilder";
import { MockAuthGuardBuilder } from "@test/data-builders/mockAuthGuardBuilder";
import { unsafeCoerce } from "fp-ts/lib/function";
import { PinoLogger } from "nestjs-pino";

let app: NestFastifyApplication;
let prismaService: PrismaService;
let bookInfoRepository: BookInfoRepository;
const bookInfoBuilder = new BookInfoBuilder();
const originalBookInfo = bookInfoBuilder.withName("Test").build();

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

  bookInfoBuilder.reset();
  await executeTask(bookInfoRepository.save(originalBookInfo));
});

afterEach(async () => {
  await prismaService.bookInfo.deleteMany();
});

describe("[e2e] PUT /v1/bookInfos/{bookInfoId}", () => {
  const v1Route = (id: string) => "/v1/bookInfos/" + id;
  it("Should respond 200 updated for a valid bookInfo", async () => {
    const bookInfoDTO = bookInfoBuilder.buildCreateDTO();
    const response = await request(app.getHttpServer())
      .put(v1Route(originalBookInfo.id))
      .send(bookInfoDTO);
    expect(response.status).toBe(200);
  });

  it("Should respond 422 for invalid name", async () => {
    const bookInfoDTO = bookInfoBuilder.withName("").buildCreateDTO();
    const response = await request(app.getHttpServer())
      .put(v1Route(originalBookInfo.id))
      .send(bookInfoDTO);
    expect(response.status).toBe(422);
  });

  it("Should respond 422 for invalid name type", async () => {
    const bookInfoDTO = bookInfoBuilder
      .withName(unsafeCoerce(1))
      .buildCreateDTO();
    const response = await request(app.getHttpServer())
      .put(v1Route(originalBookInfo.id))
      .send(bookInfoDTO);
    expect(response.status).toBe(422);
  });
});
