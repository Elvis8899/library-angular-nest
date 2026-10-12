# Library Frontend

Web app for the [Library](../README.md) project: Angular 22 with Angular Material, translated into Portuguese (pt-BR) and English (en-US).

See the [root README](../README.md) for the full setup and demo accounts.

## Requirements

Node 22.22.3+ or 24.15+, as required by Angular 22. Run `nvm use` to pick the version from `.nvmrc`.

## Development

```bash
yarn install
yarn start          # http://localhost:4200
```

The dev server proxies `/v1` requests to the backend at `http://localhost:3000` (`proxy.conf.json`), so start the backend first.

## Scripts

| Command | Description |
|---|---|
| `yarn start` | Dev server with live reload |
| `yarn build` | Production build in `dist/library-frontend/browser` |
| `yarn build:serve` | Serve the production build on port 8080 |
| `yarn lint` / `yarn lint:fix` | ESLint (Angular rules) |
| `yarn prettier` | Format `src/` |
| `yarn test` | Unit tests with Vitest and coverage (fails below 80%) |

To run a single spec file:

```bash
npx ng test --watch=false --coverage=false --include src/app/services/authentication.service.spec.ts
```

## Code organisation

- `src/app/pages/`: lazy-loaded feature routes (`books`, `rentals`, `users`, `auth`). Routes can be limited to certain roles with `data: { roles: [...] }`.
- `src/app/services/`: HTTP services, login/logout/token refresh, and credential storage.
- `src/app/shared/`: guards, HTTP interceptors (auth headers, error handling, automatic token refresh), i18n, and shared components.

Imports use path aliases (`@app/`, `@shared/`, `@pages/`, `@env/`); relative imports are rejected by lint. See [docs/coding-style.md](docs/coding-style.md) for conventions.
