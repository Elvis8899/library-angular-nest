import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { Router } from "@angular/router";
import { Credentials, ROLE } from "@app/models/credentials.entity";
import { AuthenticationService } from "@app/services/authentication.service";
import { CredentialsService } from "@app/services/credentials.service";
import { Logger } from "@app/services/logger.service";
import { errorHandlerInterceptor } from "@app/shared/interceptors/error-handler.interceptor";
import {
  createInjectionContextFactory,
  SpectatorInjectionContext,
} from "@ngneat/spectator/vitest";
import { TranslateService } from "@ngx-translate/core";
import { of, throwError } from "rxjs";

Logger.level = 0;

describe("ErrorHandlerInterceptor", () => {
  let spectator: SpectatorInjectionContext;
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;

  let check = false;
  const createContext = createInjectionContextFactory({
    mocks: [TranslateService, Router, AuthenticationService],
    providers: [
      provideHttpClient(withInterceptors([errorHandlerInterceptor])),
      provideHttpClientTesting(),
    ],
  });

  beforeEach(() => {
    spectator = createContext();
    httpMock = spectator.inject(HttpTestingController);
    httpClient = spectator.inject(HttpClient);
    const translateService = spectator.inject(TranslateService);
    translateService.getCurrentLang.mockReturnValue("pt-BR");
    httpClient.get("/test").subscribe({
      error: (error) => {
        expect(error?.message).toBe("error");
        check = true;
      },
    });
  });

  afterEach(() => {
    httpMock.verify();
    spectator.inject(CredentialsService).clearCredentials();
    check = false;
  });

  it("Should do nothing if no error", () => {
    const req = httpMock.expectOne("/test");
    req.flush({}, { status: 200, statusText: "ok" });
    // Assert
    expect(check).toBe(false);
  });

  it("Should return error", () => {
    const req = httpMock.expectOne("/test");
    req.flush(new Error("error"), { status: 500, statusText: "error" });
    // Assert
    expect(check).toBe(true);
  });

  it("Should return new error if no error message", () => {
    let check = false;
    httpClient.get("/test2").subscribe({
      error: (error) => {
        expect(error?.message).toBe(
          "Something bad happened; please try again later."
        );
        check = true;
      },
    });
    const req = httpMock.expectOne("/test2");
    httpMock.expectOne("/test").flush("");
    req.flush("", { status: 500, statusText: "error" });
    // Assert
    expect(check).toBe(true);
  });

  it("Should logout on status 401 or 403", () => {
    const req = httpMock.expectOne("/test");
    req.flush(new Error("error"), { status: 401, statusText: "error" });
    // Assert
    expect(check).toBe(true);
    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(["/login"]);
  });
  it("Should logout on status 401 or 403", () => {
    const req = httpMock.expectOne("/test");
    req.flush(new Error("error"), { status: 403, statusText: "error" });
    // Assert
    expect(check).toBe(true);
    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(["/login"]);
  });

  describe("with a refresh token", () => {
    const credentials: Credentials = {
      accessToken: "old",
      refreshToken: "refresh",
      user: { id: "id", name: "name", email: "email", role: ROLE.CLIENT },
    };

    beforeEach(() => {
      spectator.inject(CredentialsService).setCredentials(credentials);
    });

    it("Should refresh tokens and retry the request on 401", () => {
      const authService = spectator.inject(AuthenticationService);
      authService.refresh.mockReturnValue(
        of({ ...credentials, accessToken: "new" })
      );

      httpMock
        .expectOne("/test")
        .flush(new Error("error"), { status: 401, statusText: "error" });
      const retry = httpMock.expectOne("/test");
      expect(retry.request.headers.get("Authorization")).toBe("Bearer new");
      retry.flush({}, { status: 200, statusText: "ok" });

      expect(authService.refresh).toHaveBeenCalledTimes(1);
      expect(check).toBe(false);
      expect(spectator.inject(Router).navigate).not.toHaveBeenCalled();
    });

    it("Should logout if refresh fails", () => {
      spectator
        .inject(AuthenticationService)
        .refresh.mockReturnValue(throwError(() => new Error("expired")));

      httpMock
        .expectOne("/test")
        .flush(new Error("error"), { status: 401, statusText: "error" });

      expect(check).toBe(true);
      expect(spectator.inject(Router).navigate).toHaveBeenCalledWith([
        "/login",
      ]);
    });

    it("Should logout if retried request fails with 401", () => {
      spectator
        .inject(AuthenticationService)
        .refresh.mockReturnValue(of({ ...credentials, accessToken: "new" }));

      httpMock
        .expectOne("/test")
        .flush(new Error("error"), { status: 401, statusText: "error" });
      httpMock
        .expectOne("/test")
        .flush(new Error("error"), { status: 401, statusText: "error" });

      expect(check).toBe(true);
      expect(spectator.inject(Router).navigate).toHaveBeenCalledWith([
        "/login",
      ]);
    });

    it("Should not refresh on 401 from login", () => {
      httpClient.post("/v1/login", {}).subscribe({ error: () => undefined });
      httpMock.expectOne("/test").flush({});
      httpMock
        .expectOne("/v1/login")
        .flush(new Error("error"), { status: 401, statusText: "error" });

      expect(
        spectator.inject(AuthenticationService).refresh
      ).not.toHaveBeenCalled();
    });
  });
});
