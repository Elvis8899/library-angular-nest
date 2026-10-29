import { FPF, R } from "@shared/utils/application/monads";
import { PinoLogger } from "nestjs-pino";

/**
 * Given a logger, and failure message, logs error. Use with bimap or mapLeft
 */
export const loggerOnLeftR = <
  ErrorLike extends Error,
  U extends { logger: PinoLogger },
>(
  warningMessage: string,
): ((error: ErrorLike) => R.Reader<U, ErrorLike>) =>
  FPF.flow(
    R.of,
    R.tap((error) =>
      R.asks(({ logger }: U) => {
        logger.warn([error.name, warningMessage].join(" - "));
        logger.error([error.message, error.stack].join(" - "));
        // What a 500 hides from the client, such as the database's error
        if (error.cause instanceof Error) {
          logger.error(
            ["Caused by", error.cause.message, error.cause.stack].join(" - "),
          );
        }
      }),
    ),
  );

/**
 * What a step's value is, for the debug log, not the value itself: a report
 * or an import answers thousands of rows. A list is its length, a record its
 * id (or its fields' names), an Option what it holds.
 */
export const summaryOf = (value: unknown): unknown => {
  if (Array.isArray(value)) return { count: value.length };
  if (value === null || typeof value !== "object") return value;
  if ("_tag" in value && value._tag === "None") return "none";
  if ("_tag" in value && value._tag === "Some" && "value" in value)
    return { some: summaryOf(value.value) };
  if ("id" in value && typeof value.id === "string") return { id: value.id };
  return { fields: Object.keys(value) };
};

/**
 * Given a logger, and success message, logs success at debug level, with a
 * summary of the value (`summaryOf`). Use with bimap or map
 */
export const loggerOnRightR = <DataLike, U extends { logger: PinoLogger }>(
  successMessage: string,
): ((data: DataLike) => R.Reader<U, DataLike>) =>
  FPF.flow(
    R.of,
    R.tap((data) =>
      R.asks(({ logger }: U) => {
        logger.debug({ value: summaryOf(data) }, successMessage);
      }),
    ),
  );
