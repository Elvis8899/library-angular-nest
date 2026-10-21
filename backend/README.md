# Library Backend

REST API for the [Library](../README.md) project: NestJS 12 on Fastify, Prisma + PostgreSQL, Zod validation and fp-ts pipelines. API documentation is served by Swagger at `/swagger`.

See the [root README](../README.md) for setup, demo accounts and the Docker dev stack.

## Scripts

| Command | Description |
|---|---|
| `yarn start:dev` | Watch mode on port 3000 |
| `yarn build` | Compile to `dist/` (entry point: `dist/src/main.js`) |
| `yarn lint` | ESLint |
| `yarn migrate` | Create and apply a migration (`prisma migrate dev`) |
| `npx prisma db seed` | Seed demo users and books |
| `make dockerDev` | Start the full dev stack with Docker Compose (run it from the repo root) |

## Configuration

The app reads `.env` (`.env.dev` in the Docker dev stack, `.env.test` for tests). See `.env.example` for all variables.

`JWT_SECRET_KEY` and `JWT_REFRESH_SECRET` are required and must be at least 32 characters long. The app refuses to start without them.

## Tests

Tests run against a real PostgreSQL database (`library-test`):

```bash
docker compose -f ../.docker/docker-compose-dev.yml up postgres -d
yarn test:migrate
```

| Command | Runs |
|---|---|
| `yarn test:unit` | `*.unit-spec.ts`: command and query handlers with in-memory repositories |
| `yarn test:inte` | `*.inte-spec.ts`: Prisma repositories against PostgreSQL |
| `yarn test:e2e` | `*.e2e-spec.ts`: HTTP endpoints with supertest |
| `yarn test:cov` | All of the above. Fails below 100% coverage. This is what CI runs. |

The suites run in parallel, on half the CPUs. Before they start, `test/globalSetup.ts` copies `library-test` to one database per Jest worker (`library-test-1`, `library-test-2`…), so `library-test` itself must be migrated and have no other connections. The copies are made again on every run.

To run a single file or test, use the base Jest config. The suite configs enforce coverage thresholds, which fail on partial runs:

```bash
npx env-cmd -f .env.test jest --config ./test/jest.config.ts test/modules/user/document.unit-spec.ts
npx env-cmd -f .env.test jest --config ./test/jest.config.ts -t "test name" <file>
```

## Code organisation

Each feature in `src/modules/` (the core `auth` and `user`, and the lending example `book` and `rental`) is split into `commands/` (writes), `queries/` (reads), `domain/` (Zod entities, errors, events), `database/` (repository port with Prisma and in-memory implementations) and `dtos/`. Imports use path aliases (`@modules/user/`, `@shared/`, …); relative imports are rejected by lint. See [`CLAUDE.md`](../CLAUDE.md) for details.
