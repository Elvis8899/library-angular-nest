import { RentalStatusEnum } from "@modules/rental/domain/bookRental.entity";
import { PrismaService } from "@shared/prisma/prisma.service";
import { createBook } from "@test/modules/book/createBook";
import { createTestId, TableNameEnum } from "@test/util/defaultIds";

/** Stores a book with one item and a rental of it by the user. Clean up with
 * bookInfo.deleteMany(): the items and the rentals cascade. */
export const createRental = async (
  prisma: PrismaService,
  userId: string,
  rentalStatus: RentalStatusEnum,
): Promise<void> => {
  await createBook(prisma);
  // The builder's one copy
  const bookItemId = createTestId(TableNameEnum.BookItem, 0);
  await prisma.bookRentalDetails.create({
    data: {
      id: createTestId(TableNameEnum.BookRentalDetails, 0),
      rentalStatus,
      bookItemId,
      userId,
      overdueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
};
