import { HttpStatus, InternalServerErrorException } from "@nestjs/common";

// The original error is kept as the cause, which the logs show. Sent as the
// body, it would show clients the database's messages and constraint names
export function unknownException(error: unknown): InternalServerErrorException {
  return new InternalServerErrorException(
    errorBody(
      HttpStatus.INTERNAL_SERVER_ERROR,
      "unknown",
      "Erro interno do servidor.",
    ),
    { cause: error },
  );
}

const reasons: Partial<Record<HttpStatus, string>> = {
  [HttpStatus.UNAUTHORIZED]: "Unauthorized",
  [HttpStatus.NOT_FOUND]: "Not Found",
  [HttpStatus.CONFLICT]: "Conflict",
  [HttpStatus.INTERNAL_SERVER_ERROR]: "Internal Server Error",
};

/**
 * The response body of a domain error: Nest's usual body plus a `code`
 * (`user.cpfTaken`), which the frontend translates; the message stays for
 * other clients.
 */
export const errorBody = (
  status: HttpStatus,
  code: string,
  message: string,
) => ({
  statusCode: status,
  error: reasons[status],
  message,
  code,
});
