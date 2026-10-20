import { DOCUMENT } from "@angular/common";
import { inject, Injectable, signal } from "@angular/core";

export type ColorScheme = "light" | "dark";

const colorSchemeKey = "colorScheme";

/**
 * Light or dark scheme. Follows the system setting until the user picks one,
 * which is remembered in localStorage and set on <html> (styles.scss defaults
 * to `color-scheme: light dark`).
 */
@Injectable({
  providedIn: "root",
})
export class ThemeService {
  private readonly _document = inject(DOCUMENT);
  private readonly _systemDark = this._document.defaultView?.matchMedia?.(
    "(prefers-color-scheme: dark)"
  );

  private readonly _colorScheme = signal<ColorScheme>(
    this._storedColorScheme() ?? this._systemColorScheme()
  );
  readonly colorScheme = this._colorScheme.asReadonly();

  constructor() {
    const stored = this._storedColorScheme();
    if (stored) this._apply(stored);
    // Without a choice of their own, follow the system while the app is open
    this._systemDark?.addEventListener("change", () => {
      if (!this._storedColorScheme())
        this._colorScheme.set(this._systemColorScheme());
    });
  }

  toggle(): void {
    const next: ColorScheme = this._colorScheme() === "dark" ? "light" : "dark";
    this._colorScheme.set(next);
    this._apply(next);
    try {
      localStorage.setItem(colorSchemeKey, next);
    } catch {
      // Storage blocked: the choice lasts until the page reloads
    }
  }

  private _apply(colorScheme: ColorScheme): void {
    this._document.documentElement.style.colorScheme = colorScheme;
  }

  private _storedColorScheme(): ColorScheme | null {
    try {
      const stored = localStorage.getItem(colorSchemeKey);
      return stored === "light" || stored === "dark" ? stored : null;
    } catch {
      return null;
    }
  }

  private _systemColorScheme(): ColorScheme {
    return this._systemDark?.matches ? "dark" : "light";
  }
}
