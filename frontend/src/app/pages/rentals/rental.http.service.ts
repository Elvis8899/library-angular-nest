import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { PageRequest } from "@app/models/utils/pageRequest.entity";
import { PaginatedResponse } from "@app/models/utils/paginatedResponse.entity";
import {
  BookRentalEntity,
  BookRentEntity,
} from "@app/pages/rentals/bookRental.entity";
import { PageRequestUtility } from "@app/shared/utils/pageRequest.utility";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class RentalService {
  private readonly _http = inject(HttpClient);

  getPaginatedBookRentals(
    req?: PageRequest<BookRentalEntity, object>
  ): Observable<PaginatedResponse<BookRentalEntity>> {
    const params = PageRequestUtility.toHttpParams(req);
    return this._http.get<PaginatedResponse<BookRentalEntity>>(
      "/v1/bookRentals",
      { params }
    );
  }

  returnBook(id: string): Observable<unknown> {
    return this._http.put(`/v1/bookRentals/return/${id}`, {});
  }

  rentBook(rentBook: BookRentEntity): Observable<unknown> {
    return this._http.post("/v1/bookRentals/rent", rentBook);
  }
}
