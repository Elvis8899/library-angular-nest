import { FPF } from "@shared/utils/application/monads";
import { useE2eApp } from "@test/util/e2eApp";

import { BookItemStatusEnum } from "@book/domain/valueObject/bookItem.entity";
import { HttpStatus } from "@nestjs/common";
import { BookRentalRepository } from "@rental/database/bookRental.repository.port";
import { RentalStatusEnum } from "@rental/domain/bookRental.entity";
import { executeTask } from "@shared/utils/application/executeTask";
import { BookInfoBuilder } from "@test/dataBuilders/bookInfoBuilder";
import { BookRentalBuilder } from "@test/dataBuilders/bookRentalBuilder";
import { MockAuthGuardBuilder } from "@test/dataBuilders/mockAuthGuardBuilder";
import { UserBuilder } from "@test/dataBuilders/userBuilder";
import { createTestId, TableNameEnum } from "@test/util/defaultIds";
import { UserRoleEnum } from "@user/domain/user.entity";
let bookRentalRepository: BookRentalRepository;

const bookRentalBuilder = new BookRentalBuilder(0);
const authGuardMock = new MockAuthGuardBuilder();

const e2e = useE2eApp({ authGuard: authGuardMock.build() });

beforeAll(async () => {
  bookRentalRepository =
    e2e.module.get<BookRentalRepository>(BookRentalRepository);

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
  await e2e.prisma.bookInfo.create({
    data: {
      ...bookInfo,
      bookItems: { createMany: { data: bookItems } },
    },
  });
  await e2e.prisma.user.create({
    data: new UserBuilder().build(),
  });
  await e2e.prisma.bookRentalDetails.create({
    data: bookRental,
  });
});

beforeEach(() => {
  authGuardMock.reset();
});

describe("[e2e] POST /v1/bookRentals/rent", () => {
  const v1Route = (id: string) => "/v1/bookRentals/return/" + id;

  it("Should respond 404 when a client returns another user's rental", async () => {
    // Given a client who does not own the rental
    authGuardMock
      .withRole(UserRoleEnum.Client)
      .withSub(createTestId(TableNameEnum.User, 5));

    const response = await e2e
      .http()
      .put(v1Route(createTestId(TableNameEnum.BookRentalDetails, 0)));

    // Then it is reported as not found and the rental stays active
    expect(response.status).toBe(HttpStatus.NOT_FOUND);
    const rental = await e2e.prisma.bookRentalDetails.findUnique({
      where: { id: createTestId(TableNameEnum.BookRentalDetails, 0) },
    });
    expect(rental?.rentalStatus).toBe(RentalStatusEnum.Rented);
  });

  it("Should respond 200 for a valid bookInfo", async () => {
    const response = await e2e
      .http()
      .put(v1Route(createTestId(TableNameEnum.BookRentalDetails, 0)));

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
    const response = await e2e
      .http()
      .put(v1Route(createTestId(TableNameEnum.BookRentalDetails, 0)))
      .send(bookRental);
    expect(response.status).toBe(HttpStatus.NOT_FOUND);
  });

  it("Should respond 404 for invalid rental not in system", async () => {
    const bookInfo = new BookInfoBuilder(2)
      .withName(FPF.unsafeCoerce(1))
      .buildCreateDTO();
    const response = await e2e
      .http()
      .put(v1Route(createTestId(TableNameEnum.BookRentalDetails, 0)))
      .send(bookInfo);
    expect(response.status).toBe(HttpStatus.NOT_FOUND);
  });

  it("Should respond 200 when a client returns their own rental", async () => {
    // Given an active rental owned by the client
    const ownRental = new BookRentalBuilder(1)
      .withBookItemId(createTestId(TableNameEnum.BookItem, 1))
      .build();
    await executeTask(bookRentalRepository.rent(ownRental));
    authGuardMock
      .withRole(UserRoleEnum.Client)
      .withSub(createTestId(TableNameEnum.User, 0));

    const response = await e2e.http().put(v1Route(ownRental.id));

    expect(response.status).toBe(HttpStatus.OK);
  });
});
