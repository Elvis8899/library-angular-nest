import { FPF } from "@shared/utils/application/monads";
import { useE2eApp } from "@test/util/e2eApp";

import { BookInfoRepository } from "@book/database/bookInfo.repository.port";
import {
  BookItem,
  BookItemStatusEnum,
} from "@book/domain/valueObject/bookItem.entity";
import { HttpStatus } from "@nestjs/common";
import { executeTask } from "@shared/utils/application/executeTask";
import { BookInfoBuilder } from "@test/dataBuilders/bookInfoBuilder";
import { BookRentalBuilder } from "@test/dataBuilders/bookRentalBuilder";
import { MockAuthGuardBuilder } from "@test/dataBuilders/mockAuthGuardBuilder";
import { UserBuilder } from "@test/dataBuilders/userBuilder";
import { createTestId, TableNameEnum } from "@test/util/defaultIds";
import { UserRoleEnum } from "@user/domain/user.entity";
let bookInfoRepository: BookInfoRepository;

const bookRentalBuilder = new BookRentalBuilder(0);
const authGuardMock = new MockAuthGuardBuilder();

const e2e = useE2eApp({ authGuard: authGuardMock.build() });

beforeAll(async () => {
  bookInfoRepository = e2e.module.get<BookInfoRepository>(BookInfoRepository);

  const {
    bookItems: [bookItemRaw],
    ...bookInfo
  } = new BookInfoBuilder().build();
  const { bookId: _, ...bookItem }: BookItem = FPF.unsafeCoerce(bookItemRaw);
  await e2e.prisma.bookInfo.create({
    data: { ...bookInfo, bookItems: { create: { ...bookItem } } },
  });
  await e2e.prisma.user.create({
    data: new UserBuilder().build(),
  });
});

beforeEach(async () => {
  await e2e.prisma.bookRentalDetails.deleteMany();
  authGuardMock.reset();
});

describe("[e2e] POST /v1/bookRentals/rent", () => {
  const v1Route = "/v1/bookRentals/rent";

  it("Should respond 201 for a valid bookInfo", async () => {
    const bookRental = bookRentalBuilder.buildCreateDTO();
    const response = await e2e.http().post(v1Route).send(bookRental);
    expect(response.status).toBe(HttpStatus.CREATED);
  });

  it("Should respond 404 if user is client and id doesnt match", async () => {
    authGuardMock
      .withSub(createTestId(TableNameEnum.User, 2))
      .withRole(UserRoleEnum.Client);
    const bookRental = bookRentalBuilder.buildCreateDTO();
    const response = await e2e.http().post(v1Route).send(bookRental);
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
    const response = await e2e.http().post(v1Route).send(bookRental);
    expect(response.status).toBe(HttpStatus.CONFLICT);
  });

  it("Should respond 422 for invalid name type", async () => {
    const bookInfo = new BookInfoBuilder(2)
      .withName(FPF.unsafeCoerce(1))
      .buildCreateDTO();
    const response = await e2e.http().post(v1Route).send(bookInfo);
    expect(response.status).toBe(422);
  });
});
