import {
  DomainErrorKindEnum,
  domainError,
} from "@shared/utils/domain/shared.errors";

export class WrongAuthException extends domainError(
  DomainErrorKindEnum.Unauthorized,
  "auth.wrongCredentials",
  "O email e/ou senha estão incorretos.",
) {}

export const wrongAuthException = () => new WrongAuthException();

export class InvalidRefreshTokenException extends domainError(
  DomainErrorKindEnum.Unauthorized,
  "auth.sessionExpired",
  "Sessão expirada. Faça login novamente.",
) {}

export const invalidRefreshTokenException = () =>
  new InvalidRefreshTokenException();
