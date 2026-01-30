import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import {
  BookRentalEntity,
  BookRentEntity,
} from "@app/models/bookRental.entity";
import { PaginatedResponse } from "@app/models/utils/paginatedResponse.entity";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class RentalService {
  private readonly _http = inject(HttpClient);

  getPaginatedBookRentals(): Observable<PaginatedResponse<BookRentalEntity>> {
    return this._http.get<PaginatedResponse<BookRentalEntity>>(
      "/v1/bookRentals"
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
