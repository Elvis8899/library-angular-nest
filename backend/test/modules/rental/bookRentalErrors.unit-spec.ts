import {
  bookRentalFinishedException,
  bookRentalNotAvailableException,
  bookRentalNotFoundException,
} from "@modules/rental/domain/bookRental.errors";
import { HttpStatus } from "@nestjs/common";
import { itAnswersWithErrorCodes } from "@test/util/errorCodes";

describe("[Unit] Rental error codes", () => {
  itAnswersWithErrorCodes([
    [
      "bookRentalNotFoundException",
      bookRentalNotFoundException,
      HttpStatus.NOT_FOUND,
      "Not Found",
      "rental.notFound",
    ],
    [
      "bookRentalFinishedException",
      bookRentalFinishedException,
      HttpStatus.CONFLICT,
      "Conflict",
      "rental.finished",
    ],
    [
      "bookRentalNotAvailableException",
      bookRentalNotAvailableException,
      HttpStatus.CONFLICT,
      "Conflict",
      "rental.unavailable",
    ],
  ]);
});
