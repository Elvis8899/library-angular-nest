import { HttpStatus } from "@nestjs/common";
import {
  DomainErrorKindEnum,
  domainError,
} from "@shared/utils/domain/shared.errors";
import { ApiErrors } from "@shared/utils/http/apiErrors";

class MissingException extends domainError(
  DomainErrorKindEnum.NotFound,
  "user.notFound",
  "Não existe.",
) {}
class TakenException extends domainError(
  DomainErrorKindEnum.Conflict,
  "user.emailTaken",
  "Já existe.",
) {}
class ChangedException extends domainError(
  DomainErrorKindEnum.Conflict,
  "user.cpfTaken",
  "Mudou.",
) {}

// Swagger keeps a method's responses on the function itself
const methodOf = (target: object, name: string): object => {
  const method: unknown = Object.getOwnPropertyDescriptor(target, name)?.value;
  return typeof method === "function" ? method : {};
};

describe("[Unit] ApiErrors", () => {
  it("Should document the codes by their kind's status, with the notes", () => {
    class Controller {
      @ApiErrors(
        MissingException,
        [TakenException, "details.name"],
        ChangedException,
      )
      route(): void {}
    }

    const responses: unknown = Reflect.getMetadata(
      // @nestjs/swagger's key, which it doesn't export
      "swagger/apiResponse",
      methodOf(Controller.prototype, "route"),
    );

    expect(responses).toEqual({
      [HttpStatus.NOT_FOUND]: { description: "user.notFound." },
      [HttpStatus.CONFLICT]: {
        description: "user.emailTaken (details.name), user.cpfTaken.",
      },
    });
  });

  it("Should keep the kind and code on the error's class", () => {
    expect(TakenException.kind).toBe(DomainErrorKindEnum.Conflict);
    expect(TakenException.code).toBe("user.emailTaken");
    expect(new TakenException().code).toBe("user.emailTaken");
  });
});
