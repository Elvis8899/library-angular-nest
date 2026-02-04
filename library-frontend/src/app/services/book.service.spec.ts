import { BookEntity } from "@app/models/book.entity";
import { BookService } from "@app/services/book.service";
import {
  createHttpFactory,
  HttpMethod,
  SpectatorHttp,
} from "@ngneat/spectator";

const book: BookEntity = {
  id: "id",
  name: "name",
  image: "image",
  price: "price",
  bookItems: [],
  createdAt: new Date().toString(),
  updatedAt: new Date().toString(),
};
describe("HttpClient testing", () => {
  let spectator: SpectatorHttp<BookService>;
  const createHttp = createHttpFactory(BookService);

  beforeEach(() => (spectator = createHttp()));

  it("Should Get Paginated Books", () => {
    spectator.service.getPaginatedBooks().subscribe();
    spectator.expectOne("/v1/bookInfos", HttpMethod.GET);
  });

  it("", () => {
    spectator.service.addBook(book).subscribe();

    const req = spectator.expectOne("/v1/bookInfos", HttpMethod.POST);
    expect(req.request.body["id"]).toEqual(book.id);
  });

  it("can test HttpClient.post", () => {
    spectator.service.addBook(book).subscribe();

    const req = spectator.expectOne("/v1/bookInfos", HttpMethod.POST);
    expect(req.request.body["id"]).toEqual(book.id);
  });

  // getBook
  // editBook
  // deleteBook
  // addBookItem
  // deleteBookItem
});
