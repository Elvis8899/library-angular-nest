import {
  availableBookItemNotFoundException,
  bookCoverChangedException,
  bookCoverNotFoundException,
  bookCoverTooLargeException,
  bookCoverTypeException,
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
    [
      "bookCoverNotFoundException",
      bookCoverNotFoundException,
      HttpStatus.NOT_FOUND,
      "Not Found",
      "book.coverNotFound",
    ],
    [
      "bookCoverTypeException",
      bookCoverTypeException,
      HttpStatus.UNPROCESSABLE_ENTITY,
      "Unprocessable Entity",
      "book.coverType",
    ],
    [
      "bookCoverTooLargeException",
      bookCoverTooLargeException,
      HttpStatus.UNPROCESSABLE_ENTITY,
      "Unprocessable Entity",
      "book.coverTooLarge",
    ],
    [
      "bookCoverChangedException",
      bookCoverChangedException,
      HttpStatus.CONFLICT,
      "Conflict",
      "book.coverChanged",
    ],
  ]);
});
