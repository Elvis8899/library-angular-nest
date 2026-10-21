import { FPF } from "@shared/utils/application/monads";
import { createBook } from "@test/modules/book/createBook";
import { useE2eApp } from "@test/util/e2eApp";

import { BookInfoRepository } from "@modules/book/database/bookInfo.repository.port";
import { BookItemStatusEnum } from "@modules/book/domain/bookItem.entity";
import { UserRoleEnum } from "@modules/user/domain/user.entity";
import { HttpStatus } from "@nestjs/common";
import { executeTask } from "@shared/utils/application/executeTask";
import { MockAuthGuardBuilder } from "@test/dataBuilders/mockAuthGuardBuilder";
import { UserBuilder } from "@test/dataBuilders/userBuilder";
import { BookInfoBuilder } from "@test/modules/book/bookInfoBuilder";
import { BookRentalBuilder } from "@test/modules/rental/bookRentalBuilder";
import { createTestId, TableNameEnum } from "@test/util/defaultIds";
let bookInfoRepository: BookInfoRepository;

const bookRentalBuilder = new BookRentalBuilder(0);
const authGuardMock = new MockAuthGuardBuilder();

const e2e = useE2eApp({ authGuard: authGuardMock.build() });

beforeAll(async () => {
  bookInfoRepository = e2e.get(BookInfoRepository);

  await createBook(e2e.prisma);
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

  it("Should respond 409 if the book item is already rented", async () => {
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

  it.each([
    { invalid: "a missing book item id", bookItemId: undefined },
    {
      invalid: "a book item id that isn't a string",
      bookItemId: FPF.unsafeCoerce<number, string>(1),
    },
  ])("Should respond 422 for $invalid", async ({ bookItemId }) => {
    const { userId } = bookRentalBuilder.buildCreateDTO();
    const bookRental = { userId, bookItemId };
    const response = await e2e.http().post(v1Route).send(bookRental);
    expect(response.status).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
  });
});
