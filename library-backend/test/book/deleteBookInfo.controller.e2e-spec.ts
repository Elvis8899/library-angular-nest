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
import { executeTask } from "@src/shared/utils/executeTask";
import { BookInfoRepository } from "@src/modules/book/database/bookInfo.repository.port";
import { BookInfoBuilder } from "@test/data-builders/bookInfoBuilder";
import { AuthGuard } from "@src/modules/auth/guards/auth.guard";
import { ExecutionContext } from "@nestjs/common";
import { RequestJWTPayload } from "@src/modules/auth/domain/login.entity";
import { UserRoleEnum } from "@src/modules/user/domain/user.entity";

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
    .useValue({
      canActivate: (context: ExecutionContext) => {
        const request = context.switchToHttp().getRequest();
        const user: RequestJWTPayload = {
          sub: "abc123",
          email: "admin@admin.com",
          role: UserRoleEnum.Admin,
          iat: 0,
          exp: 0,
          aud: "",
          iss: "",
        };
        request.user = user;
        return true;
      },
    })
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

    expect(response.status).toBe(200);
    const bookInfoAmount = await prismaService.bookInfo.count();
    expect(bookInfoAmount).toBe(0);
  });

  it("Should respond 422 for invalid id", async () => {
    const response = await request(app.getHttpServer()).delete(
      v1Route("fakeId"),
    );
    expect(response.status).toBe(422);
  });

  it("Should respond 404 for bookInfo not found", async () => {
    const bookInfo = new BookInfoBuilder().withName("Test").build();
    const response = await request(app.getHttpServer()).delete(
      v1Route(bookInfo.id),
    );
    expect(response.status).toBe(404);
  });
});
