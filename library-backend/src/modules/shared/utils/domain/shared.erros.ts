import { HttpStatus, InternalServerErrorException } from "@nestjs/common";

export function unknownException(error: unknown): Error {
  return new InternalServerErrorException(error);
}

const reasons: Partial<Record<HttpStatus, string>> = {
  [HttpStatus.UNAUTHORIZED]: "Unauthorized",
  [HttpStatus.NOT_FOUND]: "Not Found",
  [HttpStatus.CONFLICT]: "Conflict",
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
