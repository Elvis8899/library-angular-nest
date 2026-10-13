import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import {
  BookRentalEntity,
  BookRentEntity,
} from "@app/models/bookRental.entity";
import { RentalService } from "@app/services/rental.http.service";
import {
  createServiceFactory,
  SpectatorService,
} from "@ngneat/spectator/vitest";

describe("RentalService", () => {
  let spectator: SpectatorService<RentalService>;
  let http: HttpTestingController;
  const createService = createServiceFactory({
    service: RentalService,
    providers: [provideHttpClient(), provideHttpClientTesting()],
  });

  beforeEach(() => {
    spectator = createService();
    http = spectator.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it("Should get a page of rentals", () => {
    const rental = { id: "rental-1" } as BookRentalEntity;
    const response = { data: [rental], count: 1, limit: 5, page: 0 };
    let result: unknown;

    spectator.service
      .getPaginatedBookRentals({
        page: 0,
        limit: 5,
        sort: { property: "createdAt", order: "desc" },
      })
      .subscribe((page) => (result = page));

    const req = http.expectOne(
      (r) => r.method === "GET" && r.url === "/v1/bookRentals"
    );
    expect(req.request.params.has("page")).toBe(false);
    expect(req.request.params.get("limit")).toBe("5");
    expect(req.request.params.get("sortBy")).toBe("createdAt");
    expect(req.request.params.get("order")).toBe("desc");
    req.flush(response);
    expect(result).toEqual(response);
  });

  it("Should rent a book", () => {
    const rent = { bookItemId: "item-1", userId: "user-1" } as BookRentEntity;
    spectator.service.rentBook(rent).subscribe();

    const req = http.expectOne({ method: "POST", url: "/v1/bookRentals/rent" });
    expect(req.request.body).toEqual(rent);
    req.flush({});
  });

  it("Should return a book", () => {
    spectator.service.returnBook("rental-1").subscribe();

    const req = http.expectOne({
      method: "PUT",
      url: "/v1/bookRentals/return/rental-1",
    });
    expect(req.request.body).toEqual({});
    req.flush({});
  });
});
