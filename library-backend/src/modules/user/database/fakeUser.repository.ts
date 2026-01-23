import { Injectable } from "@nestjs/common";
import { TE, FPF, O, E } from "@shared/functional/monads";
import { FakeRepositoryBase } from "@shared/db/fakeRepository.base";
import { validateFromUnknown } from "@shared/utils/validateWith";
import { User, UserRoleEnum } from "../domain/user.entity";
import { UserRepository } from "./user.repository.port";
import { formatToCPF } from "../domain/value-object/document";

@Injectable()
export class FakeUserRepository
  extends FakeRepositoryBase<User>
  implements UserRepository
{
  baseValidator = validateFromUnknown(User, "User");

  findByCPF = (cpf: string): TE.TaskEither<Error, O.Option<User>> =>
    FPF.pipe(
      this.findFirst(
        (item) =>
          item.role === UserRoleEnum.Client && item.cpf === formatToCPF(cpf),
      ),
      TE.chainEitherK(
        FPF.flow(O.map(this.baseValidator), O.sequence(E.Applicative)),
      ),
    );

  findByEmail = (email: string): TE.TaskEither<Error, O.Option<User>> =>
    FPF.pipe(
      this.findFirst((item) => item.email === email),
      TE.chainEitherK(
        FPF.flow(O.map(this.baseValidator), O.sequence(E.Applicative)),
      ),
    );
}
