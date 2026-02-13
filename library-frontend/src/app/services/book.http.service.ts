import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { BookEntity, BookItemEntity, BookQuery } from "@app/models/book.entity";
import { PageRequest } from "@app/models/utils/paginatedDataSource.entity";
import { PaginatedResponse } from "@app/models/utils/paginatedResponse.entity";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class BookService {
  private readonly _http = inject(HttpClient);

  getPaginatedBooks(
    req?: PageRequest<BookEntity, BookQuery>
  ): Observable<PaginatedResponse<BookEntity>> {
    let params = new HttpParams();
    if (req?.page) params = params.append("page", req?.page);
    if (req?.limit) params = params.append("limit", req.limit.toString());
    if (req?.sort) params = params.append("sort", JSON.stringify(req.sort));
    return this._http.get<PaginatedResponse<BookEntity>>("/v1/bookInfos", {
      params: params,
    });
  }

  addBook(book: Partial<BookEntity>): Observable<void> {
    return this._http.post<void>("/v1/bookInfos", book);
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

  addBookItem(bookItem: Partial<BookItemEntity>): Observable<void> {
    return this._http.post<void>("/v1/bookInfos/item", bookItem);
  }

  deleteBookItem(bookItemId: string): Observable<void> {
    return this._http.delete<void>(`/v1/bookInfos/item/${bookItemId}`, {
      body: {},
    });
  }
}
