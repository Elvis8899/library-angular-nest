import { HttpStatus, UnauthorizedException } from "@nestjs/common";
import { errorBody } from "@shared/utils/domain/shared.errors";

export class WrongAuthException extends UnauthorizedException {
  constructor() {
    super(
      errorBody(
        HttpStatus.UNAUTHORIZED,
        "auth.wrongCredentials",
        "O email e/ou senha estão incorretos.",
      ),
    );
  }
}

export const wrongAuthException = () => new WrongAuthException();

export class InvalidRefreshTokenException extends UnauthorizedException {
  constructor() {
    super(
      errorBody(
        HttpStatus.UNAUTHORIZED,
        "auth.sessionExpired",
        "Sessão expirada. Faça login novamente.",
      ),
    );
  }
}

export const invalidRefreshTokenException = () =>
  new InvalidRefreshTokenException();
