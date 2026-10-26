// The codes the API's errors carry and the details some send, without Zod.
// The backend's errors take only these codes (domainError), the frontend
// translates each (errors.<code>) and reads the details typed

/** Every code an API error answers with. */
export const errorCodes = [
  // Any error the API didn't expect
  "unknown",
  // auth
  "auth.wrongCredentials",
  "auth.sessionExpired",
  "auth.accountDeactivated",
  // book (Lending example)
  "book.notFound",
  "book.noAvailableCopy",
  "book.copyNotFound",
  "book.coverNotFound",
  "book.coverType",
  "book.coverTooLarge",
  "book.coverChanged",
  // rental (Lending example)
  "rental.notFound",
  "rental.finished",
  "rental.unavailable",
  // user
  "user.notFound",
  "user.cpfTaken",
  "user.emailTaken",
  "user.deactivateSelf",
  // Lending example
  "user.hasActiveRentals",
] as const;
export type ErrorCode = (typeof errorCodes)[number];

/** What the codes that send details send. None does yet:
 * `"user.emailTaken": { userId: string }` would make that error take them
 * and the frontend's `detailsOf` read them typed. */
export interface ErrorDetailsOf {}

/** What an error of the code sends as `details`: undefined for most. */
export type ErrorDetails<C extends ErrorCode> = C extends keyof ErrorDetailsOf
  ? ErrorDetailsOf[C]
  : undefined;

/** An error's body: Nest's usual fields, the code and its details. */
export type ApiErrorBody<C extends ErrorCode = ErrorCode> = {
  statusCode: number;
  error: string;
  message: string;
  code: C;
  details?: ErrorDetails<C>;
};
