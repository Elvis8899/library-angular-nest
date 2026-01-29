import { HttpClient } from "@angular/common/http";
import { Injectable, inject } from "@angular/core";
import { Credentials, UserEntity } from "@app/core/entities";
import { PaginatedResponse } from "@app/core/entities/utils/paginatedResponse.entity";
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

  getPaginatedUsers(): Observable<PaginatedResponse<UserEntity>> {
    return this._http.get<PaginatedResponse<UserEntity>>("/v1/users");
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
