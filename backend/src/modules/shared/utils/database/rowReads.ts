import { FPF, O, TE } from "@shared/utils/application/monads";
import { prismaTasks } from "@shared/utils/database/prismaTasks";
import { Paginated } from "@shared/utils/database/repository.port";
import {
  loadPage,
  RowValidator,
  validateMaybeRow,
  validateRows,
} from "@shared/utils/database/rowValidation";
import { PaginatedQueryParams } from "@shared/utils/domain/query.base";

// The queries every model's delegate has, as the reads below call them
interface ReadDelegate {
  findUnique: (args: object) => Promise<unknown>;
  findFirst: (args: object) => Promise<unknown>;
  findMany: (args: object) => Promise<unknown[]>;
  count: (args: object) => Promise<number>;
}

// A delegate's findMany argument, from which the filter's and order's types
// come (Prisma.WorkerWhereInput, Prisma.WorkerOrderByWithRelationInput…)
type FindManyArgs<Delegate> = Delegate extends {
  findMany: (args?: infer Args) => unknown;
}
  ? NonNullable<Args>
  : never;
type WhereOf<Delegate> =
  FindManyArgs<Delegate> extends { where?: infer Where } ? Where : never;
type OrderOf<Delegate> =
  FindManyArgs<Delegate> extends { orderBy?: infer Order } ? Order : never;

export interface RowReadsOptions {
  /** Prisma's `include` (or `select`) for every read, e.g.
   * `{ lines: true } satisfies Prisma.WoodBatchInclude`. */
  include?: object;
  /** The order of the lists, e.g. `{ name: "asc" }`. */
  orderBy?: object;
}

/**
 * The reads most repositories have, written once:
 *
 *   private reads = rowReads(() => this.prisma.user, this.validator, {
 *     orderBy: { createdAt: "desc" },
 *   });
 *   findById = this.reads.findById;
 *
 * Every row goes through the validator. `findWhere` and `findFirstWhere`
 * take a filter (the caller's, `Prisma.UserWhereInput`) and an order (the
 * reads' by default), `findPage` a filter; queries with a `select` or an
 * aggregate stay hand-written.
 */
export const rowReads = <T, Delegate extends object = object>(
  delegate: () => Delegate,
  validate: RowValidator<T>,
  { include, orderBy }: RowReadsOptions = {},
) => {
  // Every Prisma delegate has these queries
  const rows = prismaTasks((): ReadDelegate => FPF.unsafeCoerce(delegate()));
  const shape = { ...(include && { include }) };
  // The order asked for, or the reads' own
  const ordered = (order: unknown) => {
    const by = order ?? orderBy;
    return by === undefined ? {} : { orderBy: by };
  };
  const list = (where: unknown, order?: unknown) =>
    FPF.pipe(
      rows.findMany({ where, ...shape, ...ordered(order) }),
      TE.chainEitherK(validateRows(validate)),
    );
  return {
    findById: (id: string) =>
      FPF.pipe(
        rows.findUnique({ where: { id }, ...shape }),
        TE.chainEitherK(validateMaybeRow(validate)),
      ),
    findByIds: (ids: readonly string[]): TE.TaskEither<Error, T[]> =>
      list({ id: { in: [...ids] } }),
    findAll: (): TE.TaskEither<Error, T[]> => list({}),
    findWhere: (
      where: WhereOf<Delegate>,
      order?: OrderOf<Delegate>,
    ): TE.TaskEither<Error, T[]> => list(where, order),
    findFirstWhere: (
      where: WhereOf<Delegate>,
      order?: OrderOf<Delegate>,
    ): TE.TaskEither<Error, O.Option<T>> =>
      FPF.pipe(
        rows.findFirst({ where, ...shape, ...ordered(order) }),
        TE.chainEitherK(validateMaybeRow(validate)),
      ),
    findPage: (
      params: PaginatedQueryParams,
      where: WhereOf<Delegate> | Record<string, never> = {},
    ): TE.TaskEither<Error, Paginated<T>> =>
      loadPage(
        {
          rows: ({ skip, take }) =>
            rows.findMany({
              where,
              skip,
              take,
              ...shape,
              ...(orderBy && { orderBy }),
            }),
          total: () => rows.count({ where }),
        },
        validate,
      )(params),
  };
};
