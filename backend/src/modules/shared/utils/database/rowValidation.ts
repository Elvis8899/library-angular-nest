import { A, E, FPF, O, TE } from "@shared/utils/application/monads";
import { Paginated } from "@shared/utils/database/repository.port";
import { PaginatedQueryParams } from "@shared/utils/domain/query.base";

export type RowValidator<T> = (row: unknown) => E.Either<Error, T>;

/** Validates every row, failing on the first one that doesn't match. */
export const validateRows =
  <T>(validate: RowValidator<T>) =>
  (rows: readonly unknown[]): E.Either<Error, T[]> =>
    A.traverse(E.Applicative)(validate)([...rows]);

/** Validates a row that may be missing: null/undefined becomes `none`. */
export const validateMaybeRow =
  <T>(validate: RowValidator<T>) =>
  (row: unknown): E.Either<Error, O.Option<T>> =>
    row === null || row === undefined
      ? E.right(O.none)
      : FPF.pipe(validate(row), E.map(O.some));

type PageSource = {
  rows: (window: {
    skip: number;
    take: number;
  }) => TE.TaskEither<Error, unknown[]>;
  total: () => TE.TaskEither<Error, number>;
};

/** Loads one page of rows and the total row count, in parallel. */
export const loadPage =
  <T>(source: PageSource, validate: RowValidator<T>) =>
  ({
    page,
    limit,
    offset,
  }: PaginatedQueryParams): TE.TaskEither<Error, Paginated<T>> =>
    FPF.pipe(
      TE.Do,
      TE.apS(
        "data",
        FPF.pipe(
          source.rows({ skip: offset, take: limit }),
          TE.chainEitherK(validateRows(validate)),
        ),
      ),
      TE.apS("count", source.total()),
      TE.map(({ data, count }) => ({
        data,
        count,
        page,
        limit,
      })),
    );
