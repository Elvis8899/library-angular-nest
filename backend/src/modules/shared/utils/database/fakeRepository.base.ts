import { FPF, O, Ord, TE } from "@shared/utils/application/monads";
import {
  Paginated,
  RepositoryDefaultPort,
} from "@shared/utils/database/repository.port";
import {
  loadPage,
  RowValidator,
  validateMaybeRow,
  validateRows,
} from "@shared/utils/database/rowValidation";
import { PaginatedQueryParams } from "@shared/utils/domain/query.base";

/**
 * In-memory stand-in for a Prisma repository, used by the unit tests.
 * Rows are kept by id, in insertion order.
 */
export abstract class FakeRepository<
  Entity extends { id: string },
  Query = undefined,
> implements RepositoryDefaultPort<Entity, Query> {
  protected readonly rows = new Map<string, Entity>();

  protected abstract readonly validate: RowValidator<Entity>;

  protected list(matches: (row: Entity) => boolean = () => true): Entity[] {
    return [...this.rows.values()].filter(matches);
  }

  protected first(matches: (row: Entity) => boolean): O.Option<Entity> {
    return O.fromNullable(this.list(matches)[0]);
  }

  /** Paginates the rows that match, sorted by `order` when given. */
  protected pageOf(
    matches: (row: Entity) => boolean,
    order?: Ord.Ord<Entity>,
  ): (params: PaginatedQueryParams) => TE.TaskEither<Error, Paginated<Entity>> {
    const selected = () => {
      const found = this.list(matches);
      return order ? found.sort(order.compare) : found;
    };
    return loadPage(
      {
        rows: ({ skip, take }) => TE.of(selected().slice(skip, skip + take)),
        total: () => TE.of(selected().length),
      },
      this.validate,
    );
  }

  findAll = (): TE.TaskEither<Error, Entity[]> =>
    TE.fromEither(validateRows(this.validate)(this.list()));

  findAllPaginated = (
    params: PaginatedQueryParams<Query>,
  ): TE.TaskEither<Error, Paginated<Entity>> => this.pageOf(() => true)(params);

  findById = (id: string): TE.TaskEither<Error, O.Option<Entity>> =>
    TE.fromEither(validateMaybeRow(this.validate)(this.rows.get(id)));

  /** Inserts the row, or merges the given fields into the stored one. */
  save = (
    entity: Partial<Entity> & Pick<Entity, "id">,
  ): TE.TaskEither<Error, void> => {
    // A partial merged into the stored row; reads validate it
    const merged: Entity = FPF.unsafeCoerce({
      ...this.rows.get(entity.id),
      ...entity,
    });
    this.rows.set(entity.id, merged);
    return TE.of(undefined);
  };

  deleteById = (id: string): TE.TaskEither<Error, void> => {
    this.rows.delete(id);
    return TE.of(undefined);
  };
}
