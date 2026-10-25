# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Library management system (book lending) for a Brazilian audience: UI text, API docs (Swagger tags/summaries) and error messages are in Portuguese. A Yarn 1 workspace: one root `package.json` and `yarn.lock`, with two apps and the package they share.

- `backend/` — NestJS 12 on Fastify, Prisma 7 + PostgreSQL, Zod, fp-ts, JWT auth.
- `frontend/` — Angular 22 (standalone components), Angular Material, ngx-translate (pt-BR, en-US), Vitest via `@angular/build:unit-test`.
- `packages/contracts/` — `@library/contracts`: what travels over HTTP (Zod schemas, enums) and the rules both apps apply; see "Contracts".

The repository is also a seed for other projects. `shared`, `auth` and `user` (backend) and `auth`, `home`, `users` (frontend pages) are the core; `book` and `rental` (`books`, `rentals` pages) are the lending example. Everything the example owns lives in its own folders; the few lines it needs in core files are marked with a `Lending example` comment, so `git grep -i "lending example"` lists them (README, "Starting a new project"). Keep that true: example code doesn't go into core files unmarked, and core code and specs don't use the example (core specs use user routes and keys). The project's name is in the places the README lists under "Rename"; the backend's is `src/app.info.ts`.

Both use TypeScript 6.0. TypeScript 7 isn't supported by Angular or typescript-eslint yet.

Both apps run on Node 24 (`.nvmrc` in each); the backend Docker images and CI use it too. The frontend needs at least Node 22.22.3 or 24.15.

## Commands

### Workspace (repo root)

```bash
yarn install                  # both apps and the contracts; builds the contracts and installs the Git pre-commit hook
yarn contracts:watch          # rebuilds the contracts while you edit them (the apps import the build)
```

### Backend (`cd backend`)

Tests need Postgres. Start it from the dev compose file, then apply migrations to the `library-test` database. `yarn test:docker:up` does both in one step, but it resets the test database and reseeds it.

```bash
docker compose -f ../.docker/docker-compose-dev.yml up postgres -d
yarn test:migrate             # prisma migrate deploy against .env.test

yarn start:dev                # watch mode, port 3000, Swagger at /swagger
yarn build                    # output is dist/src/main.js (rootDir is the project root); run with yarn start:prod
yarn lint
yarn typecheck                # tsc --noEmit over src and test; the tests themselves don't check types (CI runs it)
yarn test:unit                # *.unit-spec.ts
yarn test:inte                # *.inte-spec.ts (real Prisma repositories)
yarn test:e2e                 # *.e2e-spec.ts (full AppModule + supertest)
yarn test:cov                 # everything; enforces 100% statements/branches/functions/lines (CI runs this)

# Single file / single test: run Vitest without --coverage. The scripts enforce coverage thresholds that fail on partial runs.
npx env-cmd -f .env.test vitest run test/modules/user/document.unit-spec.ts
npx env-cmd -f .env.test vitest run -t "test name" <file>
yarn test:watch               # watch mode

yarn migrate                  # prisma migrate dev (new migration)
yarn migrate:check            # fails if prisma/schema differs from the migrated test database (CI runs it)
yarn seed                     # prisma db seed; skips a database that already has users or books
yarn generate                 # prisma generate; Prisma 7 doesn't on install or migrate, so run it after either
```

The app refuses to start unless `JWT_SECRET_KEY` and `JWT_REFRESH_SECRET` are set and at least 32 characters long (`src/modules/auth/auth.config.ts`). `.env.test` contains test values. `make dockerDev` (from the repo root) starts the dev stack behind nginx on `localhost:3000`: the frontend dev server at `/`, the API at `/v1` and `/swagger`, plus Postgres, pgAdmin, Prometheus and Grafana. The dev Docker entrypoint copies `.env.example` to `.env.dev`. The dev `app` and `frontend` containers mount the whole repository, install the workspace when they start (one at a time, `--mutex`) and run as uid/gid 1000 so files it writes to the mounted source folder aren't root-owned; set `HOST_UID`/`HOST_GID` if yours differ.

### Frontend (`cd frontend`, Node 24)

```bash
yarn start                    # ng serve on :4200, proxies /v1 to localhost:3000 (proxy.conf.json)
yarn build
yarn lint
yarn lint:styles              # stylelint on src/**/*.scss (CI runs it)
yarn test                     # ng test: Vitest with coverage, 100% thresholds (angular.json)
npx ng test --watch=false --coverage=false --include src/app/services/authentication.service.spec.ts
```

The root `yarn install` also installs the Git pre-commit hook (Husky, `core.hooksPath` = `frontend/.husky/_`), which runs Prettier on staged frontend files.

## Conventions enforced by lint

- **No relative imports** in either app (`no-restricted-imports` bans `./` and `../`). Use path aliases:
  - backend: `@src/ @test/ @shared/ @modules/ @db/` (`@modules/user/…` is `src/modules/user/`, `@shared/` is `src/modules/shared/`, `@db/` is `prisma/`)
  - frontend: `@app/ @shared/ @pages/ @env/`
  - the contracts: `@library/contracts` in both
- **File and folder names are camelCase** in both apps, plus a role suffix (`createUser.command.ts`, `customizedTable.component.ts`, `bookRental.repository.port.ts`). `eslint-plugin-check-file` enforces this. The exceptions are the frontend locale files (`en-US.ts`, `pt-BR.ts`) and Prisma migrations. Selectors and CSS classes stay kebab-case.
- Backend aliases are defined in both `tsconfig.json` and `vitest.config.mts` (`resolve.alias`). A new alias has to be added to both; a new module needs none, since `@modules/` covers it.
- **No `as` type assertions** in the backend (`consistent-type-assertions`; `as const` is allowed). Prefer a precise type, or parsing with Zod (the e2e tests parse response bodies with the schemas in `test/util/responseBodies.ts`). A cast that's really needed goes through `FPF.unsafeCoerce`, imported from `monads.ts` like the rest of fp-ts.
- Prettier with organize-imports runs on format. Double quotes.

## Backend architecture

### Module layout

Each feature module (`user`, `book`, `rental`, `auth`) under `src/modules/` is laid out as hexagonal/CQRS. Modules use another module's entity, repository port or exported providers, not its DTOs or handlers (`auth` gets `UserRepository` by importing `UserModule`, which exports it):

```
commands/<name>/<name>.command.ts      # ICommand + @CommandHandler (writes)
commands/<name>/<name>.controller.ts   # one controller per use case; dispatches via CommandBus
queries/<name>/<name>.query.ts|controller.ts   # reads via QueryBus
domain/          # Zod schemas = entities/value objects (type and validator share a name), their rules, errors, events
database/        # <x>.repository.port.ts (abstract class used as DI token), real<X>.repository.ts (Prisma), fake<X>.repository.ts (in-memory)
dtos/            # Swagger DTO classes (validation is done by Zod in the domain, not class-validator); once the module's API is in the contracts, only its query parameters'
```

Modules bind the port to the real repository (`{ provide: UserRepository, useClass: RealUserRepository }`). Unit tests bind the fake instead. Fakes extend `shared/utils/database/fakeRepository.base.ts`, and they count toward the 100% coverage threshold. Prisma repositories get their queries from `prismaTasks(() => this.prisma.<model>)` (`shared/utils/database/prismaTasks.ts`), which returns the delegate's methods as `TaskEither`s (`this.users.findMany({ where })`), and share `loadPage`, `validateRows` and `validateMaybeRow` from `shared/utils/database/rowValidation.ts`.

### Handlers are fp-ts pipelines

Command and query handlers inject `UseCase` (`shared/utils/application/useCase.ts`, transient, provided by the global `UseCaseModule`) next to their repositories, and their `execute` is `return this.useCase.run("CreateUser", input, FPF.pipe(…))`. `run` sets the logger's context, logs the request with `input` (leave out passwords and tokens; `undefined` logs none), runs the `ReaderTaskEither<{ logger, events }, Error, T>` pipeline and returns the Promise Nest expects. Handlers don't inject `PinoLogger` or `DomainEventPublisher` themselves. The building blocks:

- `shared/utils/application/monads.ts`: re-exports fp-ts modules under short names (`RTE`, `TE`, `RE`, `O`, `E`, `FPF`, …). Import from here, not from `fp-ts/*` directly.
- `fromInputRE(schema, name)`: Zod validation. A failure becomes `UnprocessableEntityException` (422).
- `performRTE(repoFn, "description")`: wraps a repository `TaskEither` call and logs success or failure with the description.
- Repositories return `TaskEither<Error, …>`. Lookups return `Option`: `findOrFailRTE(repo.findById, "get user by id", userNotFoundException)(id)` (in `perform.ts`) fails when nothing is found, and `ensureAbsentRTE(repo.findByCPF, "get user by cpf", userCPFAlreadyExistsException, conflicts?)` when something is (uniqueness checks; `conflicts` lets an update skip its own row).
- `publishRTE(userCreated)`, the step that ends a command: `RTE.tap(publishRTE(userCreated))` builds the event from the pipeline's value with the factory next to the event's schema and publishes it.
- Business rules are pure functions next to their entity: `registerUser`, `changeUserDetails` and `endsSessions` in `user.entity.ts`, and (returning `Either`, called with `RTE.chainEitherK`) `startRental`, `finishRental`, `ensureOwnedBy` in `bookRental.entity.ts` and `ensureAvailable` in `bookItem.entity.ts`, so a rule is written once and unit-tested without Nest. A handler only looks data up, applies the rules and stores the result. A rule the database must also enforce against concurrent requests is checked again by the repository's conditional write (`rent`, `finish`).

Domain errors know nothing of HTTP. Each is a `DomainError` subclass (`shared/utils/domain/shared.errors.ts`) in `domain/*.errors.ts`, with a small factory function, built with a kind, a `code` and a message: `super(DomainErrorKindEnum.Conflict, "user.cpfTaken", "…")`. `DomainErrorFilter` (`shared/utils/http/domainError.filter.ts`, registered in `app.setup.ts`) answers a rejected task with the kind's status (not found 404, conflict 409, unauthorized 401, unknown 500) and Nest's usual body plus the `code`; other errors, such as the 422 from `fromInputRE` and the guards' 401, stay Nest exceptions. The `code` is what the frontend translates, so a new error needs a code, and the frontend's `errors.<code>` translations (its `translationKeys.spec.ts` reads the codes from these files and fails otherwise). A new kind needs its status in the filter.

### Domain events

`DomainEventPublisher.publishEvent` validates the event against `DomainEvent`. That's a Zod discriminated union on `eventKey`, assembled in `shared/domainEventPublisher/domainEvent.ts` from each module's `domain/events/index.ts` (`AllUserEvents`, `AllBookInfoEvents`, `AllRentalEvents`). It then emits through `@nestjs/event-emitter`. Each event file also exports a factory that builds the event from its entity (`userCreated(user)`, `bookRented(rental)`), which handlers pass to `publishRTE`. **A new event schema has to be added to its module's `All*Events` tuple, or publishing fails validation.** Subscribers (`book/subscribers/`) use `@OnEvent` and dispatch commands.

### Consistency rules

- Renting and returning are atomic: `BookRentalRepository.rent` and `finish` run in a Prisma `$transaction`, using a conditional `updateMany` on the `BookItem` status or the rental status. Book item status must not be changed through events or separate writes.
- A user with an unfinished rental can't be deleted (409 `user.hasActiveRentals`). Rentals cascade with the user, which would leave the book item rented, so `RealUserRepository.deleteById` is a conditional `deleteMany`.
- Prices are reais to the centavo in the API and the domain (`Money`, `book/domain/money.ts`) and centavos in the database (`BookInfo.priceCents`). The repositories convert with `book/database/priceColumn.ts`; computed amounts like fines are rounded with `roundToCentavo`.
- `User.cpf` uses `DocumentType`. It is deliberately lenient (length only), because it also validates rows read from the database. Check-digit validation (CPF and alphanumeric CNPJ) is `CheckedDocumentType`, part of the input schemas `NewUserInput` and `UserChangesInput` (`user.entity.ts`), which the create and update commands parse. Clients must have a CPF; admins may leave it empty.
- `User.password` is a `PasswordHash` (`user/domain/password.ts`, branded, made only by `PasswordHasher` or by parsing a stored row), so a plain password can't be stored by mistake. `PasswordHasher` is a port in the user domain, bound to bcrypt in `UserModule`, which exports it for login, so `auth` depends on `user` and not the reverse; `PlainPassword` holds the length rule. An update without a password keeps the old one, and it revokes the user's refresh tokens only when the password, email or role changed (`endsSessions`).

### Database migrations

- The schema is one file per module in `prisma/schema/` (`schema.prisma` holds the generator and datasource); Prisma reads the whole folder. Prisma's configuration is `prisma.config.ts`: the schema folder, the datasource URL and the seed command. It loads `.env` itself, without overriding variables that are already set (env-cmd, Docker Compose `env_file`). The client is generated into `prisma/generated/` (gitignored, excluded from coverage) and imported as `@db/generated/client`, not `@prisma/client`. `PrismaService` and the seed connect through the `pg` driver adapter (`createPrismaAdapter`).
- Schema changes go through `yarn migrate` (`prisma migrate dev`), which writes a migration under `prisma/migrations/`. Production applies them with `make dockerMigrate` (`prisma migrate deploy`).
- Data changes that SQL can express belong in the same migration: create it with `yarn migrate --create-only --name <name>` and add the `UPDATE`/`INSERT` after the schema changes in its `migration.sql`. It then runs once, in order, in a transaction, and in every environment (dev container, test database, CI). Prefer a column `DEFAULT` when it fills existing rows, as `add_user_token_version` does.
- There is no separate post-migration script, because one would run on every deploy rather than once. If a data change ever needs app code, add one script per change with a table recording which have run, and run the pending ones after `migrate deploy`. For changes that must not break the running app, expand first (add and backfill the new column), switch the code over, then drop the old column in a later migration.

### Auth

- `AuthGuard` checks the Bearer JWT. `RolesGuard` together with `@Roles(UserRoleEnum.Admin, …)` restricts by role. Both are applied per controller or per method; there is no global guard. Every route except `POST /v1/login`, `POST /v1/refresh` and `GET /check/status` requires a token, books included. `test/modules/auth/routeProtection.e2e-spec.ts` collects the registered routes and fails if any other route answers without one; a new public route has to be added to its `publicRoutes` list.
- Login returns an access token and a refresh token, signed with different secrets. Both are checked against the configured audience and issuer (`jwtModuleOptions` in `auth.config.ts`). `POST /v1/refresh` exchanges a refresh token for a new pair.
- Refresh tokens are single-use. Each login creates a `RefreshSession` row, and the refresh token carries its id (`sid`) and the session's current `jti`. `POST /v1/refresh` swaps the jti with a conditional `updateMany` (`RefreshSessionRepository.rotate`); reusing an old token deletes the session, logging out both holders. The frontend serializes refreshes across tabs with the Web Locks API and syncs credentials through `storage` events, so tabs never send the same token twice.
- Refresh tokens also carry the user's `tokenVersion`. `POST /v1/logout` and a user update that changes the password, email or role increment it (`UserRepository.incrementTokenVersion`), which revokes every refresh token issued before. Access tokens remain stateless and valid until they expire.
- `POST /v1/login` is rate-limited per client IP and email (`LoginThrottlerGuard`; `LOGIN_RATE_LIMIT` and `LOGIN_RATE_WINDOW_SECONDS`). Client IPs come from `X-Forwarded-For` only when `TRUST_PROXY` lists the proxy.
- Ownership checks: clients rent for themselves and may return only their own rentals; someone else's rental is reported as 404.
- User responses must go through `toUserResponse` (`user/dtos/user.dto.ts`) so `password` and `tokenVersion` are never returned.

### Tests

- The tests run on Vitest 5 (`vitest.config.mts`) with globals (`describe`, `it`, `expect`, `vi.fn`/`vi.spyOn`). `unplugin-swc` compiles them, because Vite's own transform doesn't emit the decorator metadata Nest's injection needs; it doesn't check types, which is `yarn typecheck`'s job. Coverage is V8, which ignores the metadata SWC generates. There are two projects: `unit` (no database) and `database` (integration and e2e suites); `test:unit`, `test:inte` and `test:e2e` pick a project and narrow `coverage.include` to the code their suites cover.
- Test files live in `test/modules/<module>/`, named by kind: `*.unit-spec.ts` (handlers with fake repositories), `*.inte-spec.ts` (real repositories against Postgres), `*.e2e-spec.ts` (AppModule + supertest).
- Use the builders: the core's in `test/dataBuilders/` (`UserBuilder`, `MockAuthGuardBuilder`), and each module's own next to its specs (`test/modules/book/bookInfoBuilder.ts`, `createBook.ts`, `test/modules/rental/bookRentalBuilder.ts`). Use deterministic IDs from `test/util/defaultIds.ts` (`createTestId(TableNameEnum.X, n)`).
- Unit specs start with `const ctx = useHandlerModule({ providers: [Handler] }, (get) => ({ handler: get(Handler), users: get(UserRepository) }))` (`test/util/handlerModule.ts`), then use `ctx.handler`. It rebuilds the module before each test: every repository bound to its fake, a silent logger, real UUIDs, bcrypt for passwords and the event publisher; a provider passed in replaces the default for its token, and `init: true` runs `module.init()` for CQRS event handlers. `get` is typed from the token (Nest's own `get` types abstract-class tokens as `any`); `get(FakeUserRepository)` returns the same fake, for specs that inspect it.
- E2E specs start with `const e2e = useE2eApp({ authGuard })` (`test/util/e2eApp.ts`), then use `e2e.http()`, `e2e.prisma` and the typed `e2e.get(…)`. It builds the app with the same setup as `main.ts` (`src/app.setup.ts`: helmet, Swagger, request context, `trustProxy`; `main.ts` only adds listening), empties the database first and closes the app afterwards. `beforeInit` runs before `app.init()`; `buildE2eApp`/`closeE2eApp` build extra apps, e.g. with another `trustProxy`.
- E2E tests replace `AuthGuard` with `MockAuthGuardBuilder` (an admin by default); call `.withRole(UserRoleEnum.Client)` and then `.reset()` to test role restrictions, and `RolesGuard` stays real. `routeProtection.e2e-spec.ts` logs in for real instead.
- `test/db/seed.inte-spec.ts` tests `prisma/seed.ts` through its exported `seed(prisma)`.
- Suites run in parallel (`maxWorkers: "50%"`; each worker loads the app again, so more gain little), each worker on its own database: `test/globalSetup.ts` copies the migrated `library-test` to `library-test-<worker>` (`CREATE DATABASE … TEMPLATE`) before every run, and `test/util/useWorkerDatabase.ts` (`setupFiles`) points `DATABASE_URL` at the worker's copy (`VITEST_POOL_ID`). The copy fails if anything else is connected to `library-test`. The `unit` project needs no database and skips both. Each file still gets fresh modules (Vitest's default isolation); the database suites fail with `isolate: false`. `resetDatabase(prisma)` (`test/util/resetDatabase.ts`) empties every table; specs call it in `beforeEach` unless they seed once in `beforeAll` and clean only what each test adds.

## Frontend architecture

- `src/app/pages/<feature>/` holds lazy-loaded route groups (`*.routes.ts`, loaded from `pages/pages.routes.ts`). Route access is restricted with `data: { roles: [...] }` and `shared/guards/permission.guard.ts`, which the layout route runs as both `canActivate` and `canActivateChild` (`canActivate` alone never sees the children's roles). `pages/pages.routes.spec.ts` checks which pages each role can open. A role lands on the first page of `sidebarMenuItems` it can open (`defaultRolePage` in `navMenuItems.ts`), after login and for unknown or forbidden pages, or on `home` when it has none.
- `services/*.http.service.ts` are thin `HttpClient` wrappers (a feature's own models and services live in its page folder, as `pages/books/book.http.service.ts`); their specs pin each URL and method to the backend routes. Paginated requests build their query parameters with `PageRequestUtility.toHttpParams`. `CredentialsService` stores the user and tokens in localStorage. `AuthenticationService` handles login, logout and refresh.
- HTTP interceptors run in this order: `authHttpInterceptor` → `errorHandlerInterceptor`.
  - `authHttpInterceptor` adds the Bearer token and language headers, and merges identical requests that are in flight at the same time. A request with a `noauth` header skips it entirely.
  - `errorHandlerInterceptor`: on a 401 it refreshes the token once and retries the request; it logs out on 403 or when the refresh fails.
- The app is zoneless (`provideZonelessChangeDetection()` in `app.config.ts`, no zone.js). State that changes outside template events (timers, promises, subscriptions) must go through signals, the `async` pipe or `markForCheck()`, or the view won't update.
- Components use OnPush, which is the default since Angular 22: leave `changeDetection` out. The `prefer-on-push-component-change-detection` lint rule rejects `Eager`. A component whose template reads state changed outside its own template events (router events, other services) must call `markForCheck()` or use signals or the `async` pipe; see the `NavigationEnd` handler in `sidebar.component.ts`.
- Translations (ngx-translate): `shared/i18n/translations/pt-BR.ts` is the source, nested by area (`books.list.title`, `common.cancel`); `TranslationKey` is derived from it, and `en-US.ts` must have the same shape or the build fails. Templates use `"books.list.title" | translate`; TypeScript passes keys typed `TranslationKey` or wrapped in `t()` (`translate.instant(t("books.created"))`). `translationKeys.spec.ts` reads the templates and code and fails on unknown or unused keys, and checks `errors.<code>` against the backend's error codes, which the error interceptor translates.
- State that templates read is a signal (`signal`, `computed`, `input()`, `viewChild()`/`contentChildren()`, `toSignal`); request pipelines stay RxJS (services, interceptors, `PaginatedDataSource`, where `switchMap` cancels a stale request). Unsubscribe with `takeUntilDestroyed()`.
- Shared building blocks in `shared/components/`: `app-page-header` (page title and actions), `app-form-card` (form pages), `customizedTable` with `PaginatedDataSource` (lists), `ConfirmDialog.confirm()` (destructive actions) and `app-theme-toggle`. Messages go through `NotificationService` (`services/`): `success(key)` and `error(key)` take translation keys, `errorMessage(text)` takes text that's already translated, like the API's errors, and `persistent(key, actionKey)` stays until its action is picked, coming back after other messages (the update alert). Colors come from Material's `--mat-sys-*` variables and spacing from `--space-1`…`--space-6` (`theme/_variables.scss`), so both light and dark schemes work.
- Small screens are below 768px (`smallScreenQuery` and `injectIsSmallScreen()` in `shared/utils/smallScreen.utility.ts`; SCSS uses `@media (width < 768px)`). There the sidebar becomes a menu opened from the header, and the lists pass fewer columns to `customizedTable` through `[columns]`, moving the rest under the main cell.
- An `@if` block isn't projected into a named content slot (`select="…"`) by itself, and the build warns (NG8011). Wrap it in an element that matches the slot (`<ng-container pageActions>`, `ngProjectAs="mat-card-subtitle"`), or, inside a `mat-form-field`, use one `mat-error` and pick its message inside it.
- Specs use `@openng/spectator/vitest` (the maintained fork of `@ngneat/spectator`) (`createComponentFactory`, `createHostFactory`, `createServiceFactory`, `createInjectionContextFactory`, `mocks: [...]`) with `HttpTestingController`, not `TestBed` directly. To run effects or render overlays (autocomplete panels, dialogs), call `spectator.inject(ApplicationRef).tick()`.

## Contracts

`packages/contracts` (`@library/contracts`) is the API's promise: the shapes requests and responses have, and the values and rules both apps need. It holds only Zod: no Nest, fp-ts or Prisma; moments are `Timestamp` (an ISO string on the wire, a `Date` in the backend), lists `page(item)`. It's built to ESM in `dist/` (`yarn install` builds it; `yarn contracts:watch` while editing it), and both apps import the build.

- A domain is two files: `<domain>/values.ts`, the enums as `as const` objects and the rules (`inWholeCentavos`), without Zod, since the frontend imports them at runtime and its bundle must stay free of it; and `<domain>/schemas.ts`, the requests and responses, each named for Swagger with `contract(schema, { id, description })`. A schema's exported type is the wire's (`z.input`).
- Backend: a command's `props` is its request type. A controller takes it as its `@Body()`, returns `Promise<Sent<typeof X>>`, so a response missing a field doesn't compile, and documents them with `@ApiBody({ schema: contractRef(X) })` and `schema: contractRef(X)` in its responses (`contractList(X)` for a list); `app.setup.ts` adds every contract to the OpenAPI document. Query parameters keep their Swagger DTO class. Entities stay in the backend's domain.
- Frontend: `import type` the shapes, under the screens' names where they differ (`BookEntity = BookInfo`), and import the values.
- `book` is in the contracts; the others keep their `dtos/` and hand-written frontend models until they move, one at a time, so there are never three copies.
- Its specs (`src/**/*.spec.ts`, `yarn test` in the package) keep it at 100%; its Prettier config is the backend's (`yarn format`).

## Adding a feature

Copy the closest existing module and rename it: `user` for plain CRUD, `rental` for writes that must be atomic.

Backend (`src/modules/<name>/`, imported as `@modules/<name>/…`):

1. **Model**: add `prisma/schema/<name>.prisma`, run `yarn migrate --name <change>` and `yarn generate`. Add its `TableNameEnum` entry and id prefix in `test/util/defaultIds.ts`. `resetDatabase` empties the new table by itself.
2. **Domain**: the Zod entity in `domain/<name>.entity.ts`; errors in `domain/<name>.errors.ts`, each a `DomainError` with a kind and a code, and a case in `test/modules/<name>/<name>Errors.unit-spec.ts` (`itAnswersWithErrorCodes`); events in `domain/events/`, each with its factory, exported as `All<Name>Events` and spread into `DomainEvent` (`shared/domainEventPublisher/domainEvent.ts`), or publishing fails validation.
3. **Repository**: the port, the Prisma repository and the fake (`database/`). Bind the port in `<name>.module.ts`, and the fake in `test/util/handlerModule.ts` (`fakeRepository(Port, Fake)`) so unit tests get it.
4. **Use cases**: a `commands/` or `queries/` folder per use case, each controller with `AuthGuard` (and `RolesGuard` with `@Roles` when restricted). A public route goes in `publicRoutes` (`routeProtection.e2e-spec.ts`).
5. **Register** the module in `src/app.module.ts`.
6. **Tests**, in `test/modules/<name>/`: its builder, unit specs for the handlers, an integration spec for the Prisma repository and e2e specs for the routes. `yarn test:cov` requires 100% coverage, fakes included.

Frontend:

1. **Data**: the model and `<name>.http.service.ts` in `pages/<name>/`, with a spec that pins each URL and method.
2. **Pages**: `pages/<name>/<name>.routes.ts`, loaded from `pages/pages.routes.ts` with `data: { roles }`, plus cases in `pages.routes.spec.ts`; the sidebar entry in `layouts/components/sidebar/navMenuItems.ts`. Build them from the shared components (`app-page-header`, `app-form-card`, `customizedTable`).
3. **Text**: keys in `pt-BR.ts` and the same shape in `en-US.ts`, including `errors.<code>` for each new backend error code (`translationKeys.spec.ts`).

## CI and deployment

- `.github/workflows/node.js.yml` runs on pushes and PRs to `main`. The backend job runs migrations, build and `test:cov` against a Postgres service. The frontend job runs lint, Stylelint, tests and build on the Node version in `frontend/.nvmrc`. Both upload their `coverage-summary.json` as artifacts, and the `badges` job, which waits for both, regenerates the coverage badges on the `badges` branch (`badges/backend/`, `badges/frontend/`, shown in the README). The `deploy` job, also after both and only on pushes, SSHes to the server and runs `make dockerDeploy REF=<tested commit>`; it's skipped while the `DEPLOY_HOST` repository variable is unset (README, "Deploying").
- Swagger (`/swagger`) is public in production on purpose; nginx proxies it.
- Deployment is manual, to one Docker host (README, "Deploying"). `make serverSetup` (`.docker/serverSetup.sh`, rerunnable) prepares a fresh Ubuntu server: Docker from Docker's apt repository, 2 GB of swap under 3 GB of memory, the `nginx_network`, and `.docker/.env` and the root `.env` (from `backend/.env.example`) with generated secrets. On the server, `make dockerDeploy` fast-forwards to `REF` (default `origin/main`), runs `make dockerMigrate` (applies migrations and waits for them) and then rebuilds the stack, as `make dockerProd` does after a `git pull`; all from the repo root with Docker Compose (`.docker/docker-compose.yml`: app, Postgres, pgAdmin, certbot, nginx). The compose files, nginx and Prometheus configs live in the root `.docker/`; each app's Dockerfiles stay in its own `.docker/` (`backend/.docker/`, `frontend/.docker/`). Images build from the repository root (its `.dockerignore`) and install only their app and the contracts (`.docker/pruneWorkspace.js`). Only nginx (ports 80 and 443) is public; the app, Postgres and pgAdmin publish their ports on the `nginx_network` gateway (`172.18.0.1`), which nginx proxies to. The production backend Dockerfile starts `dist/src/main.js` and builds no `.env` into the image (the root `.dockerignore` excludes them): the `app` and `migrate-deploy` services get the API's settings from the repo root's `.env` (`env_file`).
- The nginx image is built from `frontend/.docker/Dockerfile` (the Angular build in `/usr/share/nginx/html`) with `.docker/nginx.conf` mounted. Port 80 only answers Let's Encrypt challenges and redirects to HTTPS. `make dockerCertificate` issues the certificate once (certbot standalone, `--cert-name site`, so nginx's path doesn't depend on the domain); the `certbot` service renews it through the webroot, and nginx reloads every 6 hours to pick it up.
- The stack's settings and credentials (domain, Postgres, pgAdmin) are in `.docker/.env` (gitignored; template `.docker/.env.example`), which Compose reads; a missing one fails `docker compose` with its name. The app's and `migrate-deploy`'s `DATABASE_URL` is built from them in the compose file and overrides the one in the root `.env`.
