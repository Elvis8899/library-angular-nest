import {
  accountDeactivatedException,
  invalidRefreshTokenException,
  wrongAuthException,
} from "@modules/auth/domain/auth.errors";
import { HttpStatus } from "@nestjs/common";
import { itAnswersWithErrorCodes } from "@test/util/errorCodes";

describe("[Unit] Auth error codes", () => {
  itAnswersWithErrorCodes([
    [
      "wrongAuthException",
      wrongAuthException,
      HttpStatus.UNAUTHORIZED,
      "Unauthorized",
      "auth.wrongCredentials",
    ],
    [
      "invalidRefreshTokenException",
      invalidRefreshTokenException,
      HttpStatus.UNAUTHORIZED,
      "Unauthorized",
      "auth.sessionExpired",
    ],
    [
      "accountDeactivatedException",
      accountDeactivatedException,
      HttpStatus.UNAUTHORIZED,
      "Unauthorized",
      "auth.accountDeactivated",
    ],
  ]);
});
