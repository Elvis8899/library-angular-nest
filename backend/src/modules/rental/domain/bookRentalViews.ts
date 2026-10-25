import { BookRental as BookRentalContract, Sent } from "@library/contracts";
import { BookRentalDetails } from "@modules/rental/domain/bookRental.entity";

/** A rental as the API sends it: the names of its book and user, and its
 * fines until today. */
export const toBookRentalResponse = (
  rental: BookRentalDetails,
): Sent<typeof BookRentalContract> => ({
  id: rental.id,
  bookItemId: rental.bookItemId,
  userId: rental.userId,
  userName: rental.userName,
  bookName: rental.bookName,
  rentalStatus: rental.rentalStatus,
  overdueDate: rental.overdueDate,
  deliveryDate: rental.deliveryDate ?? null,
  fines: rental.fines,
  createdAt: rental.createdAt,
  updatedAt: rental.updatedAt,
});
