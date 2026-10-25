import {
  BookInfoRepository,
  BookInfoSort,
} from "@modules/book/database/bookInfo.repository.port";
import { BookInfo } from "@modules/book/domain/bookInfo.entity";
import { BookCoverChangedException } from "@modules/book/domain/bookInfo.errors";
import { BookItem, BookItemStatus } from "@modules/book/domain/bookItem.entity";
import { executeTask } from "@shared/utils/application/executeTask";
import { O } from "@shared/utils/application/monads";
import { BookInfoBuilder } from "@test/modules/book/bookInfoBuilder";
import { createTestId, TableNameEnum } from "@test/util/defaultIds";
import { RepositoryKind, useRepositories } from "@test/util/repositoryContract";

/** What BookInfoRepository promises, for the fake and the Prisma one. */
export const bookInfoRepositoryContract = (kind: RepositoryKind) =>
  describe(`[Contract] BookInfoRepository (${kind})`, () => {
    const ctx = useRepositories(kind, (get) => ({
      books: get(BookInfoRepository),
    }));
    const newestFirst: BookInfoSort = { by: "createdAt", order: "desc" };
    const saveBook = (book: BookInfo) => executeTask(ctx.books.save(book));
    const book = (index: number) =>
      new BookInfoBuilder(index).withBookItems([]).build();
    const item = (index: number, bookId: string): BookItem =>
      BookItem.parse({
        id: createTestId(TableNameEnum.BookItem, index),
        status: BookItemStatus.Available,
        bookId,
      });
    const page = (query: Parameters<typeof ctx.books.findAllPaginated>[0]) =>
      executeTask(ctx.books.findAllPaginated(query)).then((result) => ({
        count: result.count,
        ids: result.data.map(({ id }) => id),
      }));

    it("Should give a book back every way after saving", async () => {
      const saved = book(1);
      await saveBook(saved);

      const [byId, listed, all] = await Promise.all([
        executeTask(ctx.books.findById(saved.id)),
        page({ page: 0, limit: 10, offset: 0, query: { sort: newestFirst } }),
        executeTask(ctx.books.findAll()),
      ]);

      const { createdAt: _, updatedAt: __, ...compared } = saved;
      expect(byId).toMatchObject(O.some(compared));
      expect(listed).toEqual({ count: 1, ids: [saved.id] });
      expect(all).toHaveLength(1);
    });

    it("Should find books by part of their name, ignoring case", async () => {
      const named = (index: number, name: string) =>
        new BookInfoBuilder(index).withName(name).withBookItems([]).build();
      const domCasmurro = named(1, "Dom Casmurro");
      await saveBook(domCasmurro);
      await saveBook(named(2, "Memórias Póstumas"));
      await saveBook(named(3, "O Cortiço"));

      expect(
        await page({
          page: 0,
          limit: 10,
          offset: 0,
          query: { name: "CASM", sort: newestFirst },
        }),
      ).toEqual({ count: 1, ids: [domCasmurro.id] });
    });

    it("Should find books created in a time range, end excluded", async () => {
      const created = (index: number, createdAt: string) =>
        new BookInfoBuilder(index)
          .withCreatedAt(new Date(createdAt))
          .withBookItems([])
          .build();
      const start = created(2, "2026-10-13T03:00:00.000Z");
      const end = created(3, "2026-10-14T02:59:59.999Z");
      await saveBook(created(1, "2026-10-13T02:59:59.999Z"));
      await saveBook(start);
      await saveBook(end);
      await saveBook(created(4, "2026-10-14T03:00:00.000Z"));

      expect(
        await page({
          page: 0,
          limit: 10,
          offset: 0,
          query: {
            createdFrom: new Date("2026-10-13T03:00:00.000Z"),
            createdBefore: new Date("2026-10-14T03:00:00.000Z"),
            sort: { by: "createdAt", order: "asc" },
          },
        }),
      ).toEqual({ count: 2, ids: [start.id, end.id] });
    });

    it("Should sort books by name, breaking ties by id", async () => {
      const named = (index: number, name: string) =>
        new BookInfoBuilder(index).withName(name).withBookItems([]).build();
      const cortico = named(1, "O Cortiço");
      const domCasmurro = named(2, "Dom Casmurro");
      const iracema = named(3, "Iracema");
      const domCasmurro2 = named(4, "Dom Casmurro");
      for (const each of [cortico, domCasmurro, iracema, domCasmurro2])
        await saveBook(each);

      const list = (order: BookInfoSort["order"]) =>
        page({
          page: 0,
          limit: 10,
          offset: 0,
          query: { sort: { by: "name", order } },
        }).then(({ ids }) => ids);

      expect(await list("asc")).toEqual([
        domCasmurro.id,
        domCasmurro2.id,
        iracema.id,
        cortico.id,
      ]);
      expect(await list("desc")).toEqual([
        cortico.id,
        iracema.id,
        domCasmurro.id,
        domCasmurro2.id,
      ]);
    });

    it("Should keep a price to the centavo", async () => {
      const saved = new BookInfoBuilder().withPrice(12.5).build();
      await saveBook(saved);

      expect(await executeTask(ctx.books.findById(saved.id))).toMatchObject(
        O.some({ price: 12.5 }),
      );
    });

    it("Should change a saved book's name and price, keeping its copies and cover", async () => {
      const saved = book(1);
      const cover = createTestId(TableNameEnum.None, 1);
      await saveBook(saved);
      await executeTask(ctx.books.createBookItem(item(1, saved.id)));
      await executeTask(ctx.books.changeCover(saved.id, null, cover));

      // What a handler saves: the book as parsed, without its copies or cover
      await saveBook({ ...saved, name: "Novo nome", price: 49.9 });

      expect(await executeTask(ctx.books.findById(saved.id))).toMatchObject(
        O.some({
          name: "Novo nome",
          price: 49.9,
          cover,
          bookItems: [{ id: item(1, saved.id).id }],
        }),
      );
    });

    it("Should change a cover from the one the book holds, and refuse with 409 book.coverChanged otherwise", async () => {
      const saved = book(1);
      const first = createTestId(TableNameEnum.None, 1);
      const second = createTestId(TableNameEnum.None, 2);
      await saveBook(saved);

      await executeTask(ctx.books.changeCover(saved.id, null, first));
      // Another upload that read no cover, then a book that isn't there
      await expect(
        executeTask(ctx.books.changeCover(saved.id, null, second)),
      ).rejects.toBeInstanceOf(BookCoverChangedException);
      await expect(
        executeTask(ctx.books.changeCover(book(2).id, null, second)),
      ).rejects.toBeInstanceOf(BookCoverChangedException);
      await executeTask(ctx.books.changeCover(saved.id, first, null));

      expect(await executeTask(ctx.books.findById(saved.id))).toMatchObject(
        O.some({ cover: null }),
      );
    });

    it("Should delete a book, and fail on one that isn't there", async () => {
      const saved = book(1);
      await saveBook(saved);

      await executeTask(ctx.books.deleteById(saved.id));
      await expect(
        executeTask(ctx.books.deleteById(saved.id)),
      ).rejects.toThrow();

      expect(await executeTask(ctx.books.findAll())).toEqual([]);
    });

    it("Should find nothing when there is no book", async () => {
      const [byId, listed, all] = await Promise.all([
        executeTask(ctx.books.findById(createTestId(TableNameEnum.None, 0))),
        page({ page: 0, limit: 10, offset: 0, query: { sort: newestFirst } }),
        executeTask(ctx.books.findAll()),
      ]);

      expect(byId).toEqual(O.none);
      expect(listed).toEqual({ count: 0, ids: [] });
      expect(all).toEqual([]);
    });

    it("Should add a copy to a book, find it and remove it", async () => {
      const saved = book(1);
      await saveBook(saved);
      const copy = item(1, saved.id);

      await executeTask(ctx.books.createBookItem(copy));
      const found = await executeTask(ctx.books.findBookItemById(copy.id));
      await executeTask(ctx.books.deleteBookItem(copy.id));

      expect(found).toMatchObject(
        O.some({ id: copy.id, status: copy.status, bookId: saved.id }),
      );
      expect(await executeTask(ctx.books.findBookItemById(copy.id))).toEqual(
        O.none,
      );
      expect(await executeTask(ctx.books.findById(saved.id))).toMatchObject(
        O.some({ bookItems: [] }),
      );
    });

    it("Should refuse a copy whose id another copy has", async () => {
      const saved = book(1);
      await saveBook(saved);
      await executeTask(ctx.books.createBookItem(item(1, saved.id)));

      await expect(
        executeTask(ctx.books.createBookItem(item(1, saved.id))),
      ).rejects.toThrow();
    });

    it("Should refuse a copy of a book that isn't there, and removing a copy that isn't", async () => {
      await expect(
        executeTask(
          ctx.books.createBookItem(
            item(1, createTestId(TableNameEnum.BookInfo, 9)),
          ),
        ),
      ).rejects.toThrow();
      await expect(
        executeTask(
          ctx.books.deleteBookItem(createTestId(TableNameEnum.BookItem, 9)),
        ),
      ).rejects.toThrow();
    });
  });
