import { applyDecorators } from "@nestjs/common";
import { ApiResponse } from "@nestjs/swagger";
import { DomainErrorKindEnum } from "@shared/utils/domain/shared.errors";
import { domainErrorStatuses } from "@shared/utils/http/domainError.filter";

/** A domain error class (`domainError(…)` puts its kind and code on it). */
export interface DocumentedError {
  readonly kind: DomainErrorKindEnum;
  readonly code: string;
}

/**
 * The domain errors a route answers, documented in Swagger by status (the
 * one `DomainErrorFilter` gives each kind) with their codes, read from the
 * classes, so a renamed code can't leave the documentation behind. A pair
 * adds a note on when the error happens:
 *
 *   @ApiErrors(LineNotFoundException, [LineStatusException, "já comprado"])
 *
 * gives 404 "purchase.lineNotFound." and 409 "purchase.lineStatus (já comprado).".
 */
export const ApiErrors = (
  ...errors: (DocumentedError | readonly [DocumentedError, string])[]
): MethodDecorator & ClassDecorator => {
  const byStatus = new Map<number, string[]>();
  for (const entry of errors) {
    const [error, note] = "code" in entry ? [entry, undefined] : entry;
    const status = domainErrorStatuses[error.kind];
    byStatus.set(status, [
      ...(byStatus.get(status) ?? []),
      note ? `${error.code} (${note})` : error.code,
    ]);
  }
  return applyDecorators(
    ...[...byStatus].map(([status, codes]) =>
      ApiResponse({ status, description: `${codes.join(", ")}.` }),
    ),
  );
};
