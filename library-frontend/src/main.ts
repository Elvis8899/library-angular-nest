/// <reference types="@angular/localize" />

import { bootstrapApplication } from "@angular/platform-browser";
import { Logger } from "@app/@core/services";
import { AppComponent } from "./app/app.component";
import { appConfig } from "./app/app.config";
const log = new Logger("Main");
bootstrapApplication(AppComponent, appConfig).catch((err) => log.error(err));
