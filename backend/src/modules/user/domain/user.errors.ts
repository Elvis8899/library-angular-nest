import {
  DomainError,
  DomainErrorKindEnum,
} from "@shared/utils/domain/shared.errors";

export class UserCPFAlreadyExistsException extends DomainError {
  constructor() {
    super(
      DomainErrorKindEnum.Conflict,
      "user.cpfTaken",
      "O CPF informado já está sendo utilizado por outro usuário.",
    );
  }
}

export class UserNotFoundException extends DomainError {
  constructor() {
    super(
      DomainErrorKindEnum.NotFound,
      "user.notFound",
      "Usuário não encontrado.",
    );
  }
}

export const userCPFAlreadyExistsException = () =>
  new UserCPFAlreadyExistsException();

export const userNotFoundException = () => new UserNotFoundException();

export class UserEmailAlreadyExistsException extends DomainError {
  constructor() {
    super(
      DomainErrorKindEnum.Conflict,
      "user.emailTaken",
      "O Email informado já está sendo utilizado por outro usuário.",
    );
  }
}

export const userEmailAlreadyExistsException = () =>
  new UserEmailAlreadyExistsException();

// Lending example: used by RealUserRepository.deleteById
export class UserHasActiveRentalsException extends DomainError {
  constructor() {
    super(
      DomainErrorKindEnum.Conflict,
      "user.hasActiveRentals",
      "O usuário tem empréstimos em andamento. Finalize-os antes de excluí-lo.",
    );
  }
}

export const userHasActiveRentalsException = () =>
  new UserHasActiveRentalsException();
