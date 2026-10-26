# CLAUDE.md

Guidance for Claude Code working in this repository.

## Overview

A library (book lending) app for Brazilian users: UI text, Swagger docs and error messages are in Portuguese. A Yarn 1 workspace (one root `package.json` and `yarn.lock`):

- `backend/`: NestJS 12 on Fastify, Prisma 7 + PostgreSQL, Zod, fp-ts, JWT auth.
- `frontend/`: Angular 22 (standalone, zoneless), Angular Material, ngx-translate (pt-BR, en-US), Vitest on happy-dom.
- `packages/contracts/`: `@library/contracts`, what travels over HTTP (Zod schemas, enums) and the rules both apps apply.

TypeScript 6.0 (Angular and typescript-eslint don't support 7 yet); Node 24 (`.nvmrc`; run `source ~/.nvm/nvm.sh && nvm use` first).

The repository is also a seed. `shared`, `auth`, `user` and `audit` (backend) and the `auth`, `home`, `users` and `audit` pages are the **core**; `book` and `rental` (`books`, `rentals` pages) are the **lending example**. The example lives in its own folders; the few lines it needs in core files carry a `Lending example` comment (`git grep -i "lending example"` lists them). Keep it that way: no unmarked example code in core files, and core code and specs never use the example. The example follows the core's patterns, so it can be copied.

## Commands

```bash
# Repo root
yarn install                  # everything; builds the contracts, installs the pre-commit hook (Prettier on staged frontend files)
yarn contracts:watch          # rebuild the contracts while editing them (the apps import the build)
yarn build | yarn lint | yarn lint:check | yarn typecheck | yarn test   # all packages

# backend/ — tests need Postgres and SeaweedFS: docker compose -f ../.docker/docker-compose-dev.yml up postgres storage -d
yarn test:migrate             # migrate the library-test database (yarn test:docker:up also resets and reseeds it)
yarn start:dev                # :3000, Swagger at /swagger
yarn test:cov                 # every suite, 100% coverage required (CI)
yarn test:module <module>     # one module's specs and coverage (quick loop)
npx env-cmd -f .env.test vitest run <file> [-t "name"]   # single file/test, no coverage
yarn lint:changed             # lint:check of files changed since the last commit
yarn migrate --name <change>  # new migration; then yarn generate (Prisma 7 doesn't generate on migrate)
yarn migrate:check            # schema vs migrated test database (CI)
yarn scaffold <module> <useCase> command|query [--route r] [--fields "name:string,qty?:int"] [--method m] [--guard roles|auth] [--spec unit|e2e|none]

# frontend/
yarn start                    # :4200, proxies /v1 to :3000
yarn test                     # 100% coverage required
yarn test:module <page>       # one pages/<page> folder
yarn lint:changed | yarn lint:styles
```

`make dockerDev` runs the whole dev stack behind nginx on `localhost:3000`. The API won't start without `JWT_SECRET_KEY`/`JWT_REFRESH_SECRET` (32+ characters) and the `S3_*` settings of a reachable storage; `.env.test` has test values.

While working, check with `lint:changed` and `test:module` (they only report). Once at the end: `yarn lint` (fixes), `yarn typecheck`, then the full suites, since a module's run misses what other modules' specs cover.

## Conventions (lint enforces them)

- No relative imports. Aliases: backend `@src/ @test/ @shared/ @modules/ @db/ @scripts/` (defined in both `tsconfig.json` and `vitest.config.mts`); frontend `@app/ @shared/ @pages/ @env/`; `@library/contracts` in both.
- File and folder names camelCase with a role suffix (`createUser.command.ts`), except locale files and migrations.
- No `as` in the backend (`as const` is fine): type precisely or parse with Zod; a needed cast is `FPF.unsafeCoerce`.
- Prettier with organize-imports, double quotes.

## Backend

### Modules

Each module under `src/modules/` is hexagonal/CQRS: `commands/<name>/` and `queries/<name>/` (handler + one controller each), `domain/` (Zod entities, their rules, errors, events), `database/` (port as abstract class, `real<X>` Prisma repository, `fake<X>` in-memory). Modules use another module's entity, port or exported providers, never its handlers.

### Handlers

`execute` is `return this.useCase.run("Name", input, FPF.pipe(…))`. `input` is logged and, for commands, kept in the audit: name the record's `id` in it and leave out passwords, tokens and file bytes. The pipeline:

1. Open with `inputsRTE({ id: [UUID, "id", command.id], input: [XInput, "X", command.props] })`; inputs are the contract's request schemas (`BookDetails = BookInfoRequest`), plus rules only the backend checks.
2. Look up with `findOrFailRTE(repo.findById, "get x by id", xNotFoundException)(id)` / `ensureAbsentRTE(…)`.
3. Apply pure rules from the domain (`registerUser`, `changeBookDetails`, `newRental`, `startRental`). A rule that refuses returns `Either` (`RTE.chainEitherK`). "Now" is the injected `Clock`'s `now()` (the business day, America/Sao_Paulo, is `today()`), passed into rules, never `new Date()`.
4. Store with `performRTE(repo.save, "…")`. A rule concurrent requests could break is checked again by the repository's conditional write.
5. End with `RTE.tap(publishRTE(xCreated))` and, when a screen shows it, `changedRTE({ resource, key? })`.

Import fp-ts only from `shared/utils/application/monads.ts`.

Controllers open with `@ApiController("<tag>", ...guards)`, take the request type as `@Body()`, return `Promise<Sent<typeof X>>`, and document domain errors with `@ApiErrors(XNotFoundException, …)` and contracts with `contractRef(X)`. Query strings are contracts too: `@ApiQueryContract(X)`, typed `QueryString<typeof X>`. Restrict with `@UseGuards(RolesGuard)` + `@Roles(UserRoleEnum.Admin)`.

### Errors

`export class XNotFoundException extends domainError(DomainErrorKindEnum.NotFound, "x.notFound", "…") {}` plus a factory, in `domain/x.errors.ts`. `DomainErrorFilter` answers with the kind's status and the `code`. A new code goes in the contracts' `errorCodes` (`errors.ts`), gets a case in `<x>Errors.unit-spec.ts`, and needs its `errors.<code>` translation in both languages. A refusal that mustn't log the user out is a `Forbidden` domain error, never a guard (the frontend logs out on a 403 without a code).

### Events and live updates

A new event goes in its module's `All*Events` tuple, or publishing fails validation. Subscribers (`@OnEvent`) dispatch commands. `changedRTE` reaches the browsers through `SocketGateway` (Socket.IO at `/v1/socket.io`); a new resource goes in the contracts' `Resource` and the frontend's `RESOURCE`.

### Consistency

- A save touching several records is one `transactionTask(this.prisma, async (tx) => …)`; a conditional write is `ensureWritten(await tx.x.updateMany({ where: { id, …what was read } }), xChangedException)` or a `deleteMany`/`updateMany` whose count decides.
- A fake does what its Prisma repository does, refusals and what a save keeps included; a fake whose Prisma repository writes another module's rows writes through that module's fake (`FakeBookRentalRepository` → `FakeBookInfoRepository`).
- Files go through `FileStorage` (`shared/storage/`, a private S3 bucket): read uploads with `readUpload(request, maxBytes)`, take the type from the bytes (`fileTypeOf`), store the file before the row points to it (`removeUnsavedRTE` if the write fails, `removeUnusedRTE` for one nothing points to). Book covers are the model.
- Money is reais to the centavo in the API (`Money`) and centavos in the database (`priceColumn.ts`).
- User responses go through `toUserResponse`, so `password` and `tokenVersion` never leave.

### Database

One schema file per module in `prisma/schema/`; the client is `@db/generated/client`. A data change SQL can express goes in its migration (`--create-only`, then the `UPDATE`); for changes the running app mustn't notice: expand, switch the code, drop later.

### Auth

Every route needs a token except `POST /v1/login`, `POST /v1/refresh` and `GET /check/status`; `routeProtection.e2e-spec.ts` fails otherwise (a new public route goes in its `publicRoutes`). Refresh tokens are single-use and carry the user's `tokenVersion`, which logout and a change of password, email or role increment.

### Tests

- Vitest with globals; files in `test/modules/<module>/`: `*.unit-spec.ts` (handlers with fakes), `*.inte-spec.ts` (Prisma), `*.e2e-spec.ts` (AppModule + supertest). Files aren't isolated: never leave `vi.mock`, timers or `process.env` changed.
- Unit: `const ctx = useHandlerModule({ providers: [Handler] }, (get) => ({ handler: get(Handler), users: get(UserRepository) }))`. Repositories are fakes, the clock is `FakeClock` (2026-10-21 12:00 UTC), files and the audit are in memory (`get(FakeFileStorage)`, `get(FakeAuditLog)`).
- E2E: `const e2e = useE2eApp({ authGuard })` with `MockAuthGuardBuilder` (an admin; `.withRole(…)`, then `.reset()`); `e2e.http()`, `e2e.prisma`, `e2e.get(…)`.
- Each port has one contract (`<x>Repository.contract.ts`), run on the fake by `fake<X>.repository.unit-spec.ts` and on Prisma by `real<X>.repository.inte-spec.ts`. Cases seed through ports and state what the port promises.
- Builders in `test/dataBuilders/` and next to each module's specs; ids from `createTestId(TableNameEnum.X, n)`; `resetDatabase(prisma)` in `beforeEach`.
- Each worker gets its own database and bucket. A `DATABASE_URL` already set wins over `.env.test`, so a worktree can test on its own `library-test-<name>` template (`yarn test:migrate` first); names without `test` are refused.

## Frontend

- `pages/<feature>/` are lazy route groups with their model (aliases of the contracts' types) and `<feature>.http.service.ts` (spec pins each URL and method). Access is `data: { roles }`, checked by `permission.guard.ts`; `pages.routes.spec.ts` covers each role. The sidebar is `navMenuItems.ts` (related pages share a `group`).
- Zoneless and OnPush: template state is signals (`signal`, `computed`, `input()`, `toSignal`); requests stay RxJS; unsubscribe with `takeUntilDestroyed()`.
- Use the shared building blocks: `app-page-header`, `app-form-card`, `customizedTable` + `PaginatedDataSource`, `ConfirmDialog.confirm()` for destructive actions, `injectSaving(log)` for every save (one at a time, the API's message on failure), `app-dialog-actions`/`[appBusy]`, `app-row-actions`, `*appLoaded` with `loading(log)`, `app-report-table`, `app-suggestions`, `img[appAuthSrc]` for files behind the token, `detailsOf(error, code)` and `isChangedMeanwhile(error)`, `canDeactivate: [unsavedChangesGuard]` for forms (`HasUnsavedChanges`), `offered(entries, chosen)` for pickers, `readPreference`/`writePreference` for per-browser choices, `printDocument`, `pastedRows`, `[appTemplateContext]` and `*matCellDef="let row; dataSource: data"` for typed templates. Messages go through `NotificationService` (`success`/`error` take keys, `errorMessage` translated text).
- Translations: pt-BR is the source. Core texts are in `pt-BR.ts`; a page's namespace goes in `pages.pt-BR.ts`; the en-US files have the same shape. Templates use `"x.y" | translate`, code passes `t("x.y")`. `translationKeys.spec.ts` fails on unknown, unused or misplaced keys and missing `errors.<code>`.
- Styles: colors from `--mat-sys-*`, spacing from `--space-1`…`--space-6`, small screens below 768px (`injectIsSmallScreen()`, fewer list `[columns]`). An `@if` isn't projected into a named slot by itself: wrap it (`<ng-container pageActions>`).
- Specs use `@openng/spectator/vitest` (`createComponentFactory`, `mocks: […]`) with `HttpTestingController`; `spectator.inject(ApplicationRef).tick()` runs effects and renders overlays. Specs share a DOM: undo global changes (prototype spies, `vi.stubGlobal`); block storage with `blockStorage()`.

## Contracts

Only Zod (no Nest, fp-ts or Prisma). Moments are `Timestamp` (ISO on the wire, `Date` in the backend). A domain is `values.ts` (enums as `as const` objects and shared rules, no Zod, since the frontend bundles them) and `schemas.ts` (requests and responses, named with `contract(schema, { id })`; exported types are `z.input`). Shared: `common.ts` (`Id`, `BusinessDate`, `YearMonth`, `Timestamp`, `page`, `PageQuery`, `optionalParam`, `Created`), `dates.ts` (business days: `businessDateOf`, `addDays`), `errors.ts`, `files.ts`, `liveUpdates.ts`, `text.ts`. There are no DTO classes: a shape is written once, here. 100% coverage (`yarn test` in the package).

## Adding a feature

Copy `user` (plain CRUD) or the lending example (`book` for files, `rental` for atomic writes). Backend: the Prisma schema and migration, a `TableNameEnum` entry; entity, rules, errors (with codes and spec cases) and events; port, Prisma repository and fake, bound in the module and in `test/util/handlerModule.ts`; contracts with their spec; use cases (`yarn scaffold`); the module in `app.module.ts`; specs at 100%. Frontend: model and http service with spec, routes with `data: { roles }` and `pages.routes.spec.ts` cases, the sidebar entry, texts in both languages.

## CI and deployment

`.github/workflows/node.js.yml` (pushes and PRs to `main`): backend migrations, build and `test:cov` against Postgres and SeaweedFS; frontend lint, Stylelint, tests and build; coverage badges; on pushes, a `deploy` job that hands the commit to the server's deploy hook (skipped while `DEPLOY_URL` is unset). Production is one Docker host (`.docker/docker-compose.yml`, `make dockerDeploy`); the README's "Deploying" section has the setup, settings and monitoring. Only nginx is public; Swagger is public on purpose.
