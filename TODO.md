# TODO

## Domain model review (2026-10-21)

The ports, CQRS and atomic repository operations are sound; the entities are only Zod shapes, and the rules live in handlers, repositories and the Prisma schema. Most important first; 2–4 are best done together on the rental module, as the pattern new modules copy.

- [ ] **No hidden clocks**: `overdueDate`'s Zod default and `getRentalFines` call `new Date()` themselves. Pass `now` in from an injected clock (like `RealUUIDGeneratorService`), and name the loan period (7 days) and the fines (20 fixed plus 5% of the price per day) as policy constants.

## User and auth domain review (2026-10-21)

Most important first.

- [ ] **Smaller fixes**:
  - The "a client must have a CPF" refine says "CPF ou CNPJ inválido"; give it its own message, and probably its own error code.
  - The `cpf` field holds a CPF or a CNPJ (`DocumentType`); the domain's word is "document".
  - CPF and email uniqueness is checked by the `ensureAbsentRTE` lookups and again by the unique index (`mapUniqueViolations` in `save`); the index is what holds under concurrent requests, so the lookups could go, though they do fail before bcrypt runs.
  - `findByCPF` searches only clients, but the unique index on `cpf` covers admins too, so an admin's CPF that matches a client's still ends as a 409 through the index.

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
