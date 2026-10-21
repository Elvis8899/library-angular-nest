import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Credentials } from "@app/models/credentials.entity";
import { UserEntity } from "@app/models/user.entity";
import { PageRequest } from "@app/models/utils/pageRequest.entity";
import { PaginatedResponse } from "@app/models/utils/paginatedResponse.entity";
import { PageRequestUtility } from "@app/shared/utils/pageRequest.utility";
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

  logout(): Observable<void> {
    return this._http.post<void>("/v1/logout", {});
  }

  refresh(refreshToken: string): Observable<Credentials> {
    return this._http.post<Credentials>(
      "/v1/refresh",
      { refreshToken },
      { headers: { noauth: "true" } }
    );
  }

  getPaginatedUsers(
    req?: PageRequest<UserEntity, object>
  ): Observable<PaginatedResponse<UserEntity>> {
    const params = PageRequestUtility.toHttpParams(req);
    return this._http.get<PaginatedResponse<UserEntity>>("/v1/users", {
      params,
    });
  }

  addUser(user: Partial<UserEntity>): Observable<void> {
    return this._http.post<void>("/v1/users", user);
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
