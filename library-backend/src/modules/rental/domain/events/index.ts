import { FPF } from "@src/shared/functional/monads";
import { BookRentalReturnedEvent } from "./bookReturned.event";
import { BookRentalRentedEvent } from "./bookRented.event";

export const AllRentalEvents = FPF.tuple(
  BookRentalReturnedEvent,
  BookRentalRentedEvent,
);
