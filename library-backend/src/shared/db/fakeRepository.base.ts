// import { InternalServerErrorException } from "@nestjs/common";
import { Apply, A, TE, FPF, O, E } from "@shared/functional/monads";
import { Paginated } from "@shared/ddd";
import { RepositoryPort } from "@shared/ddd";
import { Predicate } from "fp-ts/lib/Predicate";
import { Refinement } from "fp-ts/lib/Refinement";
import { PaginatedQueryParams } from "@shared/ddd/query.base";

export abstract class FakeRepositoryBase<
  Entity extends { id: EntityId },
  EntityId extends string = Entity["id"],
> implements RepositoryPort<Entity>
{
  protected dbItems: Entity[] = [];

  abstract baseValidator: (value: unknown) => E.Either<Error, Entity>;

  // <A, B extends A>(refinement: Refinement<A, B>): (as: Array<A>) => Array<B>
  // <A>(predicate: Predicate<A>): <B extends A>(bs: Array<B>) => Array<B>
  // <A>(predicate: Predicate<A>): (as: Array<A>) => Array<A>

  protected findMany: {
    <A extends Entity>(
      filter: Refinement<Entity, A>,
    ): TE.TaskEither<Error, A[]>;
    (filter: Predicate<Entity>): TE.TaskEither<Error, Entity[]>;
  } = <A extends Entity>(filter: Predicate<Entity> | Refinement<Entity, A>) =>
    TE.of(A.filter(filter)(this.dbItems));

  protected findFirst: {
    <A extends Entity>(
      filter: Refinement<Entity, A>,
    ): TE.TaskEither<Error, O.Option<A>>;
    (filter: Predicate<Entity>): TE.TaskEither<Error, O.Option<Entity>>;
  } = (filter: Predicate<Entity>): TE.TaskEither<Error, O.Option<Entity>> =>
    TE.of(A.findFirst(filter)(this.dbItems));

  protected count = (filter: Predicate<Entity>): TE.TaskEither<Error, number> =>
    TE.of(A.filter(filter)(this.dbItems).length);

  protected paginatedFindMany: {
    <S extends Entity>(
      filter: Refinement<Entity, S>,
    ): (
      validator: (value: unknown) => E.Either<Error, Entity>,
    ) => (query: PaginatedQueryParams) => TE.TaskEither<Error, Paginated<S>>;
    (
      filter: Predicate<Entity>,
    ): (
      validator: (value: unknown) => E.Either<Error, Entity>,
    ) => (
      query: PaginatedQueryParams,
    ) => TE.TaskEither<Error, Paginated<Entity>>;
  } =
    (filter: Predicate<Entity>) =>
    (validator: (value: unknown) => E.Either<Error, Entity>) =>
    (query: PaginatedQueryParams): TE.TaskEither<Error, Paginated<Entity>> => {
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
    params: PaginatedQueryParams,
  ): TE.TaskEither<Error, Paginated<Entity>> => {
    return this.paginatedFindMany(Boolean)(this.baseValidator)(params);
  };

  findById = (itemId: EntityId): TE.TaskEither<Error, O.Option<Entity>> =>
    FPF.pipe(
      this.findFirst((item) => item.id === itemId),
      TE.chainEitherK(
        FPF.flow(O.map(this.baseValidator), O.sequence(E.Applicative)),
      ),
    );

  deleteById = (itemId: EntityId): TE.TaskEither<Error, void> =>
    FPF.pipe(
      this.dbItems,
      A.findIndex((item) => item.id === itemId),
      O.chain((index) => A.deleteAt(index)(this.dbItems)),
      O.map((items) => (this.dbItems = items)),
      TE.of,
      TE.asUnit,
    );

  save = (entity: Entity): TE.TaskEither<Error, void> =>
    FPF.pipe(
      this.dbItems,
      A.findIndex((item) => item.id === entity.id),
      O.fold(
        () => O.some(A.append(entity)(this.dbItems)),
        (index) => A.updateAt(index, entity)(this.dbItems),
      ),
      O.map((items) => (this.dbItems = items)),
      TE.of,
      TE.asUnit,
    );

  findAll = (): TE.TaskEither<Error, Entity[]> => this.findMany(Boolean);
}
