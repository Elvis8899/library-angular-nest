import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { BookEntity } from "@app/@core/entities";
import { PaginatedResponse } from "@app/@core/entities/utils/paginatedResponse.entity";

@Injectable({
  providedIn: "root",
})
export class BookService {
  private readonly _http = inject(HttpClient);

  getPaginatedBooks(): Observable<PaginatedResponse<BookEntity>> {
    return this._http.get<PaginatedResponse<BookEntity>>("/v1/bookInfos");
  }

  addBook(book: Partial<BookEntity>): Observable<BookEntity> {
    return this._http.post<BookEntity>("/v1/bookInfos", book);
  }

  getBook(book: BookEntity): Observable<BookEntity> {
    return this._http.get<BookEntity>(`/v1/bookInfos/${book.id}`);
  }

  editBook(book: BookEntity): Observable<string> {
    return this._http.put(`/v1/bookInfos/${book.id}`, book, {
      responseType: "text",
    });
  }

  deleteBook(book: BookEntity): Observable<string> {
    return this._http.delete(`/v1/bookInfos/${book.id}`, {
      responseType: "text",
    });
  }
}
