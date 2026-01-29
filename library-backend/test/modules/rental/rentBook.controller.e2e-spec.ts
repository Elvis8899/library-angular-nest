import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { Test, TestingModule } from "@nestjs/testing";
import { AppModule } from "@src/app.module";
import * as request from "supertest";

import { AuthGuard } from "@auth/guards/auth.guard";
import { HttpStatus } from "@nestjs/common";
import { FakeLoggerService } from "@shared/logger/adapters/fake/FakeLogger.service";
import { PrismaService } from "@shared/prisma/adapter/prisma.service";
import { BookInfoRepository } from "@src/modules/book/database/bookInfo.repository.port";
import {
  BookItem,
  BookItemStatusEnum,
} from "@src/modules/book/domain/value-object/bookItem.entity";
import { executeTask } from "@src/modules/shared/utils/executeTask";
import { UserRoleEnum } from "@src/modules/user/domain/user.entity";
import { BookInfoBuilder } from "@test/data-builders/bookInfoBuilder";
import { BookRentalBuilder } from "@test/data-builders/bookRentalBuilder";
import { MockAuthGuardBuilder } from "@test/data-builders/mockAuthGuardBuilder";
import { UserBuilder } from "@test/data-builders/userBuilder";
import { createTestId, TableNameEnum } from "@test/util/defaultIds";
import { unsafeCoerce } from "fp-ts/lib/function";
import { PinoLogger } from "nestjs-pino";

let app: NestFastifyApplication;
let testingModule: TestingModule;
let prismaService: PrismaService;
let bookInfoRepository: BookInfoRepository;

const bookRentalBuilder = new BookRentalBuilder(0);
const authGuardMock = new MockAuthGuardBuilder();

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
  bookInfoRepository =
    testingModule.get<BookInfoRepository>(BookInfoRepository);
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

beforeEach(async () => {
  await prismaService.bookRentalDetails.deleteMany();
  authGuardMock.reset();
});

afterAll(async () => {
  await app.close();
  await prismaService.$disconnect();
});

describe("[e2e] POST /v1/bookRentals/rent", () => {
  const v1Route = "/v1/bookRentals/rent";

  it("Should respond 201 for a valid bookInfo", async () => {
    const bookRental = bookRentalBuilder.buildCreateDTO();
    const response = await request(app.getHttpServer())
      .post(v1Route)
      .send(bookRental);
    expect(response.status).toBe(HttpStatus.CREATED);
  });

  it("Should respond 404 if user is client and id doesnt match", async () => {
    authGuardMock
      .withSub(createTestId(TableNameEnum.User, 2))
      .withRole(UserRoleEnum.Client);
    const bookRental = bookRentalBuilder.buildCreateDTO();
    const response = await request(app.getHttpServer())
      .post(v1Route)
      .send(bookRental);
    expect(response.status).toBe(HttpStatus.NOT_FOUND);
  });

  it("Should respond 422 for invalid name", async () => {
    // Given a potentially valid book rental
    const bookRental = bookRentalBuilder
      .withBookItemId(createTestId(TableNameEnum.BookItem, 1))
      .buildCreateDTO();
    // and book is not available
    await executeTask(
      bookInfoRepository.save(
        new BookInfoBuilder(1)
          .withBookItems([
            {
              id: createTestId(TableNameEnum.BookItem, 1),
              status: BookItemStatusEnum.Rented,
              bookId: createTestId(TableNameEnum.BookInfo, 1),
            },
          ])
          .build(),
      ),
    );
    const response = await request(app.getHttpServer())
      .post(v1Route)
      .send(bookRental);
    expect(response.status).toBe(HttpStatus.CONFLICT);
  });

  it("Should respond 422 for invalid name type", async () => {
    const bookInfo = new BookInfoBuilder(2)
      .withName(unsafeCoerce(1))
      .buildCreateDTO();
    const response = await request(app.getHttpServer())
      .post(v1Route)
      .send(bookInfo);
    expect(response.status).toBe(422);
  });
});
