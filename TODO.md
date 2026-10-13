# TODO

Improvements found while reviewing the repository (2026-10-12), most important first.

## Code quality

- [ ] **Make the book list filters work.** The search box, date picker and sort controls update `PaginatedDataSource`, but `BookService.getPaginatedBooks` sends only `page`, `limit` and `sort`, and the backend ignores the rest: `RealBookInfoRepository.findAllPaginated` always passes an empty `where` and orders by `createdAt`. Send the query, validate it in the paginated query, and filter and sort in the repository.
- [ ] **Make `yarn lint:styles` pass, then run it in CI.** Its config works on Stylelint 17 and the auto-fixable problems are fixed, but 108 errors remain from the strict rules in `library-frontend/.stylelintrc`: `selector-no-qualifying-type` (43), `max-nesting-depth` (26), `selector-max-specificity` (24), `declaration-no-important` (9) and `selector-max-universal` (6), most of them in `sidebar.component.scss`. Either relax those rules or restructure the selectors.

## Tests

- [ ] **Add an e2e test that uses the real `AuthGuard`.** Every e2e test replaces it with `MockAuthGuardBuilder`, so no test sends a real signed JWT through the HTTP layer.
- [ ] **Cover `main.ts` and the Prisma seed and migration scripts.** They're never loaded by a test, so they're missing from the coverage report rather than counted as 0%.
