import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "@shared/prisma/adapter/prisma.service";
import { A, E, FPF, O, TE } from "@shared/utils/application/monads";
import { noop } from "@shared/utils/application/noop";
import { validateFromUnknown } from "@shared/utils/application/validateWith";
import { Paginated } from "@shared/utils/database/repository.port";
import { PaginatedQueryParams } from "@shared/utils/domain/query.base";
import { unknownException } from "@shared/utils/domain/shared.erros";
import { UserRepository } from "@user/database/user.repository.port";
import { User, UserRoleEnum } from "@user/domain/user.entity";
import { formatToCPF } from "@user/domain/value-object/document";

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

  private delete = TE.tryCatchK(
    this.prisma.user.delete.bind(this.prisma.user),
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

  private includeAll: Prisma.UserInclude = {
    bookRentalDetails: true,
  };
  private paginatedFindMany =
    <S extends User>(validator: (value: unknown) => E.Either<Error, S>) =>
    (where: Prisma.UserWhereInput) =>
    (query: PaginatedQueryParams): TE.TaskEither<Error, Paginated<S>> => {
      return FPF.pipe(
        TE.of(query),
        TE.let("skip", ({ page, limit, offset }) => limit * page + offset),
        TE.chain((parsedQuery) =>
          FPF.pipe(
            TE.of({ page: parsedQuery.page, limit: parsedQuery.limit }),
            TE.apS(
              "data",
              FPF.pipe(
                this.findMany({
                  where,
                  skip: parsedQuery.offset,
                  take: parsedQuery.limit,
                  orderBy: { createdAt: "desc" },
                  include: this.includeAll,
                }),
                TE.chainEitherK(A.traverse(E.Applicative)(validator)),
              ),
            ),
            TE.apS(
              "count",
              this.count({
                where,
              }),
            ),
          ),
        ),
      );
    };

  findAll = (): TE.TaskEither<Error, User[]> => {
    return FPF.pipe(
      this.findMany({
        include: this.includeAll,
      }),
      TE.chainEitherK(A.traverse(E.Applicative)(this.baseValidator)),
    );
  };

  findAllPaginated = (
    params: PaginatedQueryParams,
  ): TE.TaskEither<Error, Paginated<User>> => {
    const where: Prisma.UserWhereInput = {};
    return this.paginatedFindMany(this.baseValidator)(where)(params);
  };

  findById = (userId: string): TE.TaskEither<Error, O.Option<User>> => {
    return FPF.pipe(
      this.findUnique({
        where: {
          id: userId,
        },
        include: this.includeAll,
      }),
      TE.chainEitherK(
        FPF.flow(
          O.fromNullable,
          O.map(this.baseValidator),
          O.sequence(E.Applicative),
        ),
      ),
    );
  };

  findByCPF = (cpf: string): TE.TaskEither<Error, O.Option<User>> => {
    return FPF.pipe(
      this.findFirst({
        where: {
          role: UserRoleEnum.Client,
          cpf: formatToCPF(cpf),
        },
        include: this.includeAll,
      }),
      TE.chainEitherK(
        FPF.flow(
          O.fromNullable,
          O.map(this.baseValidator),
          O.sequence(E.Applicative),
        ),
      ),
    );
  };

  findByEmail = (email: string): TE.TaskEither<Error, O.Option<User>> => {
    return FPF.pipe(
      this.findFirst({
        where: {
          email: email,
        },
        include: this.includeAll,
      }),
      TE.chainEitherK(
        FPF.flow(
          O.fromNullable,
          O.map(this.baseValidator),
          O.sequence(E.Applicative),
        ),
      ),
    );
  };

  deleteById = (userId: string): TE.TaskEither<Error, void> => {
    return FPF.pipe(
      this.delete({
        where: {
          id: userId,
        },
      }),
      TE.map(noop),
    );
  };

  save = (user: User): TE.TaskEither<Error, void> => {
    return FPF.pipe(
      this.upsert({
        where: {
          id: user.id,
        },
        update: {
          name: user.name,
        },
        create: {
          ...user,
        },
      }),

      TE.map(noop),
    );
  };
}
