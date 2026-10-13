# TODO

Improvements found while reviewing the repository (2026-10-12), most important first.

## Code quality

- [ ] **Make `yarn lint:styles` pass, then run it in CI.** Its config works on Stylelint 17 and the auto-fixable problems are fixed, but 108 errors remain from the strict rules in `library-frontend/.stylelintrc`: `selector-no-qualifying-type` (43), `max-nesting-depth` (26), `selector-max-specificity` (24), `declaration-no-important` (9) and `selector-max-universal` (6), most of them in `sidebar.component.scss`. Either relax those rules or restructure the selectors.
