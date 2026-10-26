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
import { MAT_SELECT_CONFIG } from "@angular/material/select";
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
import { I18nService } from "@app/shared/i18n/i18n.service";
import { TranslatedPaginatorIntl } from "@app/shared/i18n/translatedPaginatorIntl.service";
import { authHttpInterceptor } from "@app/shared/interceptors/authHttp.interceptor";
import { errorHandlerInterceptor } from "@app/shared/interceptors/errorHandler.interceptor";
import { ExplicitRouteReuseStrategy } from "@app/shared/utils/explicitRouteReuse.strategy";
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
      const i18n = inject(I18nService);
      // Applies a stored light or dark choice before the first page renders
      inject(ThemeService);
      inject(AppUpdateService);
      if (environment.production) {
        enableProdMode();
        // Setup logger
        Logger.enableProductionMode();
      }
      // The saved language's texts, before the first page renders
      return i18n.ready;
    }),
    // provideHttpClient is required for Angular's HttpClient with additional configuration, which includes interceptors from DI (dependency injection) , means to use class based interceptors
    provideHttpClient(
      withXhr(),
      withInterceptors([authHttpInterceptor, errorHandlerInterceptor])
    ),
    // The paginators' labels in the selected language
    { provide: MatPaginatorIntl, useClass: TranslatedPaginatorIntl },
    // A null option ("Todos", "—") shows its label when chosen; by default
    // mat-select treats null as nothing chosen, blank
    {
      provide: MAT_SELECT_CONFIG,
      useValue: { canSelectNullableOptions: true },
    },
    {
      provide: RouteReuseStrategy,
      useClass: ExplicitRouteReuseStrategy,
    },
  ],
};
