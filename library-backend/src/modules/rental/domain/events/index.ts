import { BookRentalRentedEvent } from "@rental/domain/events/bookRented.event";
import { BookRentalReturnedEvent } from "@rental/domain/events/bookReturned.event";
import { FPF } from "@shared/utils/application/monads";

export const AllRentalEvents = FPF.tuple(
  BookRentalReturnedEvent,
  BookRentalRentedEvent,
);
