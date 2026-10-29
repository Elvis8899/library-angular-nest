import { HttpStatus } from "@nestjs/common";
import {
  DomainError,
  DomainErrorKindEnum,
  unknownException,
} from "@shared/utils/domain/shared.errors";
import { toHttpException } from "@shared/utils/http/domainError.filter";
import { ErrorCodeCase, itAnswersWithErrorCodes } from "@test/util/errorCodes";

// Each kind's status, which every module's error is answered with
// (domainErrors.unit-spec.ts checks each against its kind)
const kinds: [DomainErrorKindEnum, number, string][] = [
  [DomainErrorKindEnum.NotFound, HttpStatus.NOT_FOUND, "Not Found"],
  [DomainErrorKindEnum.Conflict, HttpStatus.CONFLICT, "Conflict"],
  [
    DomainErrorKindEnum.Invalid,
    HttpStatus.UNPROCESSABLE_ENTITY,
    "Unprocessable Entity",
  ],
  [DomainErrorKindEnum.Unauthorized, HttpStatus.UNAUTHORIZED, "Unauthorized"],
  [DomainErrorKindEnum.Forbidden, HttpStatus.FORBIDDEN, "Forbidden"],
];

describe("[Unit] Shared error codes", () => {
  itAnswersWithErrorCodes([
    [
      "unknownException",
      () => unknownException(new Error("connection lost")),
      HttpStatus.INTERNAL_SERVER_ERROR,
      "Internal Server Error",
      "unknown",
    ],
    ...kinds.map(([kind, status, error]): ErrorCodeCase => [
      `a ${kind} error`,
      () => new DomainError(kind, "user.notFound", "Sem permissão."),
      status,
      error,
      "user.notFound",
    ]),
  ]);
});

describe("[Unit] unknownException", () => {
  it("Should keep the original error as the cause, out of the body", () => {
    const databaseError = new Error(
      'duplicate key value violates unique constraint "User_email_key"',
    );

    const exception = unknownException(databaseError);

    expect(exception.cause).toBe(databaseError);
    expect(
      JSON.stringify(toHttpException(exception).getResponse()),
    ).not.toContain("User_email_key");
  });
});

describe("[Unit] toHttpException", () => {
  it("Should send an error's details in the body, and no details key without them", () => {
    const withDetails = new DomainError(
      DomainErrorKindEnum.Conflict,
      "user.cpfTaken",
      "Com detalhes.",
      { details: { available: 2 } },
    );

    expect(toHttpException(withDetails).getResponse()).toMatchObject({
      code: "user.cpfTaken",
      details: { available: 2 },
    });
    expect(
      toHttpException(unknownException(new Error("x"))).getResponse(),
    ).not.toHaveProperty("details");
  });
});
