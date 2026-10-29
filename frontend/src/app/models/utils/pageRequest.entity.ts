import { Observable } from "rxjs";

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
  pageable: PageRequest<T, Q>,
) => Observable<Page<T>>;
