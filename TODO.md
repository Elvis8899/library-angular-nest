# TODO

Improvements found while reviewing the repository (2026-10-12), most important first.

Everything from that review is done (2026-10-13).

## Frontend UI with Angular Material (2026-10-20)

The theme, login, forms, dialogs and lists are rebuilt with Angular Material (branch `frontend-material-ui`), and work at phone width. Two API problems found on the way:

- [ ] **API: search and role filter on `GET /v1/users`**. The choose-user dialog loads the largest page (1000 users) and searches it in the browser, so with more clients than that some can't be picked.
- [ ] **API: deleting a book erases its rentals**. `DELETE /v1/bookInfos/:id` has no checks, and the schema cascades from the book to its copies and from each copy to its rentals (`onDelete: Cascade`), so deleting a book with rented copies silently erases active rentals; removing a copy (`DELETE /v1/bookInfos/item/:id`, available copies only) erases that copy's past rentals. The book list has no delete button until the API refuses books with rented copies and keeps rental history (for example `onDelete: Restrict` or soft deletes).

## Backend review (2026-10-20)

Found after the dependency updates on branch `update-backend-dependencies`, most important first. The book deletion problem above belongs here too.

Done (2026-10-21): primary keys, unique-constraint races and the unique CPF, case-insensitive emails, and the test cleanup (`createBook`, `it.each` tables for the 422 cases).

- [ ] **Close accounts instead of deleting users** (optional): deleting a user cascades away their finished rentals too, so the lending history is lost. A `closeAccount` with a status on `User` keeps it; lists, login and the email and CPF checks would ignore closed accounts, and closing would bump `tokenVersion`.

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
