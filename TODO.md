# TODO

Improvements found while reviewing the repository (2026-10-12), most important first.

## Bugs and security

- [ ] **Stop publishing Postgres and pgAdmin in production.** `.docker/docker-compose.yml` publishes `5432` (with the default `user`/`password` credentials) and `5050` on all interfaces. nginx reaches pgAdmin through the gateway, so bind it to `172.18.0.1` like the API, and drop or restrict the Postgres port.

## Runtime and infrastructure

- [ ] **Move the backend to Node 24.** Node 20 reached end of life in April 2026. Update `.docker/Dockerfile`, `.docker/Dockerfile.dev` and the CI matrix (`node-version: [20.x]`). The frontend already requires Node 24.
- [ ] **Stop the dev container from creating root-owned files in `library-backend/node_modules`.** It mounts the source folder (`../:/usr/src/app`) and runs yarn as root, which breaks later host-side `yarn add` with EACCES. Run it as the host user or give `node_modules` its own volume.
- [ ] **Run the frontend in CI.** `.github/workflows/node.js.yml` only covers the backend. Add `yarn lint`, `yarn test` and `yarn build` for `library-frontend` on Node 24.
- [ ] **Make `yarn test:docker:up` non-interactive.** `prisma migrate reset` waits for confirmation. Use `--force` (it only targets the test database) or call `test:migrate` instead.
- [ ] **Decide whether Swagger (`/swagger`) should be public in production.**

## Code quality

- [ ] **Move frontend components to OnPush.** The Angular 22 migration marked 13 components `ChangeDetectionStrategy.Eager` to keep the old behaviour, and the `prefer-on-push-component-change-detection` lint rule is turned off for now (`library-frontend/eslint.config.mjs`). Convert them one at a time, which may need signals or `markForCheck`, then turn the rule back on.
- [ ] **Remove the unused `skip` value in the paginated repository queries.** All three real repositories compute `skip` with `TE.let` but pass `offset`, which already equals `page * limit`.
- [ ] **Align `@ngneat/overview` with `@ngxpert/hot-toast`.** hot-toast 6.1 needs overview `>= 7`, but 6.0.0 is installed (a peer dependency warning).
- [ ] **Clear out commented-out code**, such as the CEP and phone value objects in `document.ts`, the multipart and CSP blocks in `main.ts`, and the commented providers in the modules.
- [ ] **Run Stylelint.** `.stylelintrc` is configured but no script or CI step runs it. Add `"lint:styles": "stylelint \"src/**/*.scss\""` and fix what it reports.
- [ ] **Translate toast messages.** They're hard-coded English strings (for example `"Book created successfully"`) instead of going through ngx-translate.

## Tests

- [ ] **Add an e2e test that uses the real `AuthGuard`.** Every e2e test replaces it with `MockAuthGuardBuilder`, so no test sends a real signed JWT through the HTTP layer.
- [ ] **Cover `main.ts` and the Prisma seed and migration scripts.** They're never loaded by a test, so they're missing from the coverage report rather than counted as 0%.
- [ ] **Raise frontend coverage back above 90%.** It's at about 89.9% after the Angular 22 migration; the threshold is 80%.
