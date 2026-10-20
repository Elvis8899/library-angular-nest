import {
  provideHttpClient,
  withInterceptors,
  withXhr,
} from "@angular/common/http";
import {
  ApplicationConfig,
  enableProdMode,
  inject,
  provideAppInitializer,
  provideZonelessChangeDetection,
} from "@angular/core";
import { MatPaginatorIntl } from "@angular/material/paginator";
import {
  PreloadAllModules,
  provideRouter,
  RouteReuseStrategy,
  withEnabledBlockingInitialNavigation,
  withInMemoryScrolling,
  withPreloading,
  withRouterConfig,
} from "@angular/router";
import { provideServiceWorker } from "@angular/service-worker";
import { routes } from "@app/pages/pages.routes";
import { Logger } from "@app/services/logger.service";
import { ThemeService } from "@app/services/theme.service";
import { AppUpdateService } from "@app/services/update.service";
import { RouteReusableStrategy } from "@app/shared/helpers/routeReusableStrategy";
import { I18nService } from "@app/shared/i18n/i18n.service";
import { TranslatedPaginatorIntl } from "@app/shared/i18n/translatedPaginatorIntl.service";
import { authHttpInterceptor } from "@app/shared/interceptors/authHttp.interceptor";
import { errorHandlerInterceptor } from "@app/shared/interceptors/errorHandler.interceptor";
import { environment } from "@env/environment";
import { provideTranslateService } from "@ngx-translate/core";

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideTranslateService(),
    // provideServiceWorker is required for Angular's service workers
    provideServiceWorker("ngsw-worker.js", {
      enabled: environment.production,
      scope: "/",
      registrationStrategy: "registerWhenStable:30000",
    }),
    // provideRouter is required for Angular's router with additional configuration
    provideRouter(
      routes,
      withRouterConfig({
        onSameUrlNavigation: "reload",
        paramsInheritanceStrategy: "always",
      }),
      withEnabledBlockingInitialNavigation(),
      withInMemoryScrolling({
        scrollPositionRestoration: "enabled",
        anchorScrolling: "enabled",
      }),
      withPreloading(PreloadAllModules)
    ),

    provideAppInitializer(() => {
      inject(I18nService);
      // Applies a stored light or dark choice before the first page renders
      inject(ThemeService);
      inject(AppUpdateService);
      if (environment.production) {
        enableProdMode();
        // Setup logger
        Logger.enableProductionMode();
      }
    }),
    // provideHttpClient is required for Angular's HttpClient with additional configuration, which includes interceptors from DI (dependency injection) , means to use class based interceptors
    provideHttpClient(
      withXhr(),
      withInterceptors([authHttpInterceptor, errorHandlerInterceptor])
    ),
    // The paginators' labels in the selected language
    { provide: MatPaginatorIntl, useClass: TranslatedPaginatorIntl },
    {
      provide: RouteReuseStrategy,
      useClass: RouteReusableStrategy,
    },
  ],
};
