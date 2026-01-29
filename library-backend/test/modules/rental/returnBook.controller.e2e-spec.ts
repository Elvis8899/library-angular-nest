import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { Test, TestingModule } from "@nestjs/testing";
import { AppModule } from "@src/app.module";
import * as request from "supertest";

import { AuthGuard } from "@auth/guards/auth.guard";
import { BookItemStatusEnum } from "@book/domain/value-object/bookItem.entity";
import { HttpStatus } from "@nestjs/common";
import { BookRentalRepository } from "@rental/database/bookRental.repository.port";
import { RentalStatusEnum } from "@rental/domain/bookRental.entity";
import { FakeLoggerService } from "@shared/logger/adapters/fake/FakeLogger.service";
import { PrismaService } from "@shared/prisma/adapter/prisma.service";
import { executeTask } from "@shared/utils/application/executeTask";
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
let bookRentalRepository: BookRentalRepository;

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
  bookRentalRepository =
    testingModule.get<BookRentalRepository>(BookRentalRepository);
  await prismaService.bookInfo.deleteMany();
  await prismaService.user.deleteMany();

  const { bookItems: bookItemsRaw, ...bookInfo } = new BookInfoBuilder()
    .withBookItems([
      {
        id: createTestId(TableNameEnum.BookItem, 0),
        status: BookItemStatusEnum.Rented,
        bookId: createTestId(TableNameEnum.BookInfo, 0),
      },
      {
        id: createTestId(TableNameEnum.BookItem, 1),
        status: BookItemStatusEnum.Available,
        bookId: createTestId(TableNameEnum.BookInfo, 0),
      },
    ])
    .build();

  const bookItems = bookItemsRaw.map((bookItemRaw) => {
    const { bookId: _, ...bookItem } = bookItemRaw;
    return bookItem;
  });

  const {
    bookItem: _bookItem,
    user: _user,
    ...bookRental
  } = bookRentalBuilder.build();
  await prismaService.bookInfo.create({
    data: {
      ...bookInfo,
      bookItems: { createMany: { data: bookItems } },
    },
  });
  await prismaService.user.create({
    data: new UserBuilder().build(),
  });
  await prismaService.bookRentalDetails.create({
    data: bookRental,
  });
  await app.init();
  await app.getHttpAdapter().getInstance().ready();
});

beforeEach(() => {
  // await prismaService.bookRentalDetails.deleteMany();
  authGuardMock.reset();
});

afterAll(async () => {
  await app.close();
  await prismaService.$disconnect();
});

describe("[e2e] POST /v1/bookRentals/rent", () => {
  const v1Route = (id: string) => "/v1/bookRentals/return/" + id;

  it("Should respond 200 for a valid bookInfo", async () => {
    const response = await request(app.getHttpServer()).put(
      v1Route(createTestId(TableNameEnum.BookRentalDetails, 0)),
    );

    expect(response.status).toBe(HttpStatus.OK);
  });

  it("Should respond 404 for invalid bookStatus", async () => {
    // Given a potentially valid book rental
    const bookRental = bookRentalBuilder
      .withBookItemId(createTestId(TableNameEnum.BookItem, 1))
      .withStatus(RentalStatusEnum.Finished)
      .build();
    // and book is not available
    await executeTask(bookRentalRepository.save(bookRental));
    const response = await request(app.getHttpServer())
      .put(v1Route(createTestId(TableNameEnum.BookRentalDetails, 0)))
      .send(bookRental);
    expect(response.status).toBe(HttpStatus.NOT_FOUND);
  });

  it("Should respond 404 for invalid rental not in system", async () => {
    const bookInfo = new BookInfoBuilder(2)
      .withName(unsafeCoerce(1))
      .buildCreateDTO();
    const response = await request(app.getHttpServer())
      .put(v1Route(createTestId(TableNameEnum.BookRentalDetails, 0)))
      .send(bookInfo);
    expect(response.status).toBe(HttpStatus.NOT_FOUND);
  });
});
