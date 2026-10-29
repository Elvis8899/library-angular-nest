import {
  HttpClient,
  HttpStatusCode,
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
import { Logger, LogLevel } from "@app/services/logger.service";
import { errorHandlerInterceptor } from "@app/shared/interceptors/errorHandler.interceptor";
import { TranslateService } from "@ngx-translate/core";
import {
  createInjectionContextFactory,
  SpectatorInjectionContext,
} from "@openng/spectator/vitest";
import { of, throwError } from "rxjs";

Logger.level = LogLevel.Off;

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
    // A missing translation returns its key, as ngx-translate does
    translateService.instant.mockImplementation((key: string) =>
      key === "errors.user.cpfTaken" ? "CPF já usado" : key,
    );
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
    req.flush({}, { status: HttpStatusCode.Ok, statusText: "ok" });
    // Assert
    expect(check).toBe(false);
  });

  it("Should return error", () => {
    const req = httpMock.expectOne("/test");
    req.flush(new Error("error"), {
      status: HttpStatusCode.InternalServerError,
      statusText: "error",
    });
    // Assert
    expect(check).toBe(true);
  });

  it("Should return new error if no error message", () => {
    let check = false;
    httpClient.get("/test2").subscribe({
      error: (error) => {
        expect(error?.message).toBe("errors.unknown");
        check = true;
      },
    });
    const req = httpMock.expectOne("/test2");
    httpMock.expectOne("/test").flush("");
    req.flush("", {
      status: HttpStatusCode.InternalServerError,
      statusText: "error",
    });
    // Assert
    expect(check).toBe(true);
  });

  it("Should return the unknown error for a proxy's HTML page", () => {
    let check = false;
    httpClient.get("/test2").subscribe({
      error: (error) => {
        expect(error?.message).toBe("errors.unknown");
        check = true;
      },
    });
    const req = httpMock.expectOne("/test2");
    httpMock.expectOne("/test").flush("");
    req.flush("<html><head><title>502 Bad Gateway</title></head></html>", {
      status: HttpStatusCode.BadGateway,
      statusText: "Bad Gateway",
    });
    // Assert
    expect(check).toBe(true);
  });

  it.each([
    ["translated when there's a translation", "user.cpfTaken", "CPF já usado"],
    ["the API's when there's none", "user.unknownCode", "Mensagem da API"],
  ])("Should show an API error's message %s", (_, code, message) => {
    let received: { message?: string; code?: string } | undefined;
    httpClient
      .get("/test3")
      .subscribe({ error: (error) => (received = error) });
    httpMock.expectOne("/test").flush("");
    // Act
    httpMock.expectOne("/test3").flush(
      {
        statusCode: HttpStatusCode.Conflict,
        message: "Mensagem da API",
        code,
      },
      { status: HttpStatusCode.Conflict, statusText: "Conflict" },
    );
    // Assert
    expect(received?.message).toBe(message);
    expect(received?.code).toBe(code);
  });

  it.each([HttpStatusCode.Unauthorized, HttpStatusCode.Forbidden])(
    "Should logout on status %i without a code",
    (status) => {
      const req = httpMock.expectOne("/test");
      req.flush(new Error("error"), { status, statusText: "error" });
      // Assert
      expect(check).toBe(true);
      expect(spectator.inject(Router).navigate).toHaveBeenCalledWith([
        "/login",
      ]);
    },
  );

  it("Should show a 403 with a code without logging out", () => {
    let received: { message?: string } | undefined;
    httpClient
      .get("/test4")
      .subscribe({ error: (error) => (received = error) });
    httpMock.expectOne("/test").flush("");
    // Act
    httpMock.expectOne("/test4").flush(
      {
        statusCode: HttpStatusCode.Forbidden,
        message: "Mensagem da API",
        code: "user.cpfTaken",
      },
      { status: HttpStatusCode.Forbidden, statusText: "Forbidden" },
    );
    // Assert
    expect(received?.message).toBe("CPF já usado");
    expect(spectator.inject(Router).navigate).not.toHaveBeenCalled();
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
        of({ ...credentials, accessToken: "new" }),
      );

      httpMock.expectOne("/test").flush(new Error("error"), {
        status: HttpStatusCode.Unauthorized,
        statusText: "error",
      });
      const retry = httpMock.expectOne("/test");
      expect(retry.request.headers.get("Authorization")).toBe("Bearer new");
      retry.flush({}, { status: HttpStatusCode.Ok, statusText: "ok" });

      expect(authService.refresh).toHaveBeenCalledTimes(1);
      expect(check).toBe(false);
      expect(spectator.inject(Router).navigate).not.toHaveBeenCalled();
    });

    it("Should logout if refresh fails", () => {
      spectator
        .inject(AuthenticationService)
        .refresh.mockReturnValue(throwError(() => new Error("expired")));

      httpMock.expectOne("/test").flush(new Error("error"), {
        status: HttpStatusCode.Unauthorized,
        statusText: "error",
      });

      expect(check).toBe(true);
      expect(spectator.inject(Router).navigate).toHaveBeenCalledWith([
        "/login",
      ]);
    });

    it("Should logout if retried request fails with 401", () => {
      spectator
        .inject(AuthenticationService)
        .refresh.mockReturnValue(of({ ...credentials, accessToken: "new" }));

      httpMock.expectOne("/test").flush(new Error("error"), {
        status: HttpStatusCode.Unauthorized,
        statusText: "error",
      });
      httpMock.expectOne("/test").flush(new Error("error"), {
        status: HttpStatusCode.Unauthorized,
        statusText: "error",
      });

      expect(check).toBe(true);
      expect(spectator.inject(Router).navigate).toHaveBeenCalledWith([
        "/login",
      ]);
    });

    it("Should not refresh on 401 from login", () => {
      httpClient.post("/v1/login", {}).subscribe({ error: () => undefined });
      httpMock.expectOne("/test").flush({});
      httpMock.expectOne("/v1/login").flush(new Error("error"), {
        status: HttpStatusCode.Unauthorized,
        statusText: "error",
      });

      expect(
        spectator.inject(AuthenticationService).refresh,
      ).not.toHaveBeenCalled();
    });
  });
});
