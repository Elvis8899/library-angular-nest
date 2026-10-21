import { Injectable } from "@nestjs/common";
import { O, TE } from "@shared/utils/application/monads";
import { validateFromUnknown } from "@shared/utils/application/validateWith";
import { FakeRepository } from "@shared/utils/database/fakeRepository.base";
import { validateMaybeRow } from "@shared/utils/database/rowValidation";
import { UserRepository } from "@user/database/user.repository.port";
import { formatDocument } from "@user/domain/document";
import { User, UserRoleEnum } from "@user/domain/user.entity";

@Injectable()
export class FakeUserRepository
  extends FakeRepository<User>
  implements UserRepository
{
  protected readonly validate = validateFromUnknown(User, "User");

  private findOne = (matches: (user: User) => boolean) =>
    TE.fromEither(
      validateMaybeRow(this.validate)(O.toUndefined(this.first(matches))),
    );

  findByCPF = (cpf: string): TE.TaskEither<Error, O.Option<User>> =>
    this.findOne(
      (user) =>
        user.role === UserRoleEnum.Client && user.cpf === formatDocument(cpf),
    );

  findByEmail = (email: string): TE.TaskEither<Error, O.Option<User>> =>
    this.findOne((user) => user.email.toLowerCase() === email.toLowerCase());

  incrementTokenVersion = (userId: string): TE.TaskEither<Error, void> => {
    const user = this.rows.get(userId);
    return user
      ? this.save({ id: userId, tokenVersion: user.tokenVersion + 1 })
      : TE.of(undefined);
  };
}
