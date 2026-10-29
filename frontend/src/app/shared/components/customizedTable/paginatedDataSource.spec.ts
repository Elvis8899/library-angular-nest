import { Page, PageRequest } from "@app/models/utils/pageRequest.entity";
import { Logger, LogLevel } from "@app/services/logger.service";
import { PaginatedDataSource } from "@app/shared/components/customizedTable/paginatedDataSource";
import { Observable, of, throwError } from "rxjs";

Logger.level = LogLevel.Off;

interface Item {
  id: string;
  createdAt: string;
}
interface ItemQuery {
  name?: string;
  createdAt?: Date;
}

const page = (data: Item[], pageNumber = 0): Page<Item> => ({
  data,
  count: data.length,
  limit: 10,
  page: pageNumber,
});
const items: Item[] = [
  { id: "1", createdAt: "2026-10-01" },
  { id: "2", createdAt: "2026-10-02" },
];

describe("PaginatedDataSource", () => {
  let log: Logger;
  let endpoint: ReturnType<
    typeof vi.fn<(req: PageRequest<Item, ItemQuery>) => Observable<Page<Item>>>
  >;

  const create = (config: { query?: ItemQuery; pageSize?: number } = {}) =>
    new PaginatedDataSource<Item, ItemQuery>(endpoint, {
      displayedColumns: ["id"],
      sort: { property: "createdAt", order: "desc" },
      log,
      ...config,
    });

  beforeEach(() => {
    log = new Logger("PaginatedDataSourceSpec");
    endpoint = vi.fn((req: PageRequest<Item, ItemQuery>) =>
      of(page(items, req.page)),
    );
  });

  it("Should fetch the first page on creation", () => {
    const dataSource = create({ query: { name: "" } });

    expect(endpoint).toHaveBeenCalledOnce();
    expect(endpoint).toHaveBeenLastCalledWith({
      page: 0,
      limit: 10,
      sort: { property: "createdAt", order: "desc" },
      query: { name: "" },
    });
    expect(dataSource.data$.getValue()).toEqual(items);
    expect(dataSource.page$.getValue()).toEqual(page(items));
    expect(dataSource.displayedColumns).toEqual(["id"]);
  });

  it("Should use the configured page size and an empty query by default", () => {
    create({ pageSize: 25 });

    expect(endpoint).toHaveBeenLastCalledWith(
      expect.objectContaining({ limit: 25, query: {} }),
    );
  });

  it("Should fetch the requested page", () => {
    const dataSource = create();

    dataSource.fetch(2);

    expect(endpoint).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 2 }),
    );
    expect(dataSource.page$.getValue().page).toBe(2);
  });

  it("Should merge a new sort with the current one and go back to the first page", () => {
    const dataSource = create();
    dataSource.fetch(3);

    dataSource.sortBy({ order: "asc" });

    expect(endpoint).toHaveBeenLastCalledWith(
      expect.objectContaining({
        page: 0,
        sort: { property: "createdAt", order: "asc" },
      }),
    );
  });

  it("Should merge a new query with the current one", () => {
    const dataSource = create({ query: { name: "Dom" } });
    const createdAt = new Date(2026, 9, 13);

    dataSource.queryBy({ createdAt });

    expect(endpoint).toHaveBeenLastCalledWith(
      expect.objectContaining({ query: { name: "Dom", createdAt } }),
    );
  });

  it("Should fetch the same query again on refresh", () => {
    const dataSource = create({ query: { name: "Dom" } });

    dataSource.refresh();

    expect(endpoint).toHaveBeenCalledTimes(2);
    expect(endpoint).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 0, query: { name: "Dom" } }),
    );
  });

  it("Should show the loading indicator while fetching", () => {
    const loading: boolean[] = [];
    const dataSource = create();
    dataSource.loading$.subscribe((value) => loading.push(value));

    dataSource.refresh();

    expect(loading).toEqual([true, false]);
  });

  it("Should log the error and show an empty page when fetching fails", () => {
    const errorSpy = vi.spyOn(log, "error");
    const error = new Error("offline");
    endpoint.mockReturnValueOnce(throwError(() => error));

    const dataSource = create();

    expect(errorSpy).toHaveBeenCalledWith(error);
    expect(dataSource.data$.getValue()).toEqual([]);
    expect(dataSource.page$.getValue()).toEqual({
      data: [],
      count: 0,
      limit: 0,
      page: 0,
    });
  });

  it("Should keep fetching after a failed request", () => {
    endpoint.mockReturnValueOnce(throwError(() => new Error("offline")));
    const dataSource = create();

    dataSource.queryBy({ name: "Dom" });

    expect(endpoint).toHaveBeenCalledTimes(2);
    expect(dataSource.data$.getValue()).toEqual(items);
  });

  it("Should give the table the data stream", () => {
    const dataSource = create();

    expect(dataSource.connect()).toBe(dataSource.data$);
    expect(() => dataSource.disconnect()).not.toThrow();
  });
});
