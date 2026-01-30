import { NgClass } from "@angular/common";
import { Component, ElementRef, inject, Input } from "@angular/core";
import { I18nService } from "@app/shared/i18n/i18n.service";

@Component({
  selector: "app-language-selector",
  templateUrl: "./language-selector.component.html",
  styleUrls: ["./language-selector.component.scss"],
  imports: [NgClass],
  host: {
    "(window:click)": "onClickOutside($event)",
  },
})
export class LanguageSelectorComponent {
  @Input() inNavbar = true;
  @Input() openAbove = false;
  isDropdownOpen = false;
  protected readonly open = open;

  private readonly _i18nService = inject(I18nService);
  private readonly _eRef = inject(ElementRef);

  get currentLanguage(): string {
    const language = this._i18nService.language;
    const [, part = ""] = language.split("-");
    return part;
  }

  get languages(): string[] {
    return this._i18nService.supportedLanguages;
  }

  /**
   * Listener to handle click events outside of the dropdown component.
   * Helps in closing the dropdown if clicked outside.
   */
  onClickOutside(event: Event) {
    const element = this._eRef?.nativeElement as HTMLElement | undefined;
    const inside = element?.contains(event.target as Node);
    if (!inside) {
      this.isDropdownOpen = false;
    }
  }

  toggleDropdown() {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  setLanguage(language: string) {
    this._i18nService.language = language;
    this.isDropdownOpen = false;
  }

  getLanguageCode(language: string): string {
    const parts = language.split("-");
    return parts.length > 1 ? parts[1] : "";
  }
}
