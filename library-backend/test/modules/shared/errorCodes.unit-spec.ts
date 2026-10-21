import {
  invalidRefreshTokenException,
  wrongAuthException,
} from "@auth/domain/auth.errors";
import {
  availableBookItemNotFoundException,
  bookInfoNotFoundException,
} from "@book/domain/bookInfo.errors";
import { HttpException, HttpStatus } from "@nestjs/common";
import {
  bookRentalFinishedException,
  bookRentalNotAvailableException,
  bookRentalNotFoundException,
} from "@rental/domain/bookRental.errors";
import { unknownException } from "@shared/utils/domain/shared.errors";
import {
  userCPFAlreadyExistsException,
  userEmailAlreadyExistsException,
  userNotFoundException,
} from "@user/domain/user.errors";

// The frontend translates errors by code (errors.<code> in its pt-BR.ts), and
// its translationKeys.spec.ts checks every code here has a translation
type Case = [
  name: string,
  createException: () => HttpException,
  statusCode: number,
  error: string,
  code: string,
];

const cases: Case[] = [
  [
    "wrongAuthException",
    wrongAuthException,
    HttpStatus.UNAUTHORIZED,
    "Unauthorized",
    "auth.wrongCredentials",
  ],
  [
    "invalidRefreshTokenException",
    invalidRefreshTokenException,
    HttpStatus.UNAUTHORIZED,
    "Unauthorized",
    "auth.sessionExpired",
  ],
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
    "bookRentalNotFoundException",
    bookRentalNotFoundException,
    HttpStatus.NOT_FOUND,
    "Not Found",
    "rental.notFound",
  ],
  [
    "bookRentalFinishedException",
    bookRentalFinishedException,
    HttpStatus.NOT_FOUND,
    "Not Found",
    "rental.finished",
  ],
  [
    "bookRentalNotAvailableException",
    bookRentalNotAvailableException,
    HttpStatus.CONFLICT,
    "Conflict",
    "rental.unavailable",
  ],
  [
    "userCPFAlreadyExistsException",
    userCPFAlreadyExistsException,
    HttpStatus.CONFLICT,
    "Conflict",
    "user.cpfTaken",
  ],
  [
    "userNotFoundException",
    userNotFoundException,
    HttpStatus.NOT_FOUND,
    "Not Found",
    "user.notFound",
  ],
  [
    "userEmailAlreadyExistsException",
    userEmailAlreadyExistsException,
    HttpStatus.CONFLICT,
    "Conflict",
    "user.emailTaken",
  ],
  [
    "unknownException",
    () => unknownException(new Error("connection lost")),
    HttpStatus.INTERNAL_SERVER_ERROR,
    "Internal Server Error",
    "unknown",
  ],
];

describe("[Unit] Domain error codes", () => {
  it.each(cases)(
    "%s answers %i %s with the code %s",
    (_name, createException, statusCode, error, code) => {
      const exception = createException();

      expect(exception.getStatus()).toBe(statusCode);
      // The message stays readable for other clients
      expect(exception.getResponse()).toMatchObject({
        statusCode,
        error,
        code,
        message: exception.message,
      });
      expect(exception.message).not.toBe(code);
    },
  );
});

describe("[Unit] unknownException", () => {
  it("Should keep the original error as the cause, out of the body", () => {
    const databaseError = new Error(
      'duplicate key value violates unique constraint "User_email_key"',
    );

    const exception = unknownException(databaseError);

    expect(exception.cause).toBe(databaseError);
    expect(JSON.stringify(exception.getResponse())).not.toContain(
      "User_email_key",
    );
  });
});
