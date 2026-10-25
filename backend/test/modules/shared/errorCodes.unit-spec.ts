import { HttpStatus } from "@nestjs/common";
import {
  DomainError,
  DomainErrorKindEnum,
  unknownException,
} from "@shared/utils/domain/shared.errors";
import { toHttpException } from "@shared/utils/http/domainError.filter";
import { itAnswersWithErrorCodes } from "@test/util/errorCodes";

// Each module checks its own errors' codes, in test/modules/<module>/

describe("[Unit] Shared error codes", () => {
  itAnswersWithErrorCodes([
    [
      "unknownException",
      () => unknownException(new Error("connection lost")),
      HttpStatus.INTERNAL_SERVER_ERROR,
      "Internal Server Error",
      "unknown",
    ],
    [
      "a Forbidden error",
      () =>
        new DomainError(
          DomainErrorKindEnum.Forbidden,
          "user.notFound",
          "Sem permissão.",
        ),
      HttpStatus.FORBIDDEN,
      "Forbidden",
      "user.notFound",
    ],
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
