import { HttpException } from "@nestjs/common";

// The frontend translates errors by code (errors.<code> in its pt-BR.ts), and
// its translationKeys.spec.ts checks every code has a translation
export type ErrorCodeCase = [
  name: string,
  createException: () => HttpException,
  statusCode: number,
  error: string,
  code: string,
];

/** Checks each module error's status, body and code. */
export const itAnswersWithErrorCodes = (cases: ErrorCodeCase[]): void => {
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
};
