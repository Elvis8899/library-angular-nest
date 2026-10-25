import { Component, input } from "@angular/core";
import { MatIconButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { MatMenu, MatMenuItem, MatMenuTrigger } from "@angular/material/menu";
import { MatTooltip } from "@angular/material/tooltip";
import {
  t,
  TranslationKey,
} from "@app/shared/i18n/translations/translationKey";
import { TranslatePipe } from "@ngx-translate/core";

/** One item of a row's ⋮ menu. */
export interface RowAction<T> {
  // The item's name, for the specs
  name: string;
  icon: string;
  label: TranslationKey;
  run: (row: T) => void;
  // Read as the menu opens, so signals it reads keep it current
  shown?: (row: T) => boolean;
}

/**
 * A row's ⋮ button (`name="more"`) and its menu, the page's actions
 * defined once for every row:
 *
 *   <app-row-actions [actions]="actions" [row]="machine" />
 */
@Component({
  selector: "app-row-actions",
  templateUrl: "./rowActions.component.html",
  imports: [
    MatIcon,
    MatIconButton,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    MatTooltip,
    TranslatePipe,
  ],
})
export class RowActionsComponent<T> {
  readonly row = input.required<T>();
  readonly actions = input.required<readonly RowAction<T>[]>();
  readonly label = input<TranslationKey>(t("common.moreActions"));
}
