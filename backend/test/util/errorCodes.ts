import { DomainError } from "@shared/utils/domain/shared.errors";
import { toHttpException } from "@shared/utils/http/domainError.filter";

// The frontend translates errors by code (errors.<code> in its pt-BR.ts), and
// its translationKeys.spec.ts checks every code has a translation
export type ErrorCodeCase = [
  name: string,
  createError: () => DomainError,
  statusCode: number,
  error: string,
  code: string,
];

/** Checks the status, body and code each module error is answered with. */
export const itAnswersWithErrorCodes = (cases: ErrorCodeCase[]): void => {
  it.each(cases)(
    "%s answers %i %s with the code %s",
    (_name, createError, statusCode, error, code) => {
      const exception = toHttpException(createError());

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
};
