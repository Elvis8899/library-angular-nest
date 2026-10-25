import { UserRepository } from "@modules/user/database/user.repository.port";
import { formatDocument } from "@modules/user/domain/document";
import { User, UserRoleEnum } from "@modules/user/domain/user.entity";
import {
  userCPFAlreadyExistsException,
  userEmailAlreadyExistsException,
  userNotFoundException,
} from "@modules/user/domain/user.errors";
import { Injectable } from "@nestjs/common";
import { D, FPF, O, Ord, TE } from "@shared/utils/application/monads";
import { validateFromUnknown } from "@shared/utils/application/validateWith";
import { FakeRepository } from "@shared/utils/database/fakeRepository.base";
import { Paginated } from "@shared/utils/database/repository.port";
import {
  validateMaybeRow,
  validateRows,
} from "@shared/utils/database/rowValidation";
import { PaginatedQueryParams } from "@shared/utils/domain/query.base";

// Newest first, as the Prisma repository lists them
const newestFirst: Ord.Ord<User> = Ord.reverse(
  FPF.pipe(
    D.Ord,
    Ord.contramap((user: User) => user.createdAt),
  ),
);

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

  override findAll = (): TE.TaskEither<Error, User[]> =>
    TE.fromEither(
      validateRows(this.validate)(this.list().sort(newestFirst.compare)),
    );

  override findAllPaginated = (
    params: PaginatedQueryParams,
  ): TE.TaskEither<Error, Paginated<User>> =>
    this.pageOf(() => true, newestFirst)(params);

  findByCPF = (cpf: string): TE.TaskEither<Error, O.Option<User>> =>
    this.findOne(
      (user) =>
        user.role === UserRoleEnum.Client && user.cpf === formatDocument(cpf),
    );

  findByEmail = (email: string): TE.TaskEither<Error, O.Option<User>> =>
    this.findOne((user) => user.email.toLowerCase() === email.toLowerCase());

  /** As the Prisma upsert: the email lowercased, the token version kept on
   * an update, and an email or CPF another user holds refused (an empty CPF
   * is none, so any number of admins may lack one). */
  override save = (
    row: Partial<User> & Pick<User, "id">,
  ): TE.TaskEither<Error, void> => {
    const stored = this.rows.get(row.id);
    // A partial merged into the stored row; reads validate it
    const user: User = FPF.unsafeCoerce({ ...stored, ...row });
    const email = user.email.toLowerCase();
    const others = this.list(({ id }) => id !== user.id);
    if (others.some((other) => other.email === email))
      return TE.left(userEmailAlreadyExistsException());
    if (user.cpf !== "" && others.some(({ cpf }) => cpf === user.cpf))
      return TE.left(userCPFAlreadyExistsException());
    this.rows.set(user.id, {
      ...user,
      email,
      tokenVersion: stored?.tokenVersion ?? user.tokenVersion,
    });
    return TE.of(undefined);
  };

  /** As the Prisma delete: a user that isn't there is a 404. Rentals are the
   * rental fakes' (lending example), so this one never refuses for them. */
  override deleteById = (id: string): TE.TaskEither<Error, void> =>
    this.rows.delete(id) ? TE.of(undefined) : TE.left(userNotFoundException());

  incrementTokenVersion = (userId: string): TE.TaskEither<Error, void> => {
    const user = this.rows.get(userId);
    if (user)
      this.rows.set(userId, { ...user, tokenVersion: user.tokenVersion + 1 });
    return TE.of(undefined);
  };
}
