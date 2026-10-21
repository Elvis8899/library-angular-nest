import { BookInfoRepository } from "@book/database/bookInfo.repository.port";
import {
  PaginatedBookInfosQuery,
  PaginatedBookInfosQueryHandler,
} from "@book/queries/paginatedBookInfos/paginatedBookInfos.query";
import { UnprocessableEntityException } from "@nestjs/common";
import { executeTask } from "@shared/utils/application/executeTask";
import { BookInfoBuilder } from "@test/dataBuilders/bookInfoBuilder";
import { createHandlerModule } from "@test/util/handlerModule";

//Adapters
let bookInfoRepository: BookInfoRepository;

describe("[Unit] List BookInfos", () => {
  let paginatedBookInfosQueryHandler: PaginatedBookInfosQueryHandler;

  beforeEach(async () => {
    const moduleRef = await createHandlerModule([
      PaginatedBookInfosQueryHandler,
    ]);

    bookInfoRepository = moduleRef.get<BookInfoRepository>(BookInfoRepository);
    paginatedBookInfosQueryHandler =
      moduleRef.get<PaginatedBookInfosQueryHandler>(
        PaginatedBookInfosQueryHandler,
      );
  });

  it("Should list bookInfos if query is valid", async () => {
    //Given a valid query
    const limit = 10;
    const page = 0;
    const query = new PaginatedBookInfosQuery({
      limit,
      page,
    });

    //With bookInfos in database
    const bookInfo = new BookInfoBuilder().build();
    await executeTask(bookInfoRepository.save(bookInfo));

    //When we list bookInfos
    const result = await paginatedBookInfosQueryHandler.execute(query);
    //Then it should show a list of bookInfos
    expect(result.data.length).toBe(1);
    expect(result.data[0]).toStrictEqual(bookInfo);
    expect(result.count).toBe(1);
    expect(result.page).toBe(page);
    expect(result.limit).toBe(limit);
  });

  it("Shouldnt list bookInfos if page is invalid", async () => {
    //Given a valid query
    const limit = 10;
    const page = 1;
    const query = new PaginatedBookInfosQuery({
      limit,
      page,
    });

    //With bookInfos in database
    const bookInfo = new BookInfoBuilder().build();
    await executeTask(bookInfoRepository.save(bookInfo));

    //When we list bookInfos
    const result = await paginatedBookInfosQueryHandler.execute(query);
    //Then it should show a list of bookInfos
    expect(result.data.length).toBe(0);
    expect(result.count).toBe(1);
    expect(result.page).toBe(page);
    expect(result.limit).toBe(limit);
  });

  describe("Searching by name", () => {
    const saveBooks = async () => {
      const book = (index: number, name: string) =>
        new BookInfoBuilder(index).withName(name).build();
      const domCasmurro = book(1, "Dom Casmurro");
      const cortico = book(2, "O Cortiço");
      await executeTask(bookInfoRepository.save(domCasmurro));
      await executeTask(bookInfoRepository.save(cortico));
      return { domCasmurro, cortico };
    };

    it("Should list only books whose name contains the search, ignoring case", async () => {
      //Given two books in database
      const { domCasmurro } = await saveBooks();

      //When we search for part of one name, in another case
      const result = await paginatedBookInfosQueryHandler.execute(
        new PaginatedBookInfosQuery(
          { limit: 10, page: 0 },
          { name: "  CASMURRO " },
        ),
      );

      //Then only that book is listed and counted
      expect(result.data).toStrictEqual([domCasmurro]);
      expect(result.count).toBe(1);
    });

    it("Should list every book when the search is blank", async () => {
      //Given two books in database
      await saveBooks();

      //When we search for spaces only
      const result = await paginatedBookInfosQueryHandler.execute(
        new PaginatedBookInfosQuery({ limit: 10, page: 0 }, { name: "   " }),
      );

      //Then no filter is applied
      expect(result.count).toBe(2);
    });

    it("Should reject a search longer than 200 characters", async () => {
      //When we search with a very long text
      const resultPromise = paginatedBookInfosQueryHandler.execute(
        new PaginatedBookInfosQuery(
          { limit: 10, page: 0 },
          { name: "a".repeat(201) },
        ),
      );

      //Then the query is rejected as invalid
      await expect(resultPromise).rejects.toBeInstanceOf(
        UnprocessableEntityException,
      );
    });
  });

  describe("Filtering by creation date", () => {
    const saveBooksCreatedOn = async () => {
      const book = (index: number, createdAt: string) =>
        new BookInfoBuilder(index).withCreatedAt(new Date(createdAt)).build();
      const books = {
        before: book(1, "2026-10-12T23:59:59.999Z"),
        start: book(2, "2026-10-13T00:00:00.000Z"),
        end: book(3, "2026-10-13T23:59:59.999Z"),
        after: book(4, "2026-10-14T00:00:00.000Z"),
      };
      for (const b of Object.values(books)) {
        await executeTask(bookInfoRepository.save(b));
      }
      return books;
    };

    it("Should list books created from the start, inclusive, to before the end", async () => {
      //Given books created around one day
      const books = await saveBooksCreatedOn();

      //When we list that day
      const result = await paginatedBookInfosQueryHandler.execute(
        new PaginatedBookInfosQuery(
          { limit: 10, page: 0 },
          {
            createdFrom: "2026-10-13T00:00:00.000Z",
            createdBefore: "2026-10-14T00:00:00.000Z",
            order: "asc",
          },
        ),
      );

      //Then only the books of that day are listed
      expect(result.data.map((b) => b.id)).toEqual([
        books.start.id,
        books.end.id,
      ]);
      expect(result.count).toBe(2);
    });

    it("Should reject a range that ends before it starts", async () => {
      const resultPromise = paginatedBookInfosQueryHandler.execute(
        new PaginatedBookInfosQuery(
          { limit: 10, page: 0 },
          {
            createdFrom: "2026-10-14T00:00:00.000Z",
            createdBefore: "2026-10-13T00:00:00.000Z",
          },
        ),
      );

      await expect(resultPromise).rejects.toBeInstanceOf(
        UnprocessableEntityException,
      );
    });

    it("Should reject a date that isn't a date", async () => {
      const resultPromise = paginatedBookInfosQueryHandler.execute(
        new PaginatedBookInfosQuery(
          { limit: 10, page: 0 },
          { createdFrom: "yesterday" },
        ),
      );

      await expect(resultPromise).rejects.toBeInstanceOf(
        UnprocessableEntityException,
      );
    });
  });

  describe("Sorting", () => {
    // Created in this order, with names out of order and one repeated
    const saveBooks = async () => {
      const book = (index: number, name: string) =>
        new BookInfoBuilder(index)
          .withName(name)
          .withCreatedAt(new Date(2026, 9, index))
          .build();
      const books = [
        book(1, "O Cortiço"),
        book(2, "Dom Casmurro"),
        book(3, "Iracema"),
        book(4, "Dom Casmurro"),
      ];
      for (const b of books) {
        await executeTask(bookInfoRepository.save(b));
      }
      return books.map((b) => b.id);
    };
    const list = (filters: { sortBy?: string; order?: string }) =>
      paginatedBookInfosQueryHandler
        .execute(new PaginatedBookInfosQuery({ limit: 10, page: 0 }, filters))
        .then((result) => result.data.map((b) => b.id));

    it("Should list the newest books first by default", async () => {
      const [first, second, third, fourth] = await saveBooks();

      expect(await list({})).toEqual([fourth, third, second, first]);
    });

    it("Should list the oldest books first in ascending order", async () => {
      const [first, second, third, fourth] = await saveBooks();

      expect(await list({ order: "asc" })).toEqual([
        first,
        second,
        third,
        fourth,
      ]);
    });

    it("Should sort by name, breaking ties by id", async () => {
      const [cortico, domCasmurro, iracema, domCasmurro2] = await saveBooks();

      expect(await list({ sortBy: "name", order: "asc" })).toEqual([
        domCasmurro,
        domCasmurro2,
        iracema,
        cortico,
      ]);
      expect(await list({ sortBy: "name", order: "desc" })).toEqual([
        cortico,
        iracema,
        domCasmurro,
        domCasmurro2,
      ]);
    });

    it.each([{ sortBy: "price" }, { order: "up" }])(
      "Should reject an unknown sort %o",
      async (filters) => {
        await expect(
          paginatedBookInfosQueryHandler.execute(
            new PaginatedBookInfosQuery({ limit: 10, page: 0 }, filters),
          ),
        ).rejects.toBeInstanceOf(UnprocessableEntityException);
      },
    );
  });

  it("Shouldnt list bookInfos if there isnt bookInfos", async () => {
    //Given a valid query and no bookInfos in database
    const limit = 10;
    const page = 0;
    const query = new PaginatedBookInfosQuery({
      limit,
      page,
    });

    //When we list bookInfos
    const result = await paginatedBookInfosQueryHandler.execute(query);
    //Then it should show an empty list
    expect(result.data.length).toBe(0);
    expect(result.count).toBe(0);
    expect(result.page).toBe(page);
    expect(result.limit).toBe(limit);
  });
});
