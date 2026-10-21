import { FPF } from "@shared/utils/application/monads";
import { createBook } from "@test/modules/book/createBook";
import { useE2eApp } from "@test/util/e2eApp";

import { BookItemStatusEnum } from "@modules/book/domain/bookItem.entity";
import { BookRentalRepository } from "@modules/rental/database/bookRental.repository.port";
import { RentalStatusEnum } from "@modules/rental/domain/bookRental.entity";
import { UserRoleEnum } from "@modules/user/domain/user.entity";
import { HttpStatus } from "@nestjs/common";
import { executeTask } from "@shared/utils/application/executeTask";
import { MockAuthGuardBuilder } from "@test/dataBuilders/mockAuthGuardBuilder";
import { UserBuilder } from "@test/dataBuilders/userBuilder";
import { BookInfoBuilder } from "@test/modules/book/bookInfoBuilder";
import { BookRentalBuilder } from "@test/modules/rental/bookRentalBuilder";
import { createTestId, TableNameEnum } from "@test/util/defaultIds";
let bookRentalRepository: BookRentalRepository;

const bookRentalBuilder = new BookRentalBuilder(0);
const authGuardMock = new MockAuthGuardBuilder();

const e2e = useE2eApp({ authGuard: authGuardMock.build() });

beforeAll(async () => {
  bookRentalRepository = e2e.get(BookRentalRepository);

  await createBook(
    e2e.prisma,
    new BookInfoBuilder().withBookItems([
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
    ]),
  );

  const {
    bookItem: _bookItem,
    user: _user,
    ...bookRental
  } = bookRentalBuilder.build();
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

  it("Should respond 409 for a rental already returned", async () => {
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
    expect(response.status).toBe(HttpStatus.CONFLICT);
    expect(response.body).toMatchObject({ code: "rental.finished" });
  });

  it("Should respond 404 for invalid rental not in system", async () => {
    const bookInfo = new BookInfoBuilder(2)
      .withName(FPF.unsafeCoerce(1))
      .buildCreateDTO();
    const response = await e2e
      .http()
      .put(v1Route(createTestId(TableNameEnum.BookRentalDetails, 99)))
      .send(bookInfo);
    expect(response.status).toBe(HttpStatus.NOT_FOUND);
    expect(response.body).toMatchObject({ code: "rental.notFound" });
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
