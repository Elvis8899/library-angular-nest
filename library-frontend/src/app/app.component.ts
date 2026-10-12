import { ChangeDetectionStrategy, Component } from "@angular/core";
import { RouterOutlet } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";

@Component({
  selector: "app-root",
  imports: [RouterOutlet, TranslateModule],
  template: "<router-outlet/>",
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: "./app.component.scss",
})
export class AppComponent {}
