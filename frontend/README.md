# Library Frontend

Web app for the [Library](../README.md) project: zoneless Angular 22 with Angular Material, translated into Portuguese (pt-BR) and English (en-US).

See the [root README](../README.md) for the full setup and demo accounts.

## Requirements

Node 22.22.3+ or 24.15+, as required by Angular 22. Run `nvm use` to pick the version from `.nvmrc`.

## Development

```bash
yarn install        # at the repository root (a Yarn workspace)
yarn start          # http://localhost:4200
```

The dev server proxies `/v1` requests to the backend at `http://localhost:3000` (`proxy.conf.json`), so start the backend first.

## Scripts

| Command                         | Description                                            |
| ------------------------------- | ------------------------------------------------------ |
| `yarn start`                    | Dev server with live reload                            |
| `yarn build`                    | Production build in `dist/frontend/browser`            |
| `yarn build:serve`              | Serve the production build on port 8080                |
| `yarn lint` / `yarn lint:check` | ESLint (Angular rules), fixing / only reporting        |
| `yarn prettier`                 | Format `src/`                                          |
| `yarn test`                     | Unit tests with Vitest and coverage (fails below 100%) |

To run a single spec file:

```bash
npx ng test --watch=false --coverage=false --include src/app/services/authentication.service.spec.ts
```

## Code organisation

- `src/app/pages/`: lazy-loaded feature routes: the core `auth`, `home` and `users`, and the lending example's `books` and `rentals`, which keep their models and HTTP services in their own folders. Routes can be limited to certain roles with `data: { roles: [...] }`.
- `src/app/services/`: the core's HTTP services, login/logout/token refresh, and credential storage.
- `src/app/shared/`: guards, HTTP interceptors (auth headers, error handling, automatic token refresh), i18n, and shared components.

The app is zoneless (`provideZonelessChangeDetection()`, no zone.js). Views refresh only after signal changes, `async` pipe emissions, template event handlers or `markForCheck()`. A plain field changed in a `setTimeout` or promise callback is not rendered until something else triggers change detection.

Imports use path aliases (`@app/`, `@shared/`, `@pages/`, `@env/`); relative imports are rejected by lint. See [docs/coding-style.md](docs/coding-style.md) for conventions.
