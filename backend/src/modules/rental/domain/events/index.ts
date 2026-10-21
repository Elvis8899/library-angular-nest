import { BookRentalRentedEvent } from "@modules/rental/domain/events/bookRented.event";
import { BookRentalReturnedEvent } from "@modules/rental/domain/events/bookReturned.event";
import { FPF } from "@shared/utils/application/monads";

export const AllRentalEvents = FPF.tuple(
  BookRentalReturnedEvent,
  BookRentalRentedEvent,
);
