import type { BookRental, RentBookRequest } from "@library/contracts";
import { RentalStatus } from "@library/contracts";

// The API's shapes and values, under the names the screens use
export const BookRentalStatusEnum = RentalStatus;
export type BookRentalStatusEnum = RentalStatus;
export type BookRentEntity = RentBookRequest;
export type BookRentalEntity = BookRental;
