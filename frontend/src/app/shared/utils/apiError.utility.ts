import type { ErrorCode, ErrorDetails } from "@library/contracts";

/** An error the API answered, after the error interceptor translated it. */
export interface ApiError {
  message?: string;
  code?: ErrorCode;
  details?: unknown;
}

/**
 * Whether the API refused a write because what it read changed meanwhile
 * (a 409 whose code ends in `changed`, as a book's cover): another save got
 * there first, and the screen must reload before trying again.
 */
export const isChangedMeanwhile = (error: unknown): boolean => {
  const code = (error as ApiError | null)?.code;
  return typeof code === "string" && /(\.c|C)hanged$/.test(code);
};

/** The error's details when the API answered with one of the codes, typed
 * as the contracts say each code sends them; null for any other error. */
export const detailsOf = <C extends ErrorCode>(
  error: unknown,
  ...codes: C[]
): ErrorDetails<C> | null => {
  const { code, details } = (error ?? {}) as ApiError;
  return code !== undefined && (codes as ErrorCode[]).includes(code)
    ? ((details ?? null) as ErrorDetails<C> | null)
    : null;
};
