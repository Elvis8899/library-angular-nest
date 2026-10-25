import { provideHttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { ROLE } from "@app/models/credentials.entity";
import { UserEntity } from "@app/models/user.entity";
import { UserService } from "@app/services/user.http.service";
import {
  createServiceFactory,
  SpectatorService,
} from "@openng/spectator/vitest";

describe("UserService", () => {
  let spectator: SpectatorService<UserService>;
  let http: HttpTestingController;
  const createService = createServiceFactory({
    service: UserService,
    providers: [provideHttpClient(), provideHttpClientTesting()],
  });
  const user = { id: "user-1", name: "João da Silva" } as UserEntity;

  beforeEach(() => {
    spectator = createService();
    http = spectator.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it("Should log in", () => {
    const credentials = { email: "admin@admin.com", password: "secret" };
    spectator.service.login(credentials).subscribe();

    const req = http.expectOne({ method: "POST", url: "/v1/login" });
    expect(req.request.body).toEqual(credentials);
    req.flush({});
  });

  it("Should log out", () => {
    spectator.service.logout().subscribe();

    http.expectOne({ method: "POST", url: "/v1/logout" }).flush(null);
  });

  it("Should refresh the tokens without the access token", () => {
    spectator.service.refresh("refresh-token").subscribe();

    const req = http.expectOne({ method: "POST", url: "/v1/refresh" });
    expect(req.request.body).toEqual({ refreshToken: "refresh-token" });
    // The auth interceptor skips requests with this header
    expect(req.request.headers.get("noauth")).toBe("true");
    req.flush({});
  });

  it("Should get a page of users", () => {
    const response = { data: [user], count: 1, limit: 20, page: 3 };
    let result: unknown;

    spectator.service
      .getPaginatedUsers({ page: 3, limit: 20 })
      .subscribe((page) => (result = page));

    const req = http.expectOne(
      (r) => r.method === "GET" && r.url === "/v1/users"
    );
    expect(req.request.params.get("page")).toBe("3");
    expect(req.request.params.get("limit")).toBe("20");
    req.flush(response);
    expect(result).toEqual(response);
  });

  it("Should create a user", () => {
    const request = {
      name: "João da Silva",
      email: "joao@example.com",
      password: "1234",
      role: ROLE.CLIENT,
    };
    spectator.service.addUser(request).subscribe();

    const req = http.expectOne({ method: "POST", url: "/v1/users" });
    expect(req.request.body).toEqual(request);
    req.flush(null);
  });

  it("Should get a user", () => {
    let result: unknown;
    spectator.service.getUser(user).subscribe((u) => (result = u));

    http.expectOne({ method: "GET", url: "/v1/users/user-1" }).flush(user);
    expect(result).toEqual(user);
  });

  it("Should update a user", () => {
    let result: unknown;
    spectator.service.editUser(user).subscribe((r) => (result = r));

    const req = http.expectOne({ method: "PUT", url: "/v1/users/user-1" });
    expect(req.request.body).toEqual(user);
    expect(req.request.responseType).toBe("text");
    req.flush("ok");
    expect(result).toBe("ok");
  });

  it("Should delete a user", () => {
    spectator.service.deleteUser(user).subscribe();

    const req = http.expectOne({ method: "DELETE", url: "/v1/users/user-1" });
    expect(req.request.responseType).toBe("text");
    req.flush("");
  });
});
