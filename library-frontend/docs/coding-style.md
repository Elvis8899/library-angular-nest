# Coding Style

Conventions for `library-frontend`. Most of them are enforced by tooling. Run `yarn lint` and `yarn prettier` before committing.

## Formatting

[Prettier](../.prettierrc) is the source of truth for formatting:

- 2-space indentation, 80-character lines, semicolons, trailing commas where valid in ES5.
- Double quotes.
- Imports are sorted and unused ones removed by `prettier-plugin-organize-imports`.
- HTML templates are formatted with the Angular parser.

ESLint includes `eslint-plugin-prettier`, so formatting problems are reported as lint errors.

SCSS rules are configured in [`.stylelintrc`](../.stylelintrc), but no script runs Stylelint yet. Run it manually with `npx stylelint "src/**/*.scss"`.

## Lint rules worth knowing

The [ESLint config](../eslint.config.mts) extends the recommended rules from ESLint, typescript-eslint (recommended and stylistic) and angular-eslint (TypeScript, templates and accessibility). On top of those:

| Rule | What it means |
|---|---|
| No relative imports | Use path aliases: `@app/`, `@shared/`, `@pages/`, `@env/`. Lazy `import()` calls in route files are the one exception. |
| `no-console` | Use the `Logger` service: `const log = new Logger("MyComponent")` at the top of the file. |
| No property setters | Use methods or signals instead of `set foo(...)`. |
| Component selectors | Kebab-case elements with the `app` prefix (`app-list-books`); directives use the `app` prefix in camelCase. |
| `check-file/*` naming rules | File and folder names must be camelCase; see [File naming](#file-naming). |
| `prefer-on-push-component-change-detection` | Off for now; see [Change detection](#change-detection). |

## Components

- **Standalone only.** List dependencies in the component's `imports` array; there are no NgModules.
- **Dependency injection with `inject()`**, not constructor parameters. Private dependencies are `readonly` and prefixed with `_`:

  ```ts
  private readonly _bookService = inject(BookService);
  private readonly _toast = inject(HotToastService);
  ```

- **Templates use the built-in control flow** (`@if`, `@for`, `@switch`), not `*ngIf` or `*ngFor`.
- **Template text goes through translations:** use the `translate` directive or pipe from ngx-translate. See [Translations](#translations).
- **User feedback** uses `HotToastService` (`this._toast.success(...)`, `.error(...)`). Toast messages are currently hard-coded English strings; new ones should use `TranslateService.instant(...)` so they get translated too.
- **Dialogs** extend `StronglyTypedDialog<Data, Result>` and are opened with `TypedDialog` (`shared/components/dialog/typedDialog.ts`), so their data and result are typed.
- **Paginated tables** use `PaginatedDataSource` (`models/utils/paginatedDataSource.entity.ts`) together with `CustomizedTableComponent`.
- **Forms** use reactive forms (`FormBuilder` with `Validators`). Custom validators live in `shared/utils/formValidators.utility.ts`.

### Change detection

New components should use `ChangeDetectionStrategy.OnPush`. Older components are marked `ChangeDetectionStrategy.Eager`, which the Angular 22 migration added to keep their existing behaviour. Move them to OnPush one at a time, making sure state changes go through signals, observables in the template, or `markForCheck`. Once none are left, turn the lint rule back on.

## Project structure

```
src/app/
  pages/<feature>/        Lazy-loaded routes: <feature>.routes.ts plus one folder per screen
  services/               HTTP services (*.http.service.ts) and app services (auth, credentials, logger)
  models/                 Interfaces and enums for API data (*.entity.ts)
  layouts/                Shell: layout, header, sidebar and navigation menu items
  shared/
    components/           Reusable components (customized table, typed dialog)
    guard/                Route guards (authentication, permission)
    interceptors/         HTTP interceptors (auth headers, error handling, token refresh)
    i18n/                 Language service, language selector, translations
    pipes/ utils/         Pipes and pure helper functions (*.utility.ts)
src/theme/                Global SCSS: variables, mixins, layout, utilities, Material overrides
src/environments/         Environment config
```

- **Pages:** each feature has a `<feature>.routes.ts` loaded from `pages/pages.routes.ts`. Secondary screens can be lazy-loaded with `loadComponent`. Restrict access by role with `data: { roles: [ROLE.ADMIN] }` together with `permissionGuard`. Sidebar entries and their roles are defined in `layouts/components/sidebar/navMenuItems.ts`.
- **HTTP services** only wrap `HttpClient` calls. Data shaping and state belong in components or app services. HTTP services are excluded from coverage.
- **Models** are TypeScript interfaces that mirror the API responses. Enums use the same string values as the backend.

### File naming

Each component has its own folder holding its `.ts`, `.html`, `.scss` and `.spec.ts` files.

**File and folder names are camelCase**, followed by a role suffix: `listBooks/listBooks.component.ts`, `customizedTable/customizedTable.component.ts`, `chooseUser.dialog.component.ts`, `dateTime.utility.ts`, `book.http.service.ts`.

Lint enforces this (`eslint-plugin-check-file`) for `.ts` and `.html` files and all folders under `src/`; the suffixes after the first dot aren't checked. The translation files are the one exception: they keep their locale codes (`en-US.ts`, `pt-BR.ts`).

Component selectors and CSS classes are a separate matter and stay kebab-case (`app-customized-table`, `.language-selector`).

Class names use a role suffix: `ListBooksComponent`, `BookService`, `ChooseUserDialogComponent`.

## Translations

Translations are TypeScript files in `shared/i18n/translations/`. Keys are the English text itself (`"Books List"`).

To add a string:

1. Add the key to the `keys` union in `allTranslations.ts`.
2. Add the text to both `en-US.ts` and `pt-BR.ts`.

Both files are typed as `AllTranslations`, so the build fails if a language is missing a key.

## Styles

- Component styles go in the component's `.scss` file. Shared variables and mixins come from `src/theme/` (`_variables.scss`, `_mixins.scss`).
- Stylelint limits: nesting depth 3, no ID selectors, no `!important`, no vendor prefixes, lowercase kebab-case class names.
- Override Angular Material styles in `src/theme/_overrides.scss`. No component uses `::ng-deep` today; keep it that way.

## Tests

- Specs sit next to the file they test (`*.spec.ts`) and run on Vitest through `ng test`.
- Use `@openng/spectator/vitest` (the maintained fork of `@ngneat/spectator`, whose repositories were removed):
  - `createComponentFactory` for components
  - `createServiceFactory` for services
  - `createInjectionContextFactory` for guards and interceptors
- Mock dependencies with `mocks: [...]` and stub them with `spectator.inject(Service).method.mockReturnValue(...)`.
- Test HTTP calls with `provideHttpClientTesting()` and `HttpTestingController`, and call `httpMock.verify()` in `afterEach`.
- Coverage must stay at or above 80% (`angular.json`).
