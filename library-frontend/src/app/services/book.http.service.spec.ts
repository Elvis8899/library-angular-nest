import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { BookEntity, BookItemEntity } from "@app/models/book.entity";
import { BookService } from "@app/services/book.http.service";
import {
  createServiceFactory,
  SpectatorService,
} from "@ngneat/spectator/vitest";

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

  it("Should create a book", () => {
    spectator.service.addBook({ name: "Dom Casmurro" }).subscribe();

    const req = http.expectOne({ method: "POST", url: "/v1/bookInfos" });
    expect(req.request.body).toEqual({ name: "Dom Casmurro" });
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
    const item = { bookInfoId: "book-1" } as Partial<BookItemEntity>;
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
