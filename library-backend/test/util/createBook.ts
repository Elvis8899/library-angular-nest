import { BookInfo } from "@modules/book/domain/bookInfo.entity";
import { PrismaService } from "@shared/prisma/prisma.service";
import { BookInfoBuilder } from "@test/dataBuilders/bookInfoBuilder";

/** Stores a built book with its copies, by default the builder's one
 * available copy, and returns it. */
export const createBook = async (
  prisma: PrismaService,
  builder: BookInfoBuilder = new BookInfoBuilder(),
): Promise<BookInfo> => {
  const book = builder.build();
  const { bookItems, ...bookInfo } = book;
  await prisma.bookInfo.create({
    data: {
      ...bookInfo,
      // The copies get their book's id from the nested create
      bookItems: { create: bookItems.map(({ bookId: _, ...item }) => item) },
    },
  });
  return book;
};
