import { AuthGuard } from "@auth/guards/auth.guard";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { Test, TestingModule } from "@nestjs/testing";
import { FakeLoggerService } from "@shared/logger/adapters/fake/FakeLogger.service";
import { PrismaService } from "@shared/prisma/adapter/prisma.service";
import { executeTask } from "@shared/utils/executeTask";
import { AppModule } from "@src/app.module";
import { BookItem } from "@src/modules/book/domain/value-object/bookItem.entity";
import { BookRentalRepository } from "@src/modules/rental/database/bookRental.repository.port";
import { UserRoleEnum } from "@src/modules/user/domain/user.entity";
import { BookInfoBuilder } from "@test/data-builders/bookInfoBuilder";
import { BookRentalBuilder } from "@test/data-builders/bookRentalBuilder";
import { MockAuthGuardBuilder } from "@test/data-builders/mockAuthGuardBuilder";
import { UserBuilder } from "@test/data-builders/userBuilder";
import { createTestId, TableNameEnum } from "@test/util/defaultIds";
import { PinoLogger } from "nestjs-pino";
import * as request from "supertest";

let app: NestFastifyApplication;
let testingModule: TestingModule;
let prismaService: PrismaService;

const authGuardMock = new MockAuthGuardBuilder();

let bookRentalRepository: BookRentalRepository;
beforeAll(async () => {
  testingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(PinoLogger)
    .useClass(FakeLoggerService)
    .overrideGuard(AuthGuard)
    .useValue(authGuardMock.build())
    .compile();

  app = testingModule.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter(),
  );
  prismaService = testingModule.get<PrismaService>(PrismaService);

  bookRentalRepository =
    testingModule.get<BookRentalRepository>(BookRentalRepository);

  await prismaService.bookInfo.deleteMany();
  await prismaService.user.deleteMany();

  const {
    bookItems: [bookItemRaw],
    ...bookInfo
  } = new BookInfoBuilder().build();
  const { bookId: _, ...bookItem } = bookItemRaw as BookItem;
  await prismaService.bookInfo.create({
    data: { ...bookInfo, bookItems: { create: { ...bookItem } } },
  });
  await prismaService.user.create({
    data: new UserBuilder().build(),
  });
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
});

afterAll(async () => {
  await app.close();
  await prismaService.$disconnect();
});

beforeEach(async () => {
  authGuardMock.reset();
  await prismaService.bookRentalDetails.deleteMany();
});

afterEach(async () => {
  await prismaService.bookRentalDetails.deleteMany();
});

describe("[e2e] GET /v1/bookRentals", () => {
  const v1Route = "/v1/bookRentals";

  it("Should respond 200 with bookRental List", async () => {
    const {
      bookItem: _,
      user: __,
      ...bookRental
    } = new BookRentalBuilder().build();

    await executeTask(bookRentalRepository.save(bookRental));

    const response = await request(app.getHttpServer()).get(v1Route).query({
      limit: 10,
      page: 0,
    });
    expect(response.status).toBe(200);
    expect(response.body?.count).toBe(1);
    expect(response.body?.data?.length).toBe(1);
  });

  it("Should respond 200 with bookRental List for client", async () => {
    authGuardMock
      .withSub(createTestId(TableNameEnum.User, 0))
      .withRole(UserRoleEnum.Client);
    const {
      bookItem: _,
      user: __,
      ...bookRental
    } = new BookRentalBuilder().build();

    await executeTask(bookRentalRepository.save(bookRental));

    const response = await request(app.getHttpServer()).get(v1Route).query({
      limit: 10,
      page: 0,
    });
    expect(response.status).toBe(200);
    expect(response.body?.count).toBe(1);
    expect(response.body?.data?.length).toBe(1);
  });

  it("Should respond 200 with empty bookRental List for client without rentals", async () => {
    authGuardMock
      .withSub(createTestId(TableNameEnum.User, 1))
      .withRole(UserRoleEnum.Client);
    const {
      bookItem: _,
      user: __,
      ...bookRental
    } = new BookRentalBuilder().build();

    await executeTask(bookRentalRepository.save(bookRental));

    const response = await request(app.getHttpServer()).get(v1Route).query({
      limit: 10,
      page: 0,
    });
    expect(response.status).toBe(200);
    expect(response.body?.count).toBe(0);
    expect(response.body?.data?.length).toBe(0);
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
