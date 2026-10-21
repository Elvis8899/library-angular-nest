import {
  invalidRefreshTokenException,
  wrongAuthException,
} from "@auth/domain/auth.errors";
import {
  availableBookItemNotFoundException,
  bookInfoNotFoundException,
} from "@book/domain/bookInfo.errors";
import { HttpException } from "@nestjs/common";
import {
  bookRentalFinishedException,
  bookRentalNotAvailableException,
  bookRentalNotFoundException,
} from "@rental/domain/bookRental.errors";
import { unknownException } from "@shared/utils/domain/shared.erros";
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
    401,
    "Unauthorized",
    "auth.wrongCredentials",
  ],
  [
    "invalidRefreshTokenException",
    invalidRefreshTokenException,
    401,
    "Unauthorized",
    "auth.sessionExpired",
  ],
  [
    "bookInfoNotFoundException",
    bookInfoNotFoundException,
    404,
    "Not Found",
    "book.notFound",
  ],
  [
    "availableBookItemNotFoundException",
    availableBookItemNotFoundException,
    404,
    "Not Found",
    "book.noAvailableCopy",
  ],
  [
    "bookRentalNotFoundException",
    bookRentalNotFoundException,
    404,
    "Not Found",
    "rental.notFound",
  ],
  [
    "bookRentalFinishedException",
    bookRentalFinishedException,
    404,
    "Not Found",
    "rental.finished",
  ],
  [
    "bookRentalNotAvailableException",
    bookRentalNotAvailableException,
    409,
    "Conflict",
    "rental.unavailable",
  ],
  [
    "userCPFAlreadyExistsException",
    userCPFAlreadyExistsException,
    409,
    "Conflict",
    "user.cpfTaken",
  ],
  [
    "userNotFoundException",
    userNotFoundException,
    404,
    "Not Found",
    "user.notFound",
  ],
  [
    "userEmailAlreadyExistsException",
    userEmailAlreadyExistsException,
    409,
    "Conflict",
    "user.emailTaken",
  ],
  [
    "unknownException",
    () => unknownException(new Error("connection lost")) as HttpException,
    500,
    "Internal Server Error",
    "unknown",
  ],
];

describe("[Unit] Domain error codes", () => {
  it.each(cases)(
    "%s answers %i %s with the code %s",
    (_name, createException, statusCode, error, code) => {
      const exception = createException();
      const body = exception.getResponse() as Record<string, unknown>;

      expect(exception.getStatus()).toBe(statusCode);
      expect(body.statusCode).toBe(statusCode);
      expect(body.error).toBe(error);
      expect(body.code).toBe(code);
      // The message stays readable for other clients
      expect(body.message).toBe(exception.message);
      expect(exception.message).not.toBe(code);
    },
  );
});

describe("[Unit] unknownException", () => {
  it("Should keep the original error as the cause, out of the body", () => {
    const databaseError = new Error(
      'duplicate key value violates unique constraint "User_email_key"',
    );

    const exception = unknownException(databaseError) as HttpException;

    expect(exception.cause).toBe(databaseError);
    expect(JSON.stringify(exception.getResponse())).not.toContain(
      "User_email_key",
    );
  });
});
