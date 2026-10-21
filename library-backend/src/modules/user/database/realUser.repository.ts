import { Prisma, RentalStatus } from "@db/generated/client";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "@shared/prisma/adapter/prisma.service";
import { FPF, O, TE } from "@shared/utils/application/monads";
import { noop } from "@shared/utils/application/noop";
import { validateFromUnknown } from "@shared/utils/application/validateWith";
import { Paginated } from "@shared/utils/database/repository.port";
import {
  loadPage,
  validateMaybeRow,
  validateRows,
} from "@shared/utils/database/rowValidation";
import { PaginatedQueryParams } from "@shared/utils/domain/query.base";
import { unknownException } from "@shared/utils/domain/shared.erros";
import { UserRepository } from "@user/database/user.repository.port";
import { User, UserRoleEnum } from "@user/domain/user.entity";
import {
  userHasActiveRentalsException,
  userNotFoundException,
} from "@user/domain/user.errors";
import { formatDocument } from "@user/domain/valueObject/document";

@Injectable()
export class RealUserRepository implements UserRepository {
  constructor(private prisma: PrismaService) {}

  private baseValidator = validateFromUnknown(User, "User");

  private defaultErrorException = unknownException;

  private findMany = TE.tryCatchK(
    this.prisma.user.findMany.bind(this.prisma.user),
    this.defaultErrorException,
  );

  private findFirst = TE.tryCatchK(
    this.prisma.user.findFirst.bind(this.prisma.user),
    this.defaultErrorException,
  );
  private findUnique = TE.tryCatchK(
    this.prisma.user.findUnique.bind(this.prisma.user),
    this.defaultErrorException,
  );

  private count = TE.tryCatchK(
    this.prisma.user.count.bind(this.prisma.user),
    this.defaultErrorException,
  );

  private deleteMany = TE.tryCatchK(
    this.prisma.user.deleteMany.bind(this.prisma.user),
    this.defaultErrorException,
  );

  private upsert = TE.tryCatchK(
    this.prisma.user.upsert.bind(this.prisma.user),
    this.defaultErrorException,
  );

  private update = TE.tryCatchK(
    this.prisma.user.update.bind(this.prisma.user),
    this.defaultErrorException,
  );

  private updateMany = TE.tryCatchK(
    this.prisma.user.updateMany.bind(this.prisma.user),
    this.defaultErrorException,
  );

  findAll = (): TE.TaskEither<Error, User[]> => {
    return FPF.pipe(
      this.findMany({}),
      TE.chainEitherK(validateRows(this.baseValidator)),
    );
  };

  findAllPaginated = (
    params: PaginatedQueryParams,
  ): TE.TaskEither<Error, Paginated<User>> => {
    const where: Prisma.UserWhereInput = {};
    return loadPage(
      {
        rows: ({ skip, take }) =>
          this.findMany({
            where,
            skip,
            take,
            orderBy: { createdAt: "desc" },
          }),
        total: () => this.count({ where }),
      },
      this.baseValidator,
    )(params);
  };

  findById = (userId: string): TE.TaskEither<Error, O.Option<User>> => {
    return FPF.pipe(
      this.findUnique({
        where: {
          id: userId,
        },
      }),
      TE.chainEitherK(validateMaybeRow(this.baseValidator)),
    );
  };

  findByCPF = (cpf: string): TE.TaskEither<Error, O.Option<User>> => {
    return FPF.pipe(
      this.findFirst({
        where: {
          role: UserRoleEnum.Client,
          cpf: formatDocument(cpf),
        },
      }),
      TE.chainEitherK(validateMaybeRow(this.baseValidator)),
    );
  };

  findByEmail = (email: string): TE.TaskEither<Error, O.Option<User>> => {
    return FPF.pipe(
      this.findFirst({
        where: {
          email: email,
        },
      }),
      TE.chainEitherK(validateMaybeRow(this.baseValidator)),
    );
  };

  // One conditional statement, so a rental started meanwhile can't be
  // deleted by the cascade. When nothing is deleted, the user's existence
  // tells the two failures apart
  deleteById = (userId: string): TE.TaskEither<Error, void> =>
    FPF.pipe(
      this.deleteMany({
        where: {
          id: userId,
          bookRentalDetails: { none: { rentalStatus: RentalStatus.rented } },
        },
      }),
      TE.chain(({ count }): TE.TaskEither<Error, void> =>
        count > 0
          ? TE.right(undefined)
          : FPF.pipe(
              this.count({ where: { id: userId } }),
              TE.chain((users) =>
                TE.left<Error>(
                  users > 0
                    ? userHasActiveRentalsException()
                    : userNotFoundException(),
                ),
              ),
            ),
      ),
    );

  save = (user: User): TE.TaskEither<Error, void> => {
    return FPF.pipe(
      this.upsert({
        where: {
          id: user.id,
        },
        update: {
          name: user.name,
          email: user.email,
          password: user.password,
          cpf: user.cpf,
          role: user.role,
        },
        create: {
          ...user,
        },
      }),

      TE.map(noop),
    );
  };

  // updateMany does not fail when the user no longer exists
  incrementTokenVersion = (userId: string): TE.TaskEither<Error, void> =>
    FPF.pipe(
      this.updateMany({
        where: { id: userId },
        data: { tokenVersion: { increment: 1 } },
      }),
      TE.map(noop),
    );
}
