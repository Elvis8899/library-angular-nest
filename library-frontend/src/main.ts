/// <reference types="@angular/localize" />

import { bootstrapApplication } from "@angular/platform-browser";
import { appConfig } from "./app/app.config";
import { AppComponent } from "./app/app.component";
import { Logger } from "@app/@core/services";
const log = new Logger("Main");
bootstrapApplication(AppComponent, appConfig).catch((err) => log.error(err));
