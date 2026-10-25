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
import { authHttpInterceptor } from "@app/shared/interceptors/authHttp.interceptor";
import { environment } from "@env/environment";
import { TranslateService } from "@ngx-translate/core";
import {
  createInjectionContextFactory,
  SpectatorInjectionContext,
} from "@openng/spectator/vitest";

describe("AuthenticationHttpInterceptor", () => {
  let spectator: SpectatorInjectionContext;
  let httpMock: HttpTestingController;
  let httpClient: HttpClient;
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
    // A remembered login; testSetup.ts empties the storage after each test
    localStorage.setItem(
      "credentials",
      JSON.stringify({ accessToken: "test_token" })
    );
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
    localStorage.removeItem("credentials");

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

  it("should send the default language before one is in use", () => {
    spectator.inject(TranslateService).getCurrentLang.mockReturnValue(null);

    httpClient.get("/test").subscribe();
    const req = httpMock.expectOne("/test");
    req.flush({});
    expect(req.request.headers.get("Accept-Language")).toBe(
      environment.defaultLanguage.substring(0, 2)
    );
  });

  it("Should send a request in flight once, both callers getting its answer", () => {
    const answers: unknown[] = [];
    httpClient.get("/test").subscribe((body) => answers.push(body));
    httpClient.get("/test").subscribe((body) => answers.push(body));

    const req = httpMock.expectOne("/test");
    req.flush({ ok: true });
    expect(answers).toEqual([{ ok: true }, { ok: true }]);

    // Done, the same request goes again
    httpClient.get("/test").subscribe();
    httpMock.expectOne("/test").flush({});
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
    req.flush(
      {},
      { status: HttpStatusCode.InternalServerError, statusText: "Unknown" }
    );
    expect(req.request.headers.has("Authorization")).toBeTruthy();
    expect(req.request.headers.get("Authorization")).toBe("Bearer test_token");
    expect(check).toBe(true);
  });
});
