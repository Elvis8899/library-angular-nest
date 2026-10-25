import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { PageRequest } from "@app/models/utils/pageRequest.entity";
import { BookEntity, BookQuery } from "@app/pages/books/book.entity";
import { PageRequestUtility } from "@app/shared/utils/pageRequest.utility";
import type {
  BookInfoPage,
  BookInfoRequest,
  BookItemRequest,
  Created,
} from "@library/contracts";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class BookService {
  private readonly _http = inject(HttpClient);

  getPaginatedBooks(
    req?: PageRequest<BookEntity, BookQuery>
  ): Observable<BookInfoPage> {
    let params = PageRequestUtility.toHttpParams(req);
    const name = req?.query?.name?.trim();
    if (name) params = params.append("name", name);
    const day = req?.query?.createdAt;
    if (day) {
      // The picked day in the user's time zone, as an instant range
      const start = new Date(day.getFullYear(), day.getMonth(), day.getDate());
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      params = params
        .append("createdFrom", start.toISOString())
        .append("createdBefore", end.toISOString());
    }
    return this._http.get<BookInfoPage>("/v1/bookInfos", {
      params,
    });
  }

  addBook(book: BookInfoRequest): Observable<Created> {
    return this._http.post<Created>("/v1/bookInfos", book);
  }

  /** Uploads the book's cover, replacing the one it had. */
  changeCover(bookId: string, cover: File): Observable<void> {
    const form = new FormData();
    form.append("file", cover);
    return this._http.put<void>(`/v1/bookInfos/${bookId}/cover`, form);
  }

  removeCover(bookId: string): Observable<void> {
    return this._http.delete<void>(`/v1/bookInfos/${bookId}/cover`);
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

  addBookItem(bookItem: BookItemRequest): Observable<void> {
    return this._http.post<void>("/v1/bookInfos/item", bookItem);
  }

  deleteBookItem(bookItemId: string): Observable<void> {
    return this._http.delete<void>(`/v1/bookInfos/item/${bookItemId}`, {
      body: {},
    });
  }
}
