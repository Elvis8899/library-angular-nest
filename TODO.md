# TODO

Improvements found while reviewing the repository (2026-10-12), most important first.

Everything from that review is done (2026-10-13).

## Frontend UI with Angular Material (2026-10-20)

The theme, login, forms, dialogs and lists are rebuilt with Angular Material (branch `frontend-material-ui`), and work at phone width. Two API problems found on the way:

- [ ] **API: search and role filter on `GET /v1/users`**. The choose-user dialog loads the largest page (1000 users) and searches it in the browser, so with more clients than that some can't be picked.
- [ ] **API: deleting a book erases its rentals**. `DELETE /v1/bookInfos/:id` has no checks, and the schema cascades from the book to its copies and from each copy to its rentals (`onDelete: Cascade`), so deleting a book with rented copies silently erases active rentals; removing a copy (`DELETE /v1/bookInfos/item/:id`, available copies only) erases that copy's past rentals. The book list has no delete button until the API refuses books with rented copies and keeps rental history (for example `onDelete: Restrict` or soft deletes).

## Backend review (2026-10-20)

Found after the dependency updates on branch `update-backend-dependencies`, most important first. The book deletion problem above belongs here too.

- [n] **Primary keys**: `User`, `BookInfo`, `BookItem` and `BookRentalDetails` declare `id String @unique` instead of `@id`, so their tables have no primary key (only `RefreshSession` has one). Postgres allows it, but replication and most tooling expect a primary key. A migration can promote each unique index to the primary key without touching data.
- [n] **Unique-constraint races answer 500**: two simultaneous sign-ups with the same email both pass the command's "email taken" check, and the second fails on the `@unique` constraint with Prisma's P2002, which `unknownException` turns into a 500 instead of the 409 `user.emailTaken`. Map P2002 to the matching conflict error in the repositories. CPF has no constraint at all, so the same race creates two clients with one CPF: add a partial unique index (clients with a non-empty CPF) in a migration.
- [n] **Case-sensitive emails**: `findByEmail` and the unique constraint treat `Ana@x.com` and `ana@x.com` as two users, and logins must match the case used at sign-up (`loginThrottler.guard.ts` already lowercases for its rate-limit key). Lowercase in the domain schema (`z.email().transform(...)`), and in a migration for existing rows, after checking no two of them differ only by case.
- [ ] **Close accounts instead of deleting users** (optional): deleting a user cascades away their finished rentals too, so the lending history is lost. A `closeAccount` with a status on `User` keeps it; lists, login and the email and CPF checks would ignore closed accounts, and closing would bump `tokenVersion`.
- [n] **Lint `prisma/`**: `yarn lint` covers `src` and `test` only, so `prisma/seed.ts` is unchecked (it has `console` calls `no-console` would reject). Add `prisma` to the glob, with a `no-console` exception for the seed.
- [n] **Rename `shared.erros.ts`** to `shared.errors.ts`. The frontend's `translationKeys.spec.ts` then also reads its `unknown` code, which already has a translation.
- [n] **Tests**: write the "422 for an invalid X" cases that differ only in input as `it.each` tables, and add a `createBook(prisma, …)` helper next to `createRental` for the books with copies several specs build by hand.

## Branch `update-backend-dependencies` (2026-10-20)

- [ ] **Push it** and open a pull request: NestJS 12, Prisma 7, the advisory fixes, the user deletion guard and the refactors.
- [ ] **Run `yarn test:docker:up` once** in `library-backend`. Prisma 7 refuses `migrate reset` when an AI agent runs it, so it wasn't tested after the update.
- [ ] **After pulling**, run `yarn generate` in `library-backend`: Prisma 7 no longer generates the client on install, and `prisma/generated/` isn't committed.

## Demo on GitHub Pages (2026-10-20)

A demo of the frontend on GitHub Pages, with no backend: a fake backend inside the app answers the API calls. The frontend never reads the tokens, so fake ones work. Estimate: about a day.

- [ ] **Fake backend**: an HTTP interceptor, only in a `demo` build configuration (`fileReplacements` swaps one providers file, so none of it reaches the production bundle), answers every `/v1/*` call the services make (about 20: login, logout, refresh, books, copies, users, rentals, rent, return).
  - In-memory data seeded with books, clients and rentals, one of them overdue; saved in localStorage so it survives a reload, with a "reset demo" link.
  - Follows the API's rules the screens show: roles, clients seeing and returning only their own rentals, the CPF/CNPJ check, paging, sorting and the name and date filters, and fines (fixed amount plus 5% of the price per day late, as `getRentalFines` in `rental/domain/bookRental.entity.ts`).
  - Its own specs, so drift from the real API shows up when the rules change.
- [ ] **Demo UI**: a banner on the login page with an admin and a client account, ideally with one-click login for each.
- [ ] **GitHub Pages fixes**:
  - The app is served from `/library-angular-nest/`: build with `--base-href /library-angular-nest/`, and make the Manrope `url("/fonts/…")` links in `theme/_base.scss` relative.
  - Pages has no fallback for app routes, so opening `/books/list` directly gives a 404: copy `index.html` to `404.html` in the build.
  - Turn the service worker off in the demo build, so visitors don't keep an old version after a deploy.
  - Pages needs a public repository, or a paid plan for a private one.
- [ ] **Deploy workflow**: a GitHub Actions job that builds the demo on pushes to `main` and publishes it with `actions/upload-pages-artifact` and `actions/deploy-pages`; link the demo from the README.
