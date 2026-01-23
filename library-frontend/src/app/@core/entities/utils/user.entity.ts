export class PaginatedResponse<Data> {
  count: number;
  limit: number;
  page: number;
  data: Data[];
}
