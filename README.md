# Library

**Backend** ![Branches](https://github.com/Elvis8899/library-angular-nest/blob/badges/badges/backend/coverage-branches.svg) ![Functions](https://github.com/Elvis8899/library-angular-nest/blob/badges/badges/backend/coverage-functions.svg) ![Lines](https://github.com/Elvis8899/library-angular-nest/blob/badges/badges/backend/coverage-lines.svg) ![Statements](https://github.com/Elvis8899/library-angular-nest/blob/badges/badges/backend/coverage-statements.svg) ![Coverage total](https://github.com/Elvis8899/library-angular-nest/blob/badges/badges/backend/coverage-total.svg)

**Frontend** ![Branches](https://github.com/Elvis8899/library-angular-nest/blob/badges/badges/frontend/coverage-branches.svg) ![Functions](https://github.com/Elvis8899/library-angular-nest/blob/badges/badges/frontend/coverage-functions.svg) ![Lines](https://github.com/Elvis8899/library-angular-nest/blob/badges/badges/frontend/coverage-lines.svg) ![Statements](https://github.com/Elvis8899/library-angular-nest/blob/badges/badges/frontend/coverage-statements.svg) ![Coverage total](https://github.com/Elvis8899/library-angular-nest/blob/badges/badges/frontend/coverage-total.svg)

A full-stack library management system for lending books: an admin manages the catalogue and users, and clients borrow and return copies. The UI is available in Portuguese and English, and the API documentation is in Portuguese.

It is also a starting point for other projects: login, users and the conventions are the reusable core, and the lending is an example to learn from and then remove. See [Starting a new project](#starting-a-new-project).

| App | Stack |
|---|---|
| [`backend`](backend/README.md) | NestJS 12 on Fastify, Prisma 7 + PostgreSQL, Zod, fp-ts, JWT |
| [`frontend`](frontend/README.md) | Angular 22, Angular Material, ngx-translate, Vitest |

## Features

- **Catalogue:** books (title, cover, price), each with any number of physical copies.
- **Loans:** renting a copy and returning it. A copy can't be rented twice at the same time; the database enforces this with a transaction.
- **Late fees:** loans are due 7 days after renting, at the end of the day. Returning late costs a fixed R$20 plus 5% of the book's price per day.
- **Users and roles:**
  - **Admins** manage books and users, and can rent a book on behalf of any client.
  - **Clients** rent for themselves and only see their own loans. Clients must have a valid CPF (or CNPJ, including the alphanumeric format).
- **Auth:** JWT access tokens plus refresh tokens. The frontend refreshes expired sessions transparently.

## Getting started

### Requirements

- Docker with Compose, for PostgreSQL (or the full dev stack)
- Node 24 for both apps (`.nvmrc` in each)
- Yarn 1.22

### Option A: Docker dev stack

The dev stack runs the API and the frontend in watch mode behind nginx, together with PostgreSQL, pgAdmin, Prometheus and Grafana:

```bash
make dockerDev          # from the repo root: docker compose -f .docker/docker-compose-dev.yml up --build -d
```

On each start, the API container installs dependencies, applies migrations and seeds the database if it is empty (demo users `admin@admin.com` / `admin` and `client@client.com` / `client`, plus books). On first start it also creates `.env.dev` from `.env.example`. The frontend container installs its dependencies. Both use the source folders on your machine, so edits reload live. Everything is served on **http://localhost:3000**:

| Path | Service |
|---|---|
| `/` | Frontend (Angular dev server) |
| `/v1/...` | REST API |
| `/swagger` | API documentation |
| `/pgadmin4/` | pgAdmin |
| `/grafana/`, `/prometheus/` | Metrics |

### Option B: run the backend on the host

```bash
cd backend
docker compose -f ../.docker/docker-compose-dev.yml up postgres -d
cp .env.example .env    # then set DATABASE_URL to localhost, see the comment in the file
yarn install
yarn migrate            # apply migrations
npx prisma db seed      # demo users and books (runs automatically when migrate creates the database)
yarn start:dev          # http://localhost:3000, Swagger at /swagger
```

`JWT_SECRET_KEY` and `JWT_REFRESH_SECRET` are required, and each must be at least 32 characters. The values in `.env.example` are for local development only. Generate real ones with `openssl rand -base64 48`.

### Frontend

```bash
cd frontend
nvm use                 # Node 24
yarn install
yarn start              # http://localhost:4200, proxies /v1 to localhost:3000
```

### Demo accounts

The seed creates two users and a few books:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@admin.com` | `admin` |
| Client | `client@client.com` | `client` |

## Testing

```bash
# Backend: needs the PostgreSQL container running
cd backend
yarn test:migrate       # apply migrations to the library-test database
yarn test:cov           # unit + integration + e2e, requires 100% coverage

# Frontend
cd frontend
yarn test               # Vitest, requires 100% coverage
yarn lint
yarn lint:styles        # Stylelint
```

The backend suites run in parallel: before they start, each test worker gets its own copy of `library-test` (`library-test-1`, `library-test-2`…), so nothing else may be connected to `library-test` while they run (close pgAdmin's connection to it, for example). See each app's README for running a single suite or test.

## CI and deployment

- **GitHub Actions** (`.github/workflows/node.js.yml`) runs on every push and pull request to `main`. It builds the backend and runs its full test suite against PostgreSQL, lints (ESLint and Stylelint), tests and builds the frontend, then publishes the coverage badges above for both apps to the `badges` branch.
- **Deployment** is manual. On the server, run these from the repo root: `make dockerMigrate` applies database migrations, and `make dockerProd` pulls the latest code and rebuilds the stack in `.docker/docker-compose.yml` (API, PostgreSQL, nginx, pgAdmin). The production image reads its configuration from `backend/.env`.

## Project structure

```
Makefile                   dockerDev, dockerProd, dockerMigrate
.docker/                   compose files (dev and production), nginx, Prometheus, pgAdmin
backend/
  src/modules/<feature>/   commands, queries, domain, database, dtos; core: shared, auth, user; example: book, rental
  prisma/schema/           the Prisma schema, one file per module
  prisma/                  migrations, seed
  test/modules/<feature>/  each module's unit, integration and e2e specs, and its own builders
  test/util/, dataBuilders/  the test harness and the core builders
  .docker/                 the API's Dockerfiles and dev entrypoint
frontend/
  src/app/pages/           lazy-loaded routes; core: auth, home, users; example: books, rentals (with their models and services)
  src/app/services/        HTTP and auth services of the core
  src/app/shared/          guards, interceptors, i18n, shared components
```

## Starting a new project

Copy the repository, then rename it and remove the lending example. `shared`, `auth` and `user` are the core every project keeps; `book` (plain CRUD) and `rental` (writes that must be atomic) are the example, worth reading before you remove them.

### Rename

The project's name is in a few places:

- `.docker/docker-compose.yml` and `docker-compose-dev.yml`: the `name:` at the top, which names the containers, networks and volumes, and `POSTGRES_DB`. On a server that already runs the stack, changing `name:` or the `library-postgres` volume key starts with a new, empty database volume; the old one stays until you remove it.
- The database names in `backend/.env.example`, `backend/.env.test` and the CI workflow (`POSTGRES_DB: library-test`).
- `backend/src/app.info.ts`: the name in the logs and the Swagger title.
- The name users see: `app.name` in the frontend's `pt-BR.ts` and `en-US.ts`, the `<title>` in `src/index.html` and `public/manifest.webmanifest`.
- The repository URL in the badges at the top of this README.

### Remove the lending example

1. Delete the example's folders and files:
   ```bash
   git rm -r backend/src/modules/{book,rental} backend/test/modules/{book,rental} \
     backend/prisma/schema/{book,rental}.prisma backend/prisma/seed/book.seed.ts \
     frontend/src/app/pages/{books,rentals}
   ```
2. `git grep -n -i "lending example"` lists what's left in the core, each marked with a `Lending example` comment: the module registrations, events and test fakes, the test ids, the seed, the `User` relation in the schema, the menu, routes and their spec, the translations and the `user.hasActiveRentals` error. Delete each marked line or block. `RealUserRepository.deleteById` becomes a plain delete, as its comment says.
3. In `backend/`: `yarn migrate --name remove_lending_example` (drops the tables) and `yarn generate`. Then `yarn lint --fix`, `yarn test:cov`, and `yarn lint` and `yarn test` in `frontend/`. Both pass without the example, at full coverage.

Then add your own modules: [`CLAUDE.md`](CLAUDE.md) has an "Adding a feature" checklist.

For architecture details and conventions, see [`CLAUDE.md`](CLAUDE.md). Planned work is tracked in [`TODO.md`](TODO.md).

## Credits

The backend's architecture builds on two MIT-licensed projects:

- [Domain-Driven Hexagon](https://github.com/Sairyss/domain-driven-hexagon) by Sairyss: the hexagonal module layout, repository ports and paginated queries.
- [nest-clean-architecture](https://github.com/VincentJouanne/nest-clean-architecture) by Vincent Jouanne: the fp-ts approach to commands and queries, and the `perform`, `validateWith`, `handleLog` and `executeTask` helpers, adapted here to Zod and `ReaderTaskEither`.

## License

MIT
