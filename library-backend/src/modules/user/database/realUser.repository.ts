import { RentalStatus } from "@db/generated/client";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "@shared/prisma/prisma.service";
import { FPF, O, TE } from "@shared/utils/application/monads";
import { validateFromUnknown } from "@shared/utils/application/validateWith";
import { prismaTasks } from "@shared/utils/database/prismaTasks";
import { Paginated } from "@shared/utils/database/repository.port";
import {
  loadPage,
  validateMaybeRow,
  validateRows,
} from "@shared/utils/database/rowValidation";
import { mapUniqueViolations } from "@shared/utils/database/uniqueViolation";
import { PaginatedQueryParams } from "@shared/utils/domain/query.base";
import { UserRepository } from "@user/database/user.repository.port";
import { formatDocument } from "@user/domain/document";
import { User, UserRoleEnum } from "@user/domain/user.entity";
import {
  userCPFAlreadyExistsException,
  userEmailAlreadyExistsException,
  userHasActiveRentalsException,
  userNotFoundException,
} from "@user/domain/user.errors";

@Injectable()
export class RealUserRepository implements UserRepository {
  constructor(private prisma: PrismaService) {}

  private baseValidator = validateFromUnknown(User, "User");

  private users = prismaTasks(() => this.prisma.user);

  findAll = (): TE.TaskEither<Error, User[]> =>
    FPF.pipe(
      this.users.findMany(),
      TE.chainEitherK(validateRows(this.baseValidator)),
    );

  findAllPaginated = (
    params: PaginatedQueryParams,
  ): TE.TaskEither<Error, Paginated<User>> =>
    loadPage(
      {
        rows: ({ skip, take }) =>
          this.users.findMany({ skip, take, orderBy: { createdAt: "desc" } }),
        total: () => this.users.count(),
      },
      this.baseValidator,
    )(params);

  findById = (userId: string): TE.TaskEither<Error, O.Option<User>> =>
    FPF.pipe(
      this.users.findUnique({ where: { id: userId } }),
      TE.chainEitherK(validateMaybeRow(this.baseValidator)),
    );

  findByCPF = (cpf: string): TE.TaskEither<Error, O.Option<User>> =>
    FPF.pipe(
      this.users.findFirst({
        where: {
          role: UserRoleEnum.Client,
          cpf: formatDocument(cpf),
        },
      }),
      TE.chainEitherK(validateMaybeRow(this.baseValidator)),
    );

  findByEmail = (email: string): TE.TaskEither<Error, O.Option<User>> =>
    FPF.pipe(
      this.users.findFirst({ where: { email: email.toLowerCase() } }),
      TE.chainEitherK(validateMaybeRow(this.baseValidator)),
    );

  // One conditional statement, so a rental started meanwhile can't be
  // deleted by the cascade
  deleteById = (userId: string): TE.TaskEither<Error, void> =>
    FPF.pipe(
      this.users.deleteMany({
        where: {
          id: userId,
          bookRentalDetails: { none: { rentalStatus: RentalStatus.rented } },
        },
      }),
      TE.chain(({ count }) =>
        count > 0 ? TE.right(undefined) : this.deletionFailure(userId),
      ),
    );

  // Nothing was deleted: the user has an unfinished rental, or is gone
  private deletionFailure = (userId: string): TE.TaskEither<Error, void> =>
    FPF.pipe(
      this.users.count({ where: { id: userId } }),
      TE.chain((users) =>
        TE.left<Error>(
          users > 0 ? userHasActiveRentalsException() : userNotFoundException(),
        ),
      ),
    );

  save = (user: User): TE.TaskEither<Error, void> => {
    // An admin's empty CPF is stored as NULL, which the unique index on cpf
    // ignores; "" would let only one admin have none
    const cpf = user.cpf || null;
    // Lowercase like the domain schema, for users that skipped it
    const email = user.email.toLowerCase();
    return FPF.pipe(
      this.users.upsert({
        where: { id: user.id },
        update: {
          name: user.name,
          email,
          password: user.password,
          cpf,
          role: user.role,
        },
        create: { ...user, email, cpf },
      }),
      TE.mapError(
        mapUniqueViolations({
          User_email_key: userEmailAlreadyExistsException,
          User_cpf_key: userCPFAlreadyExistsException,
        }),
      ),
      TE.asUnit,
    );
  };

  // updateMany does not fail when the user no longer exists
  incrementTokenVersion = (userId: string): TE.TaskEither<Error, void> =>
    FPF.pipe(
      this.users.updateMany({
        where: { id: userId },
        data: { tokenVersion: { increment: 1 } },
      }),
      TE.asUnit,
    );
}
