import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import {
  BookRentalEntity,
  BookRentEntity,
} from "@app/models/bookRental.entity";
import { PageRequest } from "@app/models/utils/paginatedDataSource.entity";
import { PaginatedResponse } from "@app/models/utils/paginatedResponse.entity";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class RentalService {
  private readonly _http = inject(HttpClient);

  getPaginatedBookRentals(
    req?: PageRequest<BookRentalEntity, object>
  ): Observable<PaginatedResponse<BookRentalEntity>> {
    let params = new HttpParams();
    if (req?.page) params = params.append("page", req?.page);
    if (req?.limit) params = params.append("limit", req.limit.toString());
    if (req?.sort) params = params.append("sort", JSON.stringify(req.sort));
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

  // addBook(book: Partial<BookEntity>): Observable<BookEntity> {
  //   return this._http.post<BookEntity>("/v1/bookInfos", book);
  // }

  // getBook(book: BookEntity): Observable<BookEntity> {
  //   return this._http.get<BookEntity>(`/v1/bookInfos/${book.id}`);
  // }

  // editBook(book: BookEntity): Observable<string> {
  //   return this._http.put(`/v1/bookInfos/${book.id}`, book, {
  //     responseType: "text",
  //   });
  // }

  // deleteBook(book: BookEntity): Observable<string> {
  //   return this._http.delete(`/v1/bookInfos/${book.id}`, {
  //     responseType: "text",
  //   });
  // }
}
