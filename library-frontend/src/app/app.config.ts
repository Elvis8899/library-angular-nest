import { provideHttpClient, withInterceptors } from "@angular/common/http";
import {
  ApplicationConfig,
  enableProdMode,
  importProvidersFrom,
  inject,
  provideAppInitializer,
  provideZonelessChangeDetection,
} from "@angular/core";
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
import { AppUpdateService } from "@app/services/update.service";
import { RouteReusableStrategy } from "@app/shared/helpers/route-reusable-strategy";
import { I18nService } from "@app/shared/i18n/i18n.service";
import { authHttpInterceptor } from "@app/shared/interceptors/authHttp.interceptor";
import { errorHandlerInterceptor } from "@app/shared/interceptors/error-handler.interceptor";
import { environment } from "@env/environment";
import { TranslateModule } from "@ngx-translate/core";
import { provideHotToastConfig } from "@ngxpert/hot-toast";

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    // import providers from other modules (e.g. TranslateModule, ShellModule), which follow the older pattern to import modules
    importProvidersFrom(TranslateModule.forRoot()),
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

    // provideHotToastConfig is required for HotToastModule by ngneat
    provideHotToastConfig({
      reverseOrder: true,
      dismissible: true,
      autoClose: true,
      position: "top-right",
      theme: "snackbar",
    }),
    provideAppInitializer(() => {
      inject(I18nService);
      inject(AppUpdateService);
      if (environment.production) {
        enableProdMode();
        // Setup logger
        Logger.enableProductionMode();
      }
    }),
    // provideHttpClient is required for Angular's HttpClient with additional configuration, which includes interceptors from DI (dependency injection) , means to use class based interceptors
    provideHttpClient(
      withInterceptors([authHttpInterceptor, errorHandlerInterceptor])
    ),
    {
      provide: RouteReuseStrategy,
      useClass: RouteReusableStrategy,
    },
  ],
};
