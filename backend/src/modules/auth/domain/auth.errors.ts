import {
  DomainError,
  DomainErrorKindEnum,
} from "@shared/utils/domain/shared.errors";

export class WrongAuthException extends DomainError {
  constructor() {
    super(
      DomainErrorKindEnum.Unauthorized,
      "auth.wrongCredentials",
      "O email e/ou senha estão incorretos.",
    );
  }
}

export const wrongAuthException = () => new WrongAuthException();

export class InvalidRefreshTokenException extends DomainError {
  constructor() {
    super(
      DomainErrorKindEnum.Unauthorized,
      "auth.sessionExpired",
      "Sessão expirada. Faça login novamente.",
    );
  }
}

export const invalidRefreshTokenException = () =>
  new InvalidRefreshTokenException();
