import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { BookEntity } from "@app/pages/books/book.entity";
import { BookService } from "@app/pages/books/book.http.service";
import {
  createServiceFactory,
  SpectatorService,
} from "@openng/spectator/vitest";

describe("BookService", () => {
  let spectator: SpectatorService<BookService>;
  let http: HttpTestingController;
  const createService = createServiceFactory({
    service: BookService,
    providers: [provideHttpClient(), provideHttpClientTesting()],
  });
  const book = { id: "book-1", name: "Dom Casmurro" } as BookEntity;

  beforeEach(() => {
    spectator = createService();
    http = spectator.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it("Should get a page of books", () => {
    const response = { data: [book], count: 1, limit: 10, page: 1 };
    let result: unknown;

    spectator.service
      .getPaginatedBooks({ page: 1, limit: 10 })
      .subscribe((page) => (result = page));

    const req = http.expectOne(
      (r) => r.method === "GET" && r.url === "/v1/bookInfos"
    );
    expect(req.request.params.get("page")).toBe("1");
    expect(req.request.params.get("limit")).toBe("10");
    req.flush(response);
    expect(result).toEqual(response);
  });

  it("Should search books by name", () => {
    spectator.service
      .getPaginatedBooks({ page: 0, limit: 10, query: { name: " Dom " } })
      .subscribe();

    const req = http.expectOne((r) => r.url === "/v1/bookInfos");
    expect(req.request.params.get("name")).toBe("Dom");
    req.flush({ data: [], count: 0, limit: 10, page: 0 });
  });

  it("Should not send a blank search", () => {
    spectator.service
      .getPaginatedBooks({ page: 0, limit: 10, query: { name: "  " } })
      .subscribe();

    const req = http.expectOne((r) => r.url === "/v1/bookInfos");
    expect(req.request.params.has("name")).toBe(false);
    req.flush({ data: [], count: 0, limit: 10, page: 0 });
  });

  it("Should filter by the picked day, in the local time zone", () => {
    const picked = new Date(2026, 9, 13, 15, 30);

    spectator.service
      .getPaginatedBooks({ page: 0, limit: 10, query: { createdAt: picked } })
      .subscribe();

    const req = http.expectOne((r) => r.url === "/v1/bookInfos");
    expect(req.request.params.get("createdFrom")).toBe(
      new Date(2026, 9, 13).toISOString()
    );
    expect(req.request.params.get("createdBefore")).toBe(
      new Date(2026, 9, 14).toISOString()
    );
    req.flush({ data: [], count: 0, limit: 10, page: 0 });
  });

  it("Should not filter by date once the date is cleared", () => {
    spectator.service
      .getPaginatedBooks({ page: 0, limit: 10, query: { createdAt: null } })
      .subscribe();

    const req = http.expectOne((r) => r.url === "/v1/bookInfos");
    expect(req.request.params.has("createdFrom")).toBe(false);
    expect(req.request.params.has("createdBefore")).toBe(false);
    req.flush({ data: [], count: 0, limit: 10, page: 0 });
  });

  it("Should send the sort field and order", () => {
    spectator.service
      .getPaginatedBooks({
        page: 0,
        limit: 10,
        sort: { property: "name", order: "asc" },
      })
      .subscribe();

    const req = http.expectOne((r) => r.url === "/v1/bookInfos");
    expect(req.request.params.get("sortBy")).toBe("name");
    expect(req.request.params.get("order")).toBe("asc");
    req.flush({ data: [], count: 0, limit: 10, page: 0 });
  });

  it("Should create a book", () => {
    const book = { name: "Dom Casmurro", price: 30 };
    spectator.service.addBook(book).subscribe();

    const req = http.expectOne({ method: "POST", url: "/v1/bookInfos" });
    expect(req.request.body).toEqual(book);
    req.flush(null);
  });

  it("Should get a book", () => {
    let result: unknown;
    spectator.service.getBook(book).subscribe((b) => (result = b));

    http.expectOne({ method: "GET", url: "/v1/bookInfos/book-1" }).flush(book);
    expect(result).toEqual(book);
  });

  it("Should update a book", () => {
    spectator.service.editBook(book).subscribe();

    const req = http.expectOne({ method: "PUT", url: "/v1/bookInfos/book-1" });
    expect(req.request.body).toEqual(book);
    req.flush(null);
  });

  it("Should delete a book", () => {
    spectator.service.deleteBook(book).subscribe();

    http
      .expectOne({ method: "DELETE", url: "/v1/bookInfos/book-1" })
      .flush(null);
  });

  it("Should add a copy of a book", () => {
    const item = { bookId: "book-1" };
    spectator.service.addBookItem(item).subscribe();

    const req = http.expectOne({ method: "POST", url: "/v1/bookInfos/item" });
    expect(req.request.body).toEqual(item);
    req.flush(null);
  });

  it("Should remove a copy of a book", () => {
    spectator.service.deleteBookItem("item-1").subscribe();

    const req = http.expectOne({
      method: "DELETE",
      url: "/v1/bookInfos/item/item-1",
    });
    expect(req.request.body).toEqual({});
    req.flush(null);
  });
});
