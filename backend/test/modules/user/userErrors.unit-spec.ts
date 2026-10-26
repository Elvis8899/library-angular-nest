import {
  userCPFAlreadyExistsException,
  userDeactivatesSelfException,
  userEmailAlreadyExistsException,
  userHasActiveRentalsException,
  userNotFoundException,
} from "@modules/user/domain/user.errors";
import { HttpStatus } from "@nestjs/common";
import { itAnswersWithErrorCodes } from "@test/util/errorCodes";

describe("[Unit] User error codes", () => {
  itAnswersWithErrorCodes([
    [
      "userCPFAlreadyExistsException",
      userCPFAlreadyExistsException,
      HttpStatus.CONFLICT,
      "Conflict",
      "user.cpfTaken",
    ],
    [
      "userNotFoundException",
      userNotFoundException,
      HttpStatus.NOT_FOUND,
      "Not Found",
      "user.notFound",
    ],
    [
      "userEmailAlreadyExistsException",
      userEmailAlreadyExistsException,
      HttpStatus.CONFLICT,
      "Conflict",
      "user.emailTaken",
    ],
    [
      "userDeactivatesSelfException",
      userDeactivatesSelfException,
      HttpStatus.CONFLICT,
      "Conflict",
      "user.deactivateSelf",
    ],
    // Lending example
    [
      "userHasActiveRentalsException",
      userHasActiveRentalsException,
      HttpStatus.CONFLICT,
      "Conflict",
      "user.hasActiveRentals",
    ],
  ]);
});
