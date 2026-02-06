import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Credentials } from "@app/models/credentials.entity";
import { UserEntity } from "@app/models/user.entity";
import { PageRequest } from "@app/models/utils/paginatedDataSource.entity";
import { PaginatedResponse } from "@app/models/utils/paginatedResponse.entity";
import { Observable } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class UserService {
  private readonly _http = inject(HttpClient);

  register(user: UserEntity): Observable<UserEntity> {
    return this._http.post<UserEntity>("/v1/users", user);
  }

  login(credentials: {
    email: string;
    password: string;
  }): Observable<Credentials> {
    return this._http.post<Credentials>("/v1/login", credentials);
  }

  getPaginatedUsers(
    req?: PageRequest<UserEntity, object>
  ): Observable<PaginatedResponse<UserEntity>> {
    let params = new HttpParams();
    if (req?.page) params = params.append("page", req?.page);
    if (req?.limit) params = params.append("limit", req.limit.toString());
    if (req?.sort) params = params.append("sort", JSON.stringify(req.sort));
    return this._http.get<PaginatedResponse<UserEntity>>("/v1/users", {
      params,
    });
  }

  addUser(user: Partial<UserEntity>): Observable<UserEntity> {
    return this._http.post<UserEntity>("/v1/users", user);
  }

  getUser(user: UserEntity): Observable<UserEntity> {
    return this._http.get<UserEntity>(`/v1/users/${user.id}`);
  }

  editUser(user: UserEntity): Observable<string> {
    return this._http.put(`/v1/users/${user.id}`, user, {
      responseType: "text",
    });
  }

  deleteUser(user: UserEntity): Observable<string> {
    return this._http.delete(`/v1/users/${user.id}`, { responseType: "text" });
  }
}
