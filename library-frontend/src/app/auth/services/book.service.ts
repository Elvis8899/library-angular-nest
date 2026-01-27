import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { BookEntity, BookItemEntity } from "@app/@core/entities";
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

  editBook(book: BookEntity): Observable<null> {
    return this._http.put<null>(`/v1/bookInfos/${book.id}`, book);
  }

  deleteBook(book: BookEntity): Observable<null> {
    return this._http.delete<null>(`/v1/bookInfos/${book.id}`);
  }

  addBookItem(bookItem: Partial<BookItemEntity>): Observable<null> {
    return this._http.post<null>("/v1/bookInfos/item", bookItem);
  }

  deleteBookItem(bookItemId: string): Observable<null> {
    return this._http.delete<null>(`/v1/bookInfos/item/${bookItemId}`, {
      body: {},
    });
  }
}
