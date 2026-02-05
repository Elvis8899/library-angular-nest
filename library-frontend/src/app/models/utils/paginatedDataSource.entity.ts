import { DataSource } from "@angular/cdk/collections";
import {
  BehaviorSubject,
  combineLatest,
  defer,
  noop,
  Observable,
  Subject,
} from "rxjs";
import { finalize, map, share, startWith, switchMap } from "rxjs/operators";

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
  public page$: Observable<Page<T>>;

  constructor(
    private endpoint: PaginatedEndpoint<T, Q>,
    initialSort: PaginatedSort<T>,
    initialQuery: Q,
    public pageSize = 20
  ) {
    this.query.next(initialQuery);
    this.sort = new BehaviorSubject<PaginatedSort<T>>(initialSort);
    const param$ = combineLatest([this.query, this.sort]);
    this.page$ = param$.pipe(
      switchMap(([query, sort]) =>
        this.pageNumber.pipe(
          startWith(0),
          switchMap((page) =>
            this.endpoint({ page, sort, limit: this.pageSize, query }).pipe(
              indicate(this.loading)
            )
          )
        )
      ),
      share()
    );
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

  connect(): Observable<T[]> {
    return this.page$.pipe(map((page) => page.data));
  }

  disconnect = noop;
}
