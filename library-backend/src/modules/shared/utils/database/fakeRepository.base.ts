// import { InternalServerErrorException } from "@nestjs/common";
import {
  A,
  Apply,
  E,
  FPF,
  O,
  Predicate,
  Refinement,
  TE,
} from "@shared/utils/application/monads";
import {
  Paginated,
  RepositoryDefaultPort,
} from "@shared/utils/database/repository.port";
import { PaginatedQueryParams } from "@shared/utils/domain/query.base";

export abstract class FakeRepositoryBase<
  Entity extends { id: string },
  Query = undefined,
> implements RepositoryDefaultPort<Entity> {
  protected dbItems: Entity[] = [];

  abstract baseValidator: (value: unknown) => E.Either<Error, Entity>;

  // <A, B extends A>(refinement: Refinement<A, B>): (as: Array<A>) => Array<B>
  // <A>(predicate: Predicate.Predicate<A>): <B extends A>(bs: Array<B>) => Array<B>
  // <A>(predicate: Predicate.Predicate<A>): (as: Array<A>) => Array<A>

  protected findMany: {
    <A extends Entity>(
      filter: Refinement.Refinement<Entity, A>,
    ): TE.TaskEither<Error, A[]>;
    (filter: Predicate.Predicate<Entity>): TE.TaskEither<Error, Entity[]>;
  } = <A extends Entity>(
    filter: Predicate.Predicate<Entity> | Refinement.Refinement<Entity, A>,
  ) => TE.of(A.filter(filter)(this.dbItems));

  protected findFirst: {
    <A extends Entity>(
      filter: Refinement.Refinement<Entity, A>,
    ): TE.TaskEither<Error, O.Option<A>>;
    (
      filter: Predicate.Predicate<Entity>,
    ): TE.TaskEither<Error, O.Option<Entity>>;
  } = (
    filter: Predicate.Predicate<Entity>,
  ): TE.TaskEither<Error, O.Option<Entity>> =>
    TE.of(A.findFirst(filter)(this.dbItems));

  protected count = (
    filter: Predicate.Predicate<Entity>,
  ): TE.TaskEither<Error, number> =>
    TE.of(A.filter(filter)(this.dbItems).length);

  protected paginatedFindMany: {
    <S extends Entity>(
      filter: Refinement.Refinement<Entity, S>,
    ): (
      validator: (value: unknown) => E.Either<Error, Entity>,
    ) => (
      query: PaginatedQueryParams<Query>,
    ) => TE.TaskEither<Error, Paginated<S>>;
    (
      filter: Predicate.Predicate<Entity>,
    ): (
      validator: (value: unknown) => E.Either<Error, Entity>,
    ) => (
      query: PaginatedQueryParams<Query>,
    ) => TE.TaskEither<Error, Paginated<Entity>>;
  } =
    (filter: Predicate.Predicate<Entity>) =>
    (validator: (value: unknown) => E.Either<Error, Entity>) =>
    (
      query: PaginatedQueryParams<Query>,
    ): TE.TaskEither<Error, Paginated<Entity>> => {
      const { page, limit, offset } = query;
      const skip = limit * page + offset;
      return Apply.sequenceS(TE.ApplicativePar)({
        count: this.count(filter),
        limit: TE.of(limit),
        page: TE.of(page),
        data: FPF.pipe(
          this.findMany(filter),
          TE.map(A.filterWithIndex((i) => i >= skip && i < skip + limit)),
          TE.chainEitherK(A.traverse(E.Applicative)(validator)),
        ),
      });
    };

  findAllPaginated = (
    params: PaginatedQueryParams<Query>,
  ): TE.TaskEither<Error, Paginated<Entity>> => {
    return this.paginatedFindMany(Boolean)(this.baseValidator)(params);
  };

  findById = (itemId: string): TE.TaskEither<Error, O.Option<Entity>> =>
    FPF.pipe(
      this.findFirst((item) => item.id === itemId),
      TE.chainEitherK(
        FPF.flow(O.map(this.baseValidator), O.sequence(E.Applicative)),
      ),
    );

  deleteById = (itemId: string): TE.TaskEither<Error, void> =>
    FPF.pipe(
      this.dbItems,
      A.findIndex((item) => item.id === itemId),
      O.chain((index) => A.deleteAt(index)(this.dbItems)),
      O.map((items) => (this.dbItems = items)),
      TE.of,
      TE.asUnit,
    );

  save = (entity: Partial<Entity>): TE.TaskEither<Error, void> =>
    FPF.pipe(
      this.dbItems,
      A.findIndex((item) => item.id === entity.id),
      O.fold(
        () => O.some(A.append<Entity>(entity as Entity)(this.dbItems)),
        (index) =>
          A.updateAt(index, { ...this.dbItems[index], ...entity } as Entity)(
            this.dbItems,
          ),
      ),
      O.map((items) => (this.dbItems = items)),
      TE.of,
      TE.asUnit,
    );

  findAll = (): TE.TaskEither<Error, Entity[]> => this.findMany(Boolean);
}
