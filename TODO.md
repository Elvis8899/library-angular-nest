# TODO

Improvements found while reviewing the repository (2026-10-12), most important first.

## Code quality

- [ ] **Run Stylelint.** `.stylelintrc` is configured but no script or CI step runs it. Add `"lint:styles": "stylelint \"src/**/*.scss\""` and fix what it reports.

## Tests

- [ ] **Add an e2e test that uses the real `AuthGuard`.** Every e2e test replaces it with `MockAuthGuardBuilder`, so no test sends a real signed JWT through the HTTP layer.
- [ ] **Cover `main.ts` and the Prisma seed and migration scripts.** They're never loaded by a test, so they're missing from the coverage report rather than counted as 0%.
- [ ] **Raise frontend coverage back above 90%.** It's at about 89.9% after the Angular 22 migration; the threshold is 80%.
