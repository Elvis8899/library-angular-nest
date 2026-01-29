import { Injectable } from "@nestjs/common";
import { E, FPF, O, TE } from "@shared/utils/application/monads";
import { validateFromUnknown } from "@shared/utils/application/validateWith";
import { FakeRepositoryBase } from "@shared/utils/database/fakeRepository.base";
import { UserRepository } from "@user/database/user.repository.port";
import { User, UserRoleEnum } from "@user/domain/user.entity";
import { formatToCPF } from "@user/domain/value-object/document";

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
