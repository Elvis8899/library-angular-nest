import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterModule } from "@angular/router";
import { LanguageSelectorComponent } from "@app/i18n";
import { PagesRoutingModule } from "@app/pages/pages-routing.module";
import { HeaderComponent } from "@app/shell/components/header/header.component";
import { SidebarComponent } from "@app/shell/components/sidebar/sidebar.component";
import { ShellComponent } from "@app/shell/shell.component";
import { TranslateModule } from "@ngx-translate/core";
import { HumanizePipe } from "@shared/pipes";

@NgModule({
  imports: [
    CommonModule,
    TranslateModule,
    RouterModule,
    HumanizePipe,
    FormsModule,
    PagesRoutingModule,
    LanguageSelectorComponent,
    ShellComponent,
    HeaderComponent,
    SidebarComponent,
  ],
})
export class ShellModule {}
