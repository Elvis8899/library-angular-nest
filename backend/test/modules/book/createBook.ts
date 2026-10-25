import { BookInfoRepository } from "@modules/book/database/bookInfo.repository.port";
import { priceToCents } from "@modules/book/database/priceColumn";
import { BookInfo } from "@modules/book/domain/bookInfo.entity";
import { PrismaService } from "@shared/prisma/prisma.service";
import { executeTask } from "@shared/utils/application/executeTask";
import { BookInfoBuilder } from "@test/modules/book/bookInfoBuilder";

/** Stores a built book with its copies, by default the builder's one
 * available copy, and returns it. */
export const createBook = async (
  prisma: PrismaService,
  builder: BookInfoBuilder = new BookInfoBuilder(),
): Promise<BookInfo> => {
  const book = builder.build();
  const { bookItems, price, ...bookInfo } = book;
  await prisma.bookInfo.create({
    data: {
      ...bookInfo,
      ...priceToCents(price),
      // The copies get their book's id from the nested create
      bookItems: { create: bookItems.map(({ bookId: _, ...item }) => item) },
    },
  });
  return book;
};

/** Stores a built book and its copies through the port, as the fake and
 * Prisma both take them (a save keeps a book's copies, it doesn't write
 * them), and returns it, its copies under its id like createBook's. */
export const seedBook = async (
  books: BookInfoRepository,
  built: BookInfo,
): Promise<BookInfo> => {
  const book = {
    ...built,
    bookItems: built.bookItems.map((item) => ({ ...item, bookId: built.id })),
  };
  await executeTask(books.save(book));
  for (const item of book.bookItems)
    await executeTask(books.createBookItem(item));
  return book;
};
