import { DataSource } from "@angular/cdk/collections";
import { Logger } from "@app/services/logger.service";
import {
  BehaviorSubject,
  combineLatest,
  defer,
  noop,
  Observable,
  of,
  Subject,
} from "rxjs";
import {
  catchError,
  finalize,
  share,
  startWith,
  switchMap,
} from "rxjs/operators";

export interface PaginatedSort<T> {
  property: keyof T;
  order: "asc" | "desc";
}

export interface PageRequest<T, Q> {
  limit: number;
  page: number;
  sort?: PaginatedSort<T>;
  query?: Q;
}

export interface Page<T> {
  data: T[];
  count: number;
  limit: number;
  page: number;
}

export type PaginatedEndpoint<T, Q> = (
  pageable: PageRequest<T, Q>
) => Observable<Page<T>>;

export function prepare<T>(
  callback: () => void
): (source: Observable<T>) => Observable<T> {
  return (source: Observable<T>): Observable<T> =>
    defer(() => {
      callback();
      return source;
    });
}

export function indicate<T>(
  indicator: Subject<boolean>
): (source: Observable<T>) => Observable<T> {
  return (source: Observable<T>): Observable<T> =>
    source.pipe(
      prepare(() => indicator.next(true)),
      finalize(() => indicator.next(false))
    );
}

export interface SimpleDataSource<T> extends DataSource<T> {
  connect(): Observable<T[]>;
  disconnect(): void;
}

export class PaginatedDataSource<T, Q> implements SimpleDataSource<T> {
  private pageNumber = new Subject<number>();
  private sort: BehaviorSubject<PaginatedSort<T>>;
  private query = new BehaviorSubject<Q>({} as Q);
  private loading = new Subject<boolean>();

  public loading$ = this.loading.asObservable();
  public query$ = this.query.asObservable();
  public page$: BehaviorSubject<Page<T>> = new BehaviorSubject<Page<T>>({
    data: [],
    count: 0,
    limit: 0,
    page: 0,
  });
  public data$: BehaviorSubject<T[]> = new BehaviorSubject<T[]>([]);
  public displayedColumns: string[] = [];
  public pageSizeOptions: number[] = [5, 10, 25, 100];
  public pageSize$ = new BehaviorSubject(10);

  constructor(
    private endpoint: PaginatedEndpoint<T, Q>,
    config: {
      displayedColumns: string[];
      sort: PaginatedSort<T>;
      log: Logger;
      query?: Q;
      pageSize?: number;
    }
  ) {
    this.displayedColumns = config.displayedColumns;
    this.sort = new BehaviorSubject<PaginatedSort<T>>(config.sort);

    if (config.pageSize) this.pageSize$.next(config.pageSize);
    if (config.query) this.query.next(config.query);

    const param$ = combineLatest([this.query, this.sort, this.pageSize$]).pipe(
      switchMap(([query, sort, limit]) =>
        this.pageNumber.pipe(
          startWith(0),
          switchMap((page) =>
            this.endpoint({ page, sort, limit, query }).pipe(
              indicate(this.loading)
            )
          )
        )
      ),
      catchError((error) => {
        config.log.error(error);
        return of({ data: [], count: 0, limit: 0, page: 0 });
      }),
      share()
    );
    param$.subscribe({
      next: (page) => {
        this.page$.next(page);
        this.data$.next(page.data);
      },
      error: (error) => config.log.error(error),
    });
  }

  refresh(): void {
    this.query.next(this.query.getValue());
  }

  sortBy(sort: Partial<PaginatedSort<T>>): void {
    const lastSort = this.sort.getValue();
    const nextSort = { ...lastSort, ...sort };
    this.sort.next(nextSort);
  }

  queryBy(query: Partial<Q>): void {
    const lastQuery = this.query.getValue();
    const nextQuery = { ...lastQuery, ...query };
    this.query.next(nextQuery);
  }

  fetch(page: number): void {
    this.pageNumber.next(page);
  }

  connect(): BehaviorSubject<T[]> {
    return this.data$;
  }

  disconnect = noop;
}
