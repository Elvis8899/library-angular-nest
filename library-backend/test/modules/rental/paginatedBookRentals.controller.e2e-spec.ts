import { HttpStatus } from "@nestjs/common";
import { BookRentalRepository } from "@rental/database/bookRental.repository.port";
import { executeTask } from "@shared/utils/application/executeTask";
import { BookRentalBuilder } from "@test/dataBuilders/bookRentalBuilder";
import { MockAuthGuardBuilder } from "@test/dataBuilders/mockAuthGuardBuilder";
import { UserBuilder } from "@test/dataBuilders/userBuilder";
import { createBook } from "@test/util/createBook";
import { createTestId, TableNameEnum } from "@test/util/defaultIds";
import { useE2eApp } from "@test/util/e2eApp";
import { UserRoleEnum } from "@user/domain/user.entity";

const authGuardMock = new MockAuthGuardBuilder();

let bookRentalRepository: BookRentalRepository;
const e2e = useE2eApp({ authGuard: authGuardMock.build() });

beforeAll(async () => {
  bookRentalRepository = e2e.get(BookRentalRepository);

  await createBook(e2e.prisma);
  await e2e.prisma.user.create({
    data: new UserBuilder().build(),
  });
});

beforeEach(async () => {
  authGuardMock.reset();
  await e2e.prisma.bookRentalDetails.deleteMany();
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

    const response = await e2e.http().get(v1Route).query({
      limit: 10,
      page: 0,
    });
    expect(response.status).toBe(HttpStatus.OK);
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

    const response = await e2e.http().get(v1Route).query({
      limit: 10,
      page: 0,
    });
    expect(response.status).toBe(HttpStatus.OK);
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

    const response = await e2e.http().get(v1Route).query({
      limit: 10,
      page: 0,
    });
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body?.count).toBe(0);
    expect(response.body?.data?.length).toBe(0);
  });

  it("Should respond 200 with empty list", async () => {
    const response = await e2e.http().get(v1Route).query({
      limit: 100,
      page: 1,
    });
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.body?.count).toBe(0);
  });
});
