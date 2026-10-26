import { DOCUMENT } from "@angular/common";
import { computed, inject, Injectable, signal } from "@angular/core";

export type ColorScheme = "light" | "dark";
/** The user's choice: follow the system (Automático), or a fixed scheme. */
export type ThemePreference = "auto" | ColorScheme;

export const themePreferences: ThemePreference[] = ["auto", "light", "dark"];

const colorSchemeKey = "colorScheme";

/**
 * Light or dark scheme. Follows the system setting (Automático) unless the
 * user picks one, which is remembered in localStorage and set on <html>
 * (styles.scss defaults to `color-scheme: light dark`). `colorScheme` is the
 * scheme in effect, for what can't follow CSS by itself (a chart, a canvas).
 */
@Injectable({
  providedIn: "root",
})
export class ThemeService {
  private readonly _document = inject(DOCUMENT);
  private readonly _systemDark = this._document.defaultView?.matchMedia?.(
    "(prefers-color-scheme: dark)"
  );
  private readonly _systemScheme = signal<ColorScheme>(
    this._systemColorScheme()
  );

  private readonly _preference = signal<ThemePreference>(
    this._storedColorScheme() ?? "auto"
  );
  readonly preference = this._preference.asReadonly();
  readonly colorScheme = computed<ColorScheme>(() => {
    const preference = this._preference();
    return preference === "auto" ? this._systemScheme() : preference;
  });

  constructor() {
    this._apply(this._preference());
    this._systemDark?.addEventListener("change", () =>
      this._systemScheme.set(this._systemColorScheme())
    );
  }

  setPreference(preference: ThemePreference): void {
    this._preference.set(preference);
    this._apply(preference);
    try {
      if (preference === "auto") localStorage.removeItem(colorSchemeKey);
      else localStorage.setItem(colorSchemeKey, preference);
    } catch {
      // Storage blocked: the choice lasts until the page reloads
    }
  }

  // Automático leaves <html> to styles.scss, which follows the system
  private _apply(preference: ThemePreference): void {
    this._document.documentElement.style.colorScheme =
      preference === "auto" ? "" : preference;
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
