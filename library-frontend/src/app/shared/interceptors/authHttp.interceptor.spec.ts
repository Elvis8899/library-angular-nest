import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { authHttpInterceptor } from "@app/shared/interceptors/authHttp.interceptor";
import {
  createInjectionContextFactory,
  SpectatorInjectionContext,
} from "@ngneat/spectator/vitest";
import { TranslateService } from "@ngx-translate/core";
import { Mock } from "vitest";

describe("AuthenticationHttpInterceptor", () => {
  let spectator: SpectatorInjectionContext;
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
  let getItemSpy: Mock<(x: string) => string | null>;
  const createContext = createInjectionContextFactory({
    mocks: [TranslateService],
    providers: [
      provideHttpClient(withInterceptors([authHttpInterceptor])),
      provideHttpClientTesting(),
    ],
  });

  beforeEach(() => {
    spectator = createContext();
    httpMock = spectator.inject(HttpTestingController);
    httpClient = spectator.inject(HttpClient);
    const translateService = spectator.inject(TranslateService);
    translateService.getCurrentLang.mockReturnValue("pt-BR");
    getItemSpy = vi
      .spyOn(Storage.prototype, "getItem")
      .mockReturnValue(JSON.stringify({ accessToken: "test_token" }));
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should not add Authorization header - header has noauth", () => {
    httpClient.get("/test", { headers: { noauth: "true" } }).subscribe();
    const req = httpMock.expectOne("/test");
    req.flush({});
    expect(req.request.headers.has("Authorization")).toBeFalsy();
  });

  it("should not add Authorization header - no access token", () => {
    getItemSpy.mockReturnValue(null);

    httpClient.get("/test").subscribe();
    const req = httpMock.expectOne("/test");
    req.flush({});
    expect(req.request.headers.has("Authorization")).toBeFalsy();
  });

  it("should add Authorization header", () => {
    httpClient.get("/test").subscribe();
    const req = httpMock.expectOne("/test");
    req.flush({});
    expect(req.request.headers.has("Authorization")).toBeTruthy();
    expect(req.request.headers.get("Authorization")).toBe("Bearer test_token");
  });

  it("Should cache requests", () => {
    httpClient.get("/test").subscribe();
    httpClient.get("/test").subscribe();

    const req = httpMock.expectOne("/test");
    req.flush({});
    expect(req.request.headers.has("Authorization")).toBeTruthy();
    expect(req.request.headers.get("Authorization")).toBe("Bearer test_token");
  });

  it("Should error on status != (401 and 403)", () => {
    let check = false;
    httpClient.get("/test").subscribe({
      error: () => {
        check = true;
      },
    });
    const req = httpMock.expectOne("/test");
    req.flush({}, { status: 500, statusText: "Unknown" });
    expect(req.request.headers.has("Authorization")).toBeTruthy();
    expect(req.request.headers.get("Authorization")).toBe("Bearer test_token");
    expect(check).toBe(true);
  });
});
