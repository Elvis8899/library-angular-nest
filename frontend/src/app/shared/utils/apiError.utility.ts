import type { ErrorCode, ErrorDetails } from "@library/contracts";

/** An error the API answered, after the error interceptor translated it. */
export interface ApiError {
  message?: string;
  code?: ErrorCode;
  details?: unknown;
}

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
