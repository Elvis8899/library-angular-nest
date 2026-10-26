import { HttpClient } from "@angular/common/http";
import {
  HttpTestingController,
  provideHttpClientTesting,
} from "@angular/common/http/testing";
import { MatPaginatorIntl } from "@angular/material/paginator";
import { MAT_SELECT_CONFIG } from "@angular/material/select";
import { RouteReuseStrategy } from "@angular/router";
import { appConfig } from "@app/app.config";
import { Logger, LogLevel } from "@app/services/logger.service";
import { TranslatedPaginatorIntl } from "@app/shared/i18n/translatedPaginatorIntl.service";
import { ExplicitRouteReuseStrategy } from "@app/shared/utils/explicitRouteReuse.strategy";
import { environment } from "@env/environment";
import { createInjectionContextFactory } from "@openng/spectator/vitest";

describe("appConfig", () => {
  const createContext = createInjectionContextFactory({
    providers: [...appConfig.providers, provideHttpClientTesting()],
  });
  // Other specs change the level, which is shared
  const logLevel = Logger.level;

  afterEach(() => {
    Logger.level = logLevel;
  });

  it("should provide the app's paginator labels and route reuse strategy", () => {
    const spectator = createContext();

    expect(spectator.inject(MatPaginatorIntl)).toBeInstanceOf(
      TranslatedPaginatorIntl
    );
    expect(spectator.inject(RouteReuseStrategy)).toBeInstanceOf(
      ExplicitRouteReuseStrategy
    );
  });

  it("should let the selects show a null option as chosen", () => {
    const spectator = createContext();

    expect(spectator.inject(MAT_SELECT_CONFIG)).toEqual({
      canSelectNullableOptions: true,
    });
  });

  it("should send requests through the interceptors", () => {
    const spectator = createContext();
    const httpMock = spectator.inject(HttpTestingController);

    spectator.inject(HttpClient).get("/test").subscribe();
    const req = httpMock.expectOne("/test");
    req.flush({});

    expect(req.request.headers.has("Accept-Language")).toBe(true);
    httpMock.verify();
  });

  it("should keep the log level outside production", () => {
    createContext().inject(HttpClient);

    expect(Logger.level).toBe(logLevel);
  });

  describe("in production", () => {
    const devMode: unknown = Reflect.get(globalThis, "ngDevMode");

    beforeEach(() => {
      environment.production = true;
    });

    afterEach(() => {
      environment.production = false;
      // enableProdMode turns Angular's dev checks off for the whole worker
      Reflect.set(globalThis, "ngDevMode", devMode);
    });

    it("should log warnings and errors only", () => {
      createContext().inject(HttpClient);

      expect(Logger.level).toBe(LogLevel.Warning);
    });
  });
});
