/// <reference types="@angular/localize" />

import { bootstrapApplication } from "@angular/platform-browser";
import { AppComponent } from "@app/app.component";
import { appConfig } from "@app/app.config";
import { Logger } from "@app/services/logger.service";
const log = new Logger("Main");
bootstrapApplication(AppComponent, appConfig).catch((err) => log.error(err));
