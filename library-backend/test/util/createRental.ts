import { BookItem } from "@book/domain/valueObject/bookItem.entity";
import { RentalStatusEnum } from "@rental/domain/bookRental.entity";
import { PrismaService } from "@shared/prisma/adapter/prisma.service";
import { BookInfoBuilder } from "@test/dataBuilders/bookInfoBuilder";
import { createTestId, TableNameEnum } from "@test/util/defaultIds";

/** Stores a book with one item and a rental of it by the user. Clean up with
 * bookInfo.deleteMany(): the items and the rentals cascade. */
export const createRental = async (
  prisma: PrismaService,
  userId: string,
  rentalStatus: RentalStatusEnum,
): Promise<void> => {
  const { bookItems, ...bookInfo } = new BookInfoBuilder().build();
  const [bookItem] = bookItems as [BookItem];
  await prisma.bookInfo.create({
    data: { ...bookInfo, bookItems: { create: { id: bookItem.id } } },
  });
  await prisma.bookRentalDetails.create({
    data: {
      id: createTestId(TableNameEnum.BookRentalDetails, 0),
      rentalStatus,
      bookItemId: bookItem.id,
      userId,
      overdueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
};
