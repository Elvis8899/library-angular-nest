import {
  DomainErrorKindEnum,
  domainError,
} from "@shared/utils/domain/shared.errors";

export class UserCPFAlreadyExistsException extends domainError(
  DomainErrorKindEnum.Conflict,
  "user.cpfTaken",
  "O CPF informado já está sendo utilizado por outro usuário.",
) {}

export class UserNotFoundException extends domainError(
  DomainErrorKindEnum.NotFound,
  "user.notFound",
  "Usuário não encontrado.",
) {}

export const userCPFAlreadyExistsException = () =>
  new UserCPFAlreadyExistsException();

export const userNotFoundException = () => new UserNotFoundException();

export class UserEmailAlreadyExistsException extends domainError(
  DomainErrorKindEnum.Conflict,
  "user.emailTaken",
  "O Email informado já está sendo utilizado por outro usuário.",
) {}

export const userEmailAlreadyExistsException = () =>
  new UserEmailAlreadyExistsException();

export class UserDeactivatesSelfException extends domainError(
  DomainErrorKindEnum.Conflict,
  "user.deactivateSelf",
  "Você não pode desativar a sua própria conta.",
) {}

export const userDeactivatesSelfException = () =>
  new UserDeactivatesSelfException();

// Lending example: used by RealUserRepository.deleteById
export class UserHasActiveRentalsException extends domainError(
  DomainErrorKindEnum.Conflict,
  "user.hasActiveRentals",
  "O usuário tem empréstimos em andamento. Finalize-os antes de excluí-lo.",
) {}

export const userHasActiveRentalsException = () =>
  new UserHasActiveRentalsException();
