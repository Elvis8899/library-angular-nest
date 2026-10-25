import { FPF, TE } from "@shared/utils/application/monads";
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
type ReadDelegate = {
  findUnique: (args: object) => Promise<unknown>;
  findMany: (args: object) => Promise<unknown[]>;
  count: (args: object) => Promise<number>;
};

export type RowReadsOptions = {
  /** Prisma's `include` (or `select`) for every read, e.g.
   * `{ lines: true } satisfies Prisma.WoodBatchInclude`. */
  include?: object;
  /** The order of the lists, e.g. `{ name: "asc" }`. */
  orderBy?: object;
};

/**
 * The reads most repositories have, written once:
 *
 *   private reads = rowReads(() => this.prisma.user, this.validator, {
 *     orderBy: { createdAt: "desc" },
 *   });
 *   findById = this.reads.findById;
 *
 * Every row goes through the validator, as the hand-written reads do.
 * `findPage` takes a `where` (checked with `satisfies Prisma.UserWhereInput`
 * by the caller); other filters stay hand-written queries.
 */
export const rowReads = <T>(
  delegate: () => object,
  validate: RowValidator<T>,
  { include, orderBy }: RowReadsOptions = {},
) => {
  // Every Prisma delegate has these queries
  const rows = prismaTasks((): ReadDelegate => FPF.unsafeCoerce(delegate()));
  const shape = { ...(include && { include }) };
  const list = (where: object) =>
    FPF.pipe(
      rows.findMany({ where, ...shape, ...(orderBy && { orderBy }) }),
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
    findPage: (
      params: PaginatedQueryParams,
      where: object = {},
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
