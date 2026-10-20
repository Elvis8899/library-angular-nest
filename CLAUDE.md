# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Library management system (book lending) for a Brazilian audience: UI text, API docs (Swagger tags/summaries) and error messages are in Portuguese. Two independent apps, each with its own `package.json`, `yarn.lock` (Yarn 1) and `node_modules`; there is no root workspace.

- `library-backend/` — NestJS 11 on Fastify, Prisma + PostgreSQL, Zod, fp-ts, JWT auth.
- `library-frontend/` — Angular 22 (standalone components), Angular Material, ngx-translate (pt-BR, en-US), Vitest via `@angular/build:unit-test`.

Both use TypeScript 6.0. TypeScript 7 isn't supported by Angular, typescript-eslint or ts-jest yet.

Both apps run on Node 24 (`.nvmrc` in each); the backend Docker images and CI use it too. The frontend needs at least Node 22.22.3 or 24.15.

## Commands

### Backend (`cd library-backend`)

Tests need Postgres. Start it from the dev compose file, then apply migrations to the `library-test` database. `yarn test:docker:up` does both in one step, but it resets the test database and reseeds it.

```bash
docker compose -f ../.docker/docker-compose-dev.yml up postgres -d
yarn test:migrate             # prisma migrate deploy against .env.test

yarn start:dev                # watch mode, port 3000, Swagger at /swagger
yarn build                    # output is dist/src/main.js (rootDir is the project root); run with yarn start:prod
yarn lint
yarn test:unit                # *.unit-spec.ts
yarn test:inte                # *.inte-spec.ts (real Prisma repositories)
yarn test:e2e                 # *.e2e-spec.ts (full AppModule + supertest)
yarn test:cov                 # everything; enforces 100% statements/branches/functions/lines (CI runs this)

# Single file / single test: use the base config. The unit config enforces coverage thresholds that fail on partial runs.
npx env-cmd -f .env.test jest --config ./test/jest.config.ts test/modules/user/document.unit-spec.ts
npx env-cmd -f .env.test jest --config ./test/jest.config.ts -t "test name" <file>

yarn migrate                  # prisma migrate dev (new migration)
yarn migrate:check            # fails if schema.prisma differs from the migrated test database (CI runs it)
yarn seed                     # prisma db seed; skips a database that already has users or books
```

The app refuses to start unless `JWT_SECRET_KEY` and `JWT_REFRESH_SECRET` are set and at least 32 characters long (`src/modules/auth/auth.config.ts`). `.env.test` contains test values. `make dockerDev` (from the repo root) starts the dev stack behind nginx on `localhost:3000`: the frontend dev server at `/`, the API at `/v1` and `/swagger`, plus Postgres, pgAdmin, Prometheus and Grafana. The dev Docker entrypoint copies `.env.example` to `.env.dev`. The dev `app` and `frontend` containers run as uid/gid 1000 so files it writes to the mounted source folder aren't root-owned; set `HOST_UID`/`HOST_GID` if yours differ.

### Frontend (`cd library-frontend`, Node 24)

```bash
yarn start                    # ng serve on :4200, proxies /v1 to localhost:3000 (proxy.conf.json)
yarn build
yarn lint
yarn lint:styles              # stylelint on src/**/*.scss (CI runs it)
yarn test                     # ng test: Vitest with coverage, 80% thresholds (angular.json)
npx ng test --watch=false --coverage=false --include src/app/services/authentication.service.spec.ts
```

## Conventions enforced by lint

- **No relative imports** in either app (`no-restricted-imports` bans `./` and `../`). Use path aliases:
  - backend: `@src/ @test/ @shared/ @auth/ @user/ @book/ @rental/ @db/` (`@db/` is `prisma/`)
  - frontend: `@app/ @shared/ @pages/ @env/`
- **File and folder names are camelCase** in both apps, plus a role suffix (`createUser.command.ts`, `customizedTable.component.ts`, `bookRental.repository.port.ts`). `eslint-plugin-check-file` enforces this. The exceptions are the frontend locale files (`en-US.ts`, `pt-BR.ts`), the backend Jest configs (`test/jest-*.config.ts`) and Prisma migrations. Selectors and CSS classes stay kebab-case.
- Backend aliases are defined in both `tsconfig.json` and `test/jest.config.ts` (`moduleNameMapper`). A new alias has to be added to both.
- Prettier with organize-imports runs on format. Double quotes.

## Backend architecture

### Module layout

Each feature module (`user`, `book`, `rental`, `auth`) under `src/modules/` is laid out as hexagonal/CQRS:

```
commands/<name>/<name>.command.ts      # ICommand + @CommandHandler (writes)
commands/<name>/<name>.controller.ts   # one controller per use case; dispatches via CommandBus
queries/<name>/<name>.query.ts|controller.ts   # reads via QueryBus
domain/          # Zod schemas = entities/value objects (type and validator share a name), errors, events
database/        # <x>.repository.port.ts (abstract class used as DI token), real<X>.repository.ts (Prisma), fake<X>.repository.ts (in-memory)
dtos/            # Swagger DTO classes (validation is done by Zod in the domain, not class-validator)
```

Modules bind the port to the real repository (`{ provide: UserRepository, useClass: RealUserRepository }`). Unit tests bind the fake instead. Fakes extend `shared/utils/database/fakeRepository.base.ts`, and they count toward the 100% coverage threshold. Prisma repositories share `loadPage`, `validateRows` and `validateMaybeRow` from `shared/utils/database/rowValidation.ts`.

### Handlers are fp-ts pipelines

Command and query handlers build a `ReaderTaskEither<{ logger }, Error, T>` pipeline and finish with `executeTask(task)`, which turns it into a Promise for Nest. The building blocks:

- `shared/utils/application/monads.ts`: re-exports fp-ts modules under short names (`RTE`, `TE`, `RE`, `O`, `E`, `FPF`, …). Import from here, not from `fp-ts/*` directly.
- `fromInputRE(schema, name)`: Zod validation. A failure becomes `UnprocessableEntityException` (422).
- `performRTE(repoFn, "description")`: wraps a repository `TaskEither` call and logs success or failure with the description.
- Repositories return `TaskEither<Error, …>`. Lookups return `Option` and are converted with `RTE.fromOption(notFoundException)`.

Errors are Nest `HttpException` subclasses created by small factory functions in `domain/*.errors.ts`. A rejected task surfaces as that HTTP status.

### Domain events

`DomainEventPublisher.publishEvent` validates the event against `DomainEvent`. That's a Zod discriminated union on `eventKey`, assembled in `shared/domainEventPublisher/domain/domainEvent.ts` from each module's `domain/events/index.ts` (`AllUserEvents`, `AllBookInfoEvents`, `AllRentalEvents`). It then emits through `@nestjs/event-emitter`. **A new event schema has to be added to its module's `All*Events` tuple, or publishing fails validation.** Subscribers (`book/subscriber/`) use `@OnEvent` and dispatch commands.

### Consistency rules

- Renting and returning are atomic: `BookRentalRepository.rent` and `finish` run in a Prisma `$transaction`, using a conditional `updateMany` on the `BookItem` status or the rental status. Book item status must not be changed through events or separate writes.
- `User.cpf` uses `DocumentType`. It is deliberately lenient (length only), because it also validates rows read from the database. Check-digit validation (CPF and alphanumeric CNPJ) is `CheckedDocumentType`, applied only in the create and update commands. Clients must have a CPF; admins may leave it empty.

### Database migrations

- Schema changes go through `yarn migrate` (`prisma migrate dev`), which writes a migration under `prisma/migrations/`. Production applies them with `make dockerMigrate` (`prisma migrate deploy`).
- Data changes that SQL can express belong in the same migration: create it with `yarn migrate --create-only --name <name>` and add the `UPDATE`/`INSERT` after the schema changes in its `migration.sql`. It then runs once, in order, in a transaction, and in every environment (dev container, test database, CI). Prefer a column `DEFAULT` when it fills existing rows, as `add_user_token_version` does.
- There is no separate post-migration script, because one would run on every deploy rather than once. If a data change ever needs app code, add one script per change with a table recording which have run, and run the pending ones after `migrate deploy`. For changes that must not break the running app, expand first (add and backfill the new column), switch the code over, then drop the old column in a later migration.

### Auth

- `AuthGuard` checks the Bearer JWT. `RolesGuard` together with `@Roles(UserRoleEnum.Admin, …)` restricts by role. Both are applied per controller or per method; there is no global guard. Every route except `POST /v1/login`, `POST /v1/refresh` and `GET /check/status` requires a token, books included. `test/modules/auth/routeProtection.e2e-spec.ts` collects the registered routes and fails if any other route answers without one; a new public route has to be added to its `publicRoutes` list.
- Login returns an access token and a refresh token, signed with different secrets. Both are checked against the configured audience and issuer (`jwtModuleOptions` in `auth.config.ts`). `POST /v1/refresh` exchanges a refresh token for a new pair.
- Refresh tokens are single-use. Each login creates a `RefreshSession` row, and the refresh token carries its id (`sid`) and the session's current `jti`. `POST /v1/refresh` swaps the jti with a conditional `updateMany` (`RefreshSessionRepository.rotate`); reusing an old token deletes the session, logging out both holders. The frontend serializes refreshes across tabs with the Web Locks API and syncs credentials through `storage` events, so tabs never send the same token twice.
- Refresh tokens also carry the user's `tokenVersion`. `POST /v1/logout` and any user update increment it (`UserRepository.incrementTokenVersion`), which revokes every refresh token issued before. Access tokens remain stateless and valid until they expire.
- `POST /v1/login` is rate-limited per client IP and email (`LoginThrottlerGuard`; `LOGIN_RATE_LIMIT` and `LOGIN_RATE_WINDOW_SECONDS`). Client IPs come from `X-Forwarded-For` only when `TRUST_PROXY` lists the proxy.
- Ownership checks: clients rent for themselves and may return only their own rentals; someone else's rental is reported as 404.
- User responses must go through `toUserResponse` (`user/dtos/user.dto.ts`) so `password` and `tokenVersion` are never returned.

### Tests

- Test files live in `test/modules/<module>/`, named by kind: `*.unit-spec.ts` (handlers with fake repositories via `Test.createTestingModule`), `*.inte-spec.ts` (real repositories against Postgres), `*.e2e-spec.ts` (AppModule + supertest).
- Use the builders in `test/dataBuilders/` (`UserBuilder`, `BookInfoBuilder`, `BookRentalBuilder`, …) and deterministic IDs from `test/util/defaultIds.ts` (`createTestId(TableNameEnum.X, n)`).
- E2E tests build their app with `createTestApp(testingModule)` (`test/util/createTestApp.ts`), which applies the same setup as `main.ts` (`src/app.setup.ts`: helmet, Swagger, request context, `trustProxy`); `main.ts` only adds listening. Call `app.init()` afterwards.
- E2E tests replace `AuthGuard` with `MockAuthGuardBuilder` (an admin by default), except `routeProtection.e2e-spec.ts`, which logs in for real.
- `test/db/seed.inte-spec.ts` tests `prisma/seed.ts` through its exported `seed(prisma)`. Call `.withRole(UserRoleEnum.Client)` and then `.reset()` to test role restrictions. `RolesGuard` stays real.
- Suites share one database and run with `--runInBand`. Each spec cleans the tables it uses.

## Frontend architecture

- `src/app/pages/<feature>/` holds lazy-loaded route groups (`*.routes.ts`, loaded from `pages/pages.routes.ts`). Route access is restricted with `data: { roles: [...] }` and `shared/guard/permission.guard.ts`, which the layout route runs as both `canActivate` and `canActivateChild` (`canActivate` alone never sees the children's roles). `pages/pages.routes.spec.ts` checks which pages each role can open.
- `services/*.http.service.ts` are thin `HttpClient` wrappers; their specs pin each URL and method to the backend routes. Paginated requests build their query parameters with `PageRequestUtility.toHttpParams`. `CredentialsService` stores the user and tokens in localStorage. `AuthenticationService` handles login, logout and refresh.
- HTTP interceptors run in this order: `authHttpInterceptor` → `errorHandlerInterceptor`.
  - `authHttpInterceptor` adds the Bearer token and language headers, and merges identical requests that are in flight at the same time. A request with a `noauth` header skips it entirely.
  - `errorHandlerInterceptor`: on a 401 it refreshes the token once and retries the request; it logs out on 403 or when the refresh fails.
- The app is zoneless (`provideZonelessChangeDetection()` in `app.config.ts`, no zone.js). State that changes outside template events (timers, promises, subscriptions) must go through signals, the `async` pipe or `markForCheck()`, or the view won't update.
- Components use OnPush, which is the default since Angular 22: leave `changeDetection` out. The `prefer-on-push-component-change-detection` lint rule rejects `Eager`. A component whose template reads state changed outside its own template events (router events, other services) must call `markForCheck()` or use signals or the `async` pipe; see the `NavigationEnd` handler in `sidebar.component.ts`.
- Shared building blocks in `shared/components/`: `app-page-header` (page title and actions), `app-form-card` (form pages), `customizedTable` with `PaginatedDataSource` (lists), `ConfirmDialog.confirm()` (destructive actions) and `app-theme-toggle`. Colors come from Material's `--mat-sys-*` variables and spacing from `--space-1`…`--space-6` (`theme/_variables.scss`), so both light and dark schemes work.
- Small screens are below 768px (`smallScreenQuery` and `injectIsSmallScreen()` in `shared/helpers/smallScreen.ts`; SCSS uses `@media (width < 768px)`). There the sidebar becomes a menu opened from the header, and the lists pass fewer columns to `customizedTable` through `[columns]`, moving the rest under the main cell.
- An `@if` block isn't projected into a named content slot (`select="…"`) by itself, and the build warns (NG8011). Wrap it in an element that matches the slot (`<ng-container pageActions>`, `ngProjectAs="mat-card-subtitle"`), or, inside a `mat-form-field`, use one `mat-error` and pick its message inside it.
- Specs use `@ngneat/spectator/vitest` (`createComponentFactory`, `createHostFactory`, `createServiceFactory`, `createInjectionContextFactory`, `mocks: [...]`) with `HttpTestingController`, not `TestBed` directly. To run effects or render overlays (autocomplete panels, dialogs), call `spectator.inject(ApplicationRef).tick()`.

## CI and deployment

- `.github/workflows/node.js.yml` runs on pushes and PRs to `main`. The backend job runs migrations, build and `test:cov` against a Postgres service. The frontend job runs lint, Stylelint, tests and build on the Node version in `library-frontend/.nvmrc`. Both upload their `coverage-summary.json` as artifacts, and the `badges` job, which waits for both, regenerates the coverage badges on the `badges` branch (`badges/library-backend/`, `badges/library-frontend/`, shown in the README).
- Swagger (`/swagger`) is public in production on purpose; nginx proxies it.
- Deployment is manual. On the server, `make dockerMigrate` applies migrations and `make dockerProd` pulls and rebuilds the stack, both from the repo root with Docker Compose (`.docker/docker-compose.yml`: app, Postgres, nginx, pgAdmin). The compose files, nginx and Prometheus configs live in the root `.docker/`; the API's Dockerfiles and entrypoints stay in `library-backend/.docker/`, its build context. Only nginx (port 80) is public; the app, Postgres and pgAdmin publish their ports on the `nginx_network` gateway (`172.18.0.1`), which nginx proxies to. The production Dockerfile copies `.env` into the image and starts `dist/src/main.js`.
