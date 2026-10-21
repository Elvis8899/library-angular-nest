import {
  ConflictException,
  HttpStatus,
  NotFoundException,
} from "@nestjs/common";
import { errorBody } from "@shared/utils/domain/shared.erros";

export class UserCPFAlreadyExistsException extends ConflictException {
  constructor() {
    super(
      errorBody(
        HttpStatus.CONFLICT,
        "user.cpfTaken",
        "O CPF informado já está sendo utilizado por outro usuário.",
      ),
    );
  }
}

export class UserNotFoundException extends NotFoundException {
  constructor() {
    super(
      errorBody(
        HttpStatus.NOT_FOUND,
        "user.notFound",
        "Usuário não encontrado.",
      ),
    );
  }
}

export const userCPFAlreadyExistsException = () =>
  new UserCPFAlreadyExistsException();

export const userNotFoundException = () => new UserNotFoundException();

export class UserEmailAlreadyExistsException extends ConflictException {
  constructor() {
    super(
      errorBody(
        HttpStatus.CONFLICT,
        "user.emailTaken",
        "O Email informado já está sendo utilizado por outro usuário.",
      ),
    );
  }
}

export const userEmailAlreadyExistsException = () =>
  new UserEmailAlreadyExistsException();

export class UserHasActiveRentalsException extends ConflictException {
  constructor() {
    super(
      errorBody(
        HttpStatus.CONFLICT,
        "user.hasActiveRentals",
        "O usuário tem empréstimos em andamento. Finalize-os antes de excluí-lo.",
      ),
    );
  }
}

export const userHasActiveRentalsException = () =>
  new UserHasActiveRentalsException();
