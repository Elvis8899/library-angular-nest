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

- **Catalogue:** books (title, uploaded cover, price), each with any number of physical copies.
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

The dev stack runs the API and the frontend in watch mode behind nginx, together with PostgreSQL, the file storage (SeaweedFS, S3-compatible, for the books' covers), pgAdmin, Prometheus and Grafana:

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

Edits to the contracts, the dependencies or the schema don't reload by themselves: the page fails with "doesn't provide an export named …" (Vite's stale copy of the contracts) or the API answers 500 with "The column … does not exist" (a migration not applied). `make dockerDevRefresh` brings the running stack up to the code: it reinstalls the workspace (rebuilding the contracts), clears the frontend's `.angular/cache`, and restarts the API (generate, migrate, seed) and the Angular dev server. Hard-reload the page after it.

Grafana (`admin`/`admin`) opens with the Prometheus data source and two dashboards in `.docker/grafana/dashboards/`: **Library API** (requests, latency and errors by route, use cases by outcome, memory and event loop) and **Library server** (the site's probe and certificate, the deploys, disk, memory, CPU, the database, the file storage; both shade the spans a deploy ran). The alert rules (API, site or database down, certificate expiring, disk or memory running out, 5xx errors) are under Alerting; they aren't sent anywhere yet. Prometheus scrapes the API's metrics server on `app:9464` (`METRICS_PORT`), which nginx doesn't proxy.

### Option B: run the backend on the host

```bash
yarn install            # at the repository root, once: both apps and packages/contracts
cd backend
docker compose -f ../.docker/docker-compose-dev.yml up postgres -d
cp .env.example .env    # then set DATABASE_URL to localhost, see the comment in the file
yarn migrate            # apply migrations
npx prisma db seed      # demo users and books (runs automatically when migrate creates the database)
yarn start:dev          # http://localhost:3000, Swagger at /swagger
```

`JWT_SECRET_KEY` and `JWT_REFRESH_SECRET` are required, and each must be at least 32 characters. The values in `.env.example` are for local development only. Generate real ones with `openssl rand -base64 48`.

### Frontend

```bash
nvm use                 # Node 24
yarn install            # at the repository root, if not done yet
cd frontend
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

- **GitHub Actions** (`.github/workflows/node.js.yml`) runs on every push and pull request to `main`. It builds the backend and runs its full test suite against PostgreSQL and SeaweedFS, lints (ESLint and Stylelint), tests and builds the frontend, then publishes the coverage badges above for both apps to the `badges` branch.
- **Deployment** is manual, to one Linux server with Docker (a VPS such as an AWS Lightsail instance; 2 GB of RAM or more, since the images are built there). The stack in `.docker/docker-compose.yml` runs the API, PostgreSQL, the file storage (SeaweedFS; back its volume up with the database's, and a server set up before it needs `STORAGE_ACCESS_KEY` and `STORAGE_SECRET_KEY` in `.docker/.env`, `openssl rand -hex 32`), pgAdmin, Prometheus, Grafana, certbot and nginx, which serves the frontend build over HTTPS and proxies `/v1`, `/swagger`, `/pgadmin4` and `/grafana` to the rest. pgAdmin runs only on demand: `make pgadminUp` starts it, `make pgadminDown` stops it (deploys don't start it; stopped, `/pgadmin4/` answers 502), from your machine with `ssh <server> 'cd <repo> && make pgadminUp'`. Grafana (user `admin`, `.docker/.env`'s `GRAFANA_PASSWORD`; a server set up before it needs that added, `openssl rand -hex 16`) has the same dashboards and alert rules as the dev stack; Prometheus keeps 30 days (2 GB at most) and isn't reachable from outside. It probes the site through its public address, so it notices DNS, certificate and nginx problems, but not the whole server being down: that needs a monitor outside it. Only ports 80 and 443 need to be open.

### Deploying

First time, on a fresh Ubuntu server (on Lightsail: an Ubuntu 24.04 instance with a static IP, and ports 80 and 443 open in its Networking tab), with the domain's DNS pointing at it:

```bash
sudo apt-get install -y git make
ssh-keygen -t ed25519                   # for a private repository: add ~/.ssh/id_ed25519.pub as a read-only deploy key (Settings → Deploy keys)
git clone git@github.com:<owner>/<repository>.git && cd <repository>
make serverSetup                        # Docker, swap under 3 GB of RAM, the network, .docker/.env and .env with generated secrets
nano .docker/.env                       # set DOMAIN, CERTBOT_EMAIL and PGADMIN_EMAIL
make dockerCertificate                  # Let's Encrypt certificate (port 80 must be free)
make dockerDeploy                       # migrations, then the stack
```

After that, `make dockerDeploy` deploys the latest `main` (`dockerMigrate` and `dockerProd` do each half); certbot renews the certificate by itself. The images build in a BuildKit container of their own, `library-builder`, which the first build creates (`make dockerBuilder`) with an eighth of a container's CPU weight: a build uses the CPU the stack leaves idle and yields it as soon as the API, Postgres or nginx need it. The API's image compiles with SWC and the frontend's skips the template checks (`build:unchecked` in each app; CI's `yarn build` and typecheck run them before any deploy), so a build fits beside the running stack on a 2 GB server. After each deploy, the cache entries no build used for a week (old versions' layers) are removed, while those the latest build used stay for the next one; the builder is stopped between deploys.

To have CI deploy every push to `main` once its tests pass, install the deploy hook on the server: `make serverHook`. It runs `.docker/deployHook.py` as a service on the host (outside Docker, so a deploy restarting the stack doesn't stop it), reached through nginx at `https://<DOMAIN>/hooks/deploy`, and prints the two settings for GitHub (Settings → Secrets and variables → Actions): the secret `DEPLOY_TOKEN` (generated into `.docker/.env`; a server set up before the hook needs it added there, `openssl rand -hex 32`) and the variable `DEPLOY_URL` (`https://<DOMAIN>`). The `deploy` job then calls the hook with the tested commit; the hook runs `make dockerDeploy REF=<commit>` in the background, one at a time (a call during a deploy waits for it), logging to `.docker/deploy.log`, and the job ends once the hook has taken the commit, without waiting for the deploy: how the last one ended is at `https://<DOMAIN>/hooks/deploy/status` (with the `DEPLOY_TOKEN` as a Bearer token) and in that log, and Grafana's "Deploy failed" alert fires when it failed ("Deploy stuck" when one runs for over an hour), from the metrics the hook gives Prometheus. A hook installed before those metrics needs `sudo systemctl restart library-deploy-hook` to serve them. `make dockerDeploy` does nothing when that commit is already out (`.docker/.deployed`, written by the last finished deploy; `FORCE=1` deploys anyway). Without `DEPLOY_URL` the job is skipped. No port beyond 443 is involved, so SSH can stay limited to your IP. The job runs in the `production` environment, where you can require an approval before each deploy (Settings → Environments). The API's settings are in the repo root's `.env` (made from `backend/.env.example`), which Compose passes to the container when it starts, so no secret is built into an image; its `DATABASE_URL` is built from `.docker/.env` instead. PostgreSQL reads the credentials only when its volume is first created: on a server that already has the volume, change the password in the database too (`ALTER USER … PASSWORD …`). Postgres is pinned to 18, its volume on `/var/lib/postgresql`: a server whose volume an older major wrote needs a `pg_upgrade` (or a dump and restore) first.

## Project structure

```
Makefile                   serverSetup, dockerDev, dockerProd, dockerMigrate, dockerCertificate
.docker/                   compose files (dev and production), the production settings (.env.example), serverSetup.sh, the deploy hook, nginx, Prometheus, Grafana, pgAdmin
backend/
  src/modules/<feature>/   commands, queries, domain, database; core: shared, auth, user; example: book, rental
  prisma/schema/           the Prisma schema, one file per module
  prisma/                  migrations, seed
  test/modules/<feature>/  each module's unit, integration and e2e specs, and its own builders
  test/util/, dataBuilders/  the test harness and the core builders
  .docker/                 the API's Dockerfiles and dev entrypoint
packages/contracts/        what the API sends and receives (Zod schemas), and the values and rules both apps use
frontend/
  src/app/pages/           lazy-loaded routes; core: auth, home, users; example: books, rentals (with their models and services)
  src/app/services/        HTTP and auth services of the core
  src/app/shared/          guards, interceptors, i18n, shared components
  .docker/                 the production image (nginx with the build)
```

## Starting a new project

Copy the repository, then rename it and remove the lending example. `shared`, `auth`, `user` and `audit` are the core every project keeps; `book` (plain CRUD) and `rental` (writes that must be atomic) are the example, worth reading before you remove them.

### Rename

The project's name is in a few places:

- `.docker/docker-compose.yml` and `docker-compose-dev.yml`: the `name:` at the top, which names the containers, networks and volumes, and `POSTGRES_DB` in the dev file and in `.docker/.env.example`. On a server that already runs the stack, changing `name:` or the `library-postgres` volume key starts with a new, empty database volume; the old one stays until you remove it.
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
