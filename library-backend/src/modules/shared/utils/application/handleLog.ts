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
 * Given a logger, and success message, logs success. Use with bimap or map
 */

export const loggerOnRightR = <DataLike, U extends { logger: PinoLogger }>(
  successMessage: string,
): ((data: DataLike) => R.Reader<U, DataLike>) =>
  FPF.flow(
    R.of,
    R.tap((data) =>
      R.asks(({ logger }: U) => {
        logger.debug(successMessage);
        logger.debug(data);
      }),
    ),
  );
