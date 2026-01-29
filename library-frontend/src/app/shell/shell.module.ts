import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { RouterModule } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";

import { FormsModule } from "@angular/forms";
import { LanguageSelectorComponent } from "@app/i18n";
import { HeaderComponent } from "@app/shell/components/header/header.component";
import { SidebarComponent } from "@app/shell/components/sidebar/sidebar.component";
import { PagesModule } from "@pages/pages.module";
import { HumanizePipe } from "@shared/pipes";
import { ShellComponent } from "./shell.component";

@NgModule({
  imports: [
    CommonModule,
    TranslateModule,
    RouterModule,
    HumanizePipe,
    FormsModule,
    PagesModule,
    LanguageSelectorComponent,
    ShellComponent,
    HeaderComponent,
    SidebarComponent,
  ],
})
export class ShellModule {}
