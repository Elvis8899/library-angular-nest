import {
  ChangeBookCover,
  ChangeBookCoverHandler,
} from "@modules/book/commands/changeBookCover/changeBookCover.command";
import {
  DeleteBookInfo,
  DeleteBookInfoHandler,
} from "@modules/book/commands/deleteBookInfo/deleteBookInfo.command";
import {
  RemoveBookCover,
  RemoveBookCoverHandler,
} from "@modules/book/commands/removeBookCover/removeBookCover.command";
import { FakeBookInfoRepository } from "@modules/book/database/fakeBookInfo.repository";
import { coverKey, coverTypeOf } from "@modules/book/domain/bookCover";
import {
  BookCoverChangedException,
  BookCoverNotFoundException,
  BookCoverTooLargeException,
  BookCoverTypeException,
  BookInfoNotFoundException,
} from "@modules/book/domain/bookInfo.errors";
import {
  BookCoverQuery,
  BookCoverQueryHandler,
} from "@modules/book/queries/bookCover/bookCover.query";
import { UnprocessableEntityException } from "@nestjs/common";
import { FakeAuditLog } from "@shared/audit/fakeAuditLog";
import { FakeFileStorage } from "@shared/storage/fakeFileStorage";
import { FileType } from "@shared/storage/fileType";
import { executeTask } from "@shared/utils/application/executeTask";
import { E, TE } from "@shared/utils/application/monads";
import { BookInfoBuilder } from "@test/modules/book/bookInfoBuilder";
import { seedBook } from "@test/modules/book/createBook";
import { createTestId, TableNameEnum } from "@test/util/defaultIds";
import { useHandlerModule } from "@test/util/handlerModule";

const png = Buffer.from("\x89PNG\r\n\x1a\n cover", "latin1");
const upload = (body = png, truncated = false) => ({
  fields: {},
  name: "capa.png",
  body,
  truncated,
});
const oldCover = createTestId(TableNameEnum.None, 1);

describe("[Unit] Book cover rules", () => {
  it("Should take a cover's type from its bytes, refusing other files and one past the limit", () => {
    expect(coverTypeOf(upload())).toEqual(E.right(FileType.Png));
    expect(coverTypeOf(upload(Buffer.from("%PDF-1.7")))).toEqual(
      E.left(new BookCoverTypeException()),
    );
    expect(coverTypeOf(upload(Buffer.alloc(0)))).toEqual(
      E.left(new BookCoverTypeException()),
    );
    expect(coverTypeOf(upload(png, true))).toEqual(
      E.left(new BookCoverTooLargeException()),
    );
  });
});

describe("[Unit] Book covers", () => {
  const ctx = useHandlerModule(
    {
      providers: [
        ChangeBookCoverHandler,
        RemoveBookCoverHandler,
        BookCoverQueryHandler,
        DeleteBookInfoHandler,
      ],
    },
    (get) => ({
      change: get(ChangeBookCoverHandler),
      remove: get(RemoveBookCoverHandler),
      cover: get(BookCoverQueryHandler),
      deleteBook: get(DeleteBookInfoHandler),
      books: get(FakeBookInfoRepository),
      files: get(FakeFileStorage),
      audit: get(FakeAuditLog),
    }),
  );
  const book = new BookInfoBuilder().build();
  const stored = () =>
    executeTask(ctx.books.findById(book.id)).then((found) =>
      found._tag === "Some" ? found.value.cover : undefined,
    );

  beforeEach(async () => {
    await seedBook(ctx.books, book);
  });

  it("Should store an uploaded cover under a new version and serve it", async () => {
    await ctx.change.execute(new ChangeBookCover(book.id, upload()));

    const cover = await stored();
    expect(cover).toEqual(expect.any(String));
    expect([...ctx.files.files.keys()]).toEqual([
      coverKey(book.id, cover ?? ""),
    ]);
    expect(await ctx.cover.execute(new BookCoverQuery(book.id))).toEqual({
      body: png,
      contentType: FileType.Png,
    });
    // Audited without the bytes
    expect(ctx.audit.entries.at(-1)).toMatchObject({
      useCase: "ChangeBookCover",
      recordId: book.id,
      input: { id: book.id, name: "capa.png", size: png.length },
    });
  });

  it("Should remove the version a new cover replaces", async () => {
    await ctx.change.execute(new ChangeBookCover(book.id, upload()));
    const first = await stored();

    await ctx.change.execute(new ChangeBookCover(book.id, upload()));

    const second = await stored();
    expect(second).not.toEqual(first);
    expect([...ctx.files.files.keys()]).toEqual([
      coverKey(book.id, second ?? ""),
    ]);
  });

  it("Should refuse a file that isn't an image, or a book that isn't there, storing nothing", async () => {
    await expect(
      ctx.change.execute(
        new ChangeBookCover(book.id, upload(Buffer.from("PK\x03\x04"))),
      ),
    ).rejects.toBeInstanceOf(BookCoverTypeException);
    await expect(
      ctx.change.execute(
        new ChangeBookCover(createTestId(TableNameEnum.BookInfo, 9), upload()),
      ),
    ).rejects.toBeInstanceOf(BookInfoNotFoundException);
    await expect(
      ctx.change.execute(new ChangeBookCover("x", upload())),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    expect(ctx.files.files.size).toBe(0);
  });

  it("Should remove the stored file when another cover came first", async () => {
    // Another upload changes the cover between the read and the write
    const changeCover = ctx.books.changeCover;
    ctx.books.changeCover = () => TE.left(new BookCoverChangedException());

    await expect(
      ctx.change.execute(new ChangeBookCover(book.id, upload())),
    ).rejects.toBeInstanceOf(BookCoverChangedException);

    ctx.books.changeCover = changeCover;
    expect(ctx.files.files.size).toBe(0);
  });

  it("Should take a cover off, removing its file", async () => {
    await ctx.change.execute(new ChangeBookCover(book.id, upload()));

    await ctx.remove.execute(new RemoveBookCover(book.id));

    expect(await stored()).toBeNull();
    expect(ctx.files.files.size).toBe(0);
    await expect(
      ctx.remove.execute(new RemoveBookCover(book.id)),
    ).rejects.toBeInstanceOf(BookCoverNotFoundException);
    await expect(
      ctx.cover.execute(new BookCoverQuery(book.id)),
    ).rejects.toBeInstanceOf(BookCoverNotFoundException);
  });

  it("Should answer 404 for a cover whose file is gone, or a book that isn't there", async () => {
    await executeTask(ctx.books.changeCover(book.id, null, oldCover));

    await expect(
      ctx.cover.execute(new BookCoverQuery(book.id)),
    ).rejects.toBeInstanceOf(BookCoverNotFoundException);
    await expect(
      ctx.cover.execute(
        new BookCoverQuery(createTestId(TableNameEnum.BookInfo, 9)),
      ),
    ).rejects.toBeInstanceOf(BookInfoNotFoundException);
    await expect(
      ctx.remove.execute(
        new RemoveBookCover(createTestId(TableNameEnum.BookInfo, 9)),
      ),
    ).rejects.toBeInstanceOf(BookInfoNotFoundException);
  });

  it("Should remove a deleted book's cover", async () => {
    await ctx.change.execute(new ChangeBookCover(book.id, upload()));

    await ctx.deleteBook.execute(new DeleteBookInfo(book.id));

    expect(ctx.files.files.size).toBe(0);
  });
});
