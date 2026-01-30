export class PaginatedEntity {
  pagination: Pagination = {
    page: 1,
    pageSize: 10,
  };
}

export interface Pagination {
  page: number;
  pageSize: number;
  rowCount?: number;
  pageCount?: number;
}
