import { BookInfoRepository } from "@modules/book/database/bookInfo.repository.port";
import { BookItemStatus } from "@modules/book/domain/bookItem.entity";
import { BookRentalRepository } from "@modules/rental/database/bookRental.repository.port";
import { RentalStatusEnum } from "@modules/rental/domain/bookRental.entity";
import {
  BookRentalFinishedException,
  BookRentalNotAvailableException,
} from "@modules/rental/domain/bookRental.errors";
import { UserRepository } from "@modules/user/database/user.repository.port";
import { executeTask } from "@shared/utils/application/executeTask";
import { O } from "@shared/utils/application/monads";
import { UserBuilder } from "@test/dataBuilders/userBuilder";
import { BookInfoBuilder } from "@test/modules/book/bookInfoBuilder";
import { seedBook } from "@test/modules/book/createBook";
import { BookRentalBuilder } from "@test/modules/rental/bookRentalBuilder";
import { createTestId, TableNameEnum } from "@test/util/defaultIds";
import { RepositoryKind, useRepositories } from "@test/util/repositoryContract";

/** What BookRentalRepository promises, for the fake and the Prisma one: a
 * rental is of a copy, by a user, and renting and returning change the
 * copy's status with it. */
export const bookRentalRepositoryContract = (kind: RepositoryKind) =>
  describe(`[Contract] BookRentalRepository (${kind})`, () => {
    const ctx = useRepositories(kind, (get) => ({
      rentals: get(BookRentalRepository),
      books: get(BookInfoRepository),
      users: get(UserRepository),
    }));
    // The builders' defaults: user 0 renting book 0's one copy
    const user = new UserBuilder().build();
    const book = new BookInfoBuilder().build();
    const bookItemId = createTestId(TableNameEnum.BookItem, 0);
    const rental = (index: number) => new BookRentalBuilder(index).build();
    const copyStatus = async () =>
      O.map(({ status }: { status: BookItemStatus }) => status)(
        await executeTask(ctx.books.findBookItemById(bookItemId)),
      );
    const page = (status?: RentalStatusEnum, userId?: string) =>
      executeTask(
        ctx.rentals.findAllPaginated({
          page: 0,
          limit: 10,
          offset: 0,
          query: { status, userId },
        }),
      ).then(({ count, data }) => ({ count, ids: data.map(({ id }) => id) }));

    beforeEach(async () => {
      await executeTask(ctx.users.save(user));
      await seedBook(ctx.books, book);
    });

    it("Should give a rental back every way, with its book's and user's names", async () => {
      const saved = rental(0);
      await executeTask(ctx.rentals.rent(saved));

      const [byId, listed, all] = await Promise.all([
        executeTask(ctx.rentals.findById(saved.id)),
        page(RentalStatusEnum.Rented),
        executeTask(ctx.rentals.findAll()),
      ]);

      const { createdAt: _, updatedAt: __, ...compared } = saved;
      expect(byId).toMatchObject(
        O.some({
          ...compared,
          bookItem: { book: { name: book.name, price: book.price } },
          user: { name: user.name },
        }),
      );
      expect(listed).toEqual({ count: 1, ids: [saved.id] });
      expect(all).toHaveLength(1);
    });

    it("Should list a user's rentals by status, newest first", async () => {
      const other = new UserBuilder(1)
        .withEmail("other@example.com")
        .withCPF("11144477735")
        .build();
      await executeTask(ctx.users.save(other));
      const older = {
        ...rental(1),
        rentalStatus: RentalStatusEnum.Finished,
        createdAt: new Date("2026-10-01T12:00:00Z"),
      };
      const newer = {
        ...rental(2),
        rentalStatus: RentalStatusEnum.Finished,
        createdAt: new Date("2026-10-02T12:00:00Z"),
      };
      const others = { ...rental(3), userId: other.id };
      for (const each of [older, newer, others])
        await executeTask(ctx.rentals.save(each));

      expect(
        await Promise.all([
          page(RentalStatusEnum.Finished, user.id),
          page(RentalStatusEnum.Rented),
          page(undefined, other.id),
        ]),
      ).toEqual([
        {
          count: 2,
          ids: [newer.id, older.id],
        },
        {
          count: 1,
          ids: [others.id],
        },
        {
          count: 1,
          ids: [others.id],
        },
      ]);
    });

    it("Should rent an available copy, marking it rented", async () => {
      await executeTask(ctx.rentals.rent(rental(0)));

      expect(await copyStatus()).toEqual(O.some(BookItemStatus.Rented));
    });

    it("Should refuse with 409 rental.unavailable a copy that is rented, or isn't there", async () => {
      await executeTask(ctx.rentals.rent(rental(0)));

      await expect(
        executeTask(ctx.rentals.rent(rental(1))),
      ).rejects.toBeInstanceOf(BookRentalNotAvailableException);
      await expect(
        executeTask(
          ctx.rentals.rent({
            ...rental(2),
            bookItemId: createTestId(TableNameEnum.BookItem, 9),
          }),
        ),
      ).rejects.toBeInstanceOf(BookRentalNotAvailableException);
      expect(await page()).toEqual({ count: 1, ids: [rental(0).id] });
    });

    it("Should let only one of two rents of the same copy at once through", async () => {
      const results = await Promise.allSettled([
        executeTask(ctx.rentals.rent(rental(0))),
        executeTask(ctx.rentals.rent(rental(1))),
      ]);

      expect(results.map(({ status }) => status).sort()).toEqual([
        "fulfilled",
        "rejected",
      ]);
      expect(
        results.find((result) => result.status === "rejected")?.reason,
      ).toBeInstanceOf(BookRentalNotAvailableException);
      expect((await page()).count).toBe(1);
    });

    it("Should leave the copy available when the rental can't be stored", async () => {
      // A user that isn't there
      const result = executeTask(
        ctx.rentals.rent({
          ...rental(0),
          userId: createTestId(TableNameEnum.User, 99),
        }),
      );

      await expect(result).rejects.toThrow();
      const [copyStatusNow, rentals] = await Promise.all([
        copyStatus(),
        page(),
      ]);
      expect(copyStatusNow).toEqual(O.some(BookItemStatus.Available));
      expect(rentals.count).toBe(0);
    });

    it("Should finish a rental with its delivery date, making the copy available", async () => {
      const rented = rental(0);
      await executeTask(ctx.rentals.rent(rented));
      const deliveryDate = new Date("2026-10-21T12:00:00Z");

      await executeTask(ctx.rentals.finish({ ...rented, deliveryDate }));

      const [copyStatusNow, storedRental] = await Promise.all([
        copyStatus(),
        executeTask(ctx.rentals.findById(rented.id)),
      ]);
      expect(copyStatusNow).toEqual(O.some(BookItemStatus.Available));
      expect(storedRental).toMatchObject(
        O.some({ rentalStatus: RentalStatusEnum.Finished, deliveryDate }),
      );
    });

    it("Should refuse with 409 rental.finished finishing a rental twice", async () => {
      const rented = rental(0);
      await executeTask(ctx.rentals.rent(rented));
      await executeTask(ctx.rentals.finish(rented));

      await expect(
        executeTask(ctx.rentals.finish(rented)),
      ).rejects.toBeInstanceOf(BookRentalFinishedException);
    });

    it("Should change a saved rental's status and dates only", async () => {
      const saved = rental(0);
      await executeTask(ctx.rentals.save(saved));
      const overdueDate = new Date("2026-11-01T12:00:00Z");

      await executeTask(
        ctx.rentals.save({
          ...saved,
          userId: createTestId(TableNameEnum.User, 99),
          rentalStatus: RentalStatusEnum.Finished,
          overdueDate,
        }),
      );

      expect(await executeTask(ctx.rentals.findById(saved.id))).toMatchObject(
        O.some({
          userId: user.id,
          rentalStatus: RentalStatusEnum.Finished,
          overdueDate,
        }),
      );
    });

    it("Should delete a rental, and fail on one that isn't there", async () => {
      const saved = rental(0);
      await executeTask(ctx.rentals.save(saved));

      await executeTask(ctx.rentals.deleteById(saved.id));
      await expect(
        executeTask(ctx.rentals.deleteById(saved.id)),
      ).rejects.toThrow();

      expect(await executeTask(ctx.rentals.findAll())).toEqual([]);
    });

    it("Should take a copy's rentals with it, and a user's", async () => {
      const finished = {
        ...rental(0),
        rentalStatus: RentalStatusEnum.Finished,
      };
      await executeTask(ctx.rentals.save(finished));

      await executeTask(ctx.books.deleteBookItem(bookItemId));
      expect(await executeTask(ctx.rentals.findAll())).toEqual([]);

      await seedBook(ctx.books, book);
      await executeTask(ctx.rentals.save(finished));
      await executeTask(ctx.users.deleteById(user.id));
      expect(await executeTask(ctx.rentals.findById(finished.id))).toEqual(
        O.none,
      );
    });

    it("Should find nothing when there is no rental", async () => {
      const [byId, listed, all] = await Promise.all([
        executeTask(ctx.rentals.findById(rental(0).id)),
        page(RentalStatusEnum.Rented),
        executeTask(ctx.rentals.findAll()),
      ]);

      expect(byId).toEqual(O.none);
      expect(listed).toEqual({ count: 0, ids: [] });
      expect(all).toEqual([]);
    });
  });
