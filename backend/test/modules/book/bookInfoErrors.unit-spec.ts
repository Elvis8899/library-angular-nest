import {
  availableBookItemNotFoundException,
  bookInfoNotFoundException,
} from "@modules/book/domain/bookInfo.errors";
import { HttpStatus } from "@nestjs/common";
import { itAnswersWithErrorCodes } from "@test/util/errorCodes";

describe("[Unit] Book error codes", () => {
  itAnswersWithErrorCodes([
    [
      "bookInfoNotFoundException",
      bookInfoNotFoundException,
      HttpStatus.NOT_FOUND,
      "Not Found",
      "book.notFound",
    ],
    [
      "availableBookItemNotFoundException",
      availableBookItemNotFoundException,
      HttpStatus.NOT_FOUND,
      "Not Found",
      "book.noAvailableCopy",
    ],
  ]);
});
