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
import { Logger } from "@app/services/logger.service";
import { errorHandlerInterceptor } from "@app/shared/interceptors/error-handler.interceptor";
import {
  createInjectionContextFactory,
  SpectatorInjectionContext,
} from "@ngneat/spectator/vitest";
import { TranslateService } from "@ngx-translate/core";

Logger.level = 0;

describe("ErrorHandlerInterceptor", () => {
  let spectator: SpectatorInjectionContext;
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;

  let check = false;
  const createContext = createInjectionContextFactory({
    mocks: [TranslateService, Router],
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
});
