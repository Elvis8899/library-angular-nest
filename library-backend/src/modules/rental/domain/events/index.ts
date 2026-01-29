import { FPF } from "@shared/functional/monads";
import { BookRentalRentedEvent } from "@src/modules/rental/domain/events/bookRented.event";
import { BookRentalReturnedEvent } from "@src/modules/rental/domain/events/bookReturned.event";

export const AllRentalEvents = FPF.tuple(
  BookRentalReturnedEvent,
  BookRentalRentedEvent,
);
