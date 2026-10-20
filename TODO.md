# TODO

Improvements found while reviewing the repository (2026-10-12), most important first.

Everything from that review is done (2026-10-13).

## Frontend UI with Angular Material (2026-10-20)

The screens barely use Angular Material, which is already installed and themed with `mat.theme()` in `styles.scss`. They use plain `<button>`s and `<input>`s with about 570 lines of hand-written component SCSS, and some text is hardcoded in Portuguese or English. Rebuild them with Material components and improve how they look at the same time. Estimate: 2 to 3 days.

- [x] **Theme and shared pieces** (first, since the screens build on them)
  - [x] Choose a palette for `mat.theme()` based on the existing teal (`--light-teal`, `--dark-teal`) and drop the leftover ngx-rocket colour variables in `theme/_variables.scss` that the new theme replaces. Components use Material's system tokens (`--mat-sys-*`) instead of custom colours.
    - Done 2026-10-20: teal primary and orange tertiary generated into `theme/_themeColors.scss`, with high-contrast overrides. The page stylesheets only had their colours swapped for tokens; they're replaced when each screen is rebuilt.
  - [x] Dark mode: `color-scheme: light dark` in the theme, plus a toggle in the header next to the language selector, remembered in localStorage.
  - [x] Typography and spacing: Manrope through `mat.theme()` typography, a small spacing scale (4/8/16/24/32), and the same page padding on every screen.
  - [x] A page header component (title, optional subtitle, action buttons on the right) used by every page.
    - Done 2026-10-20: `app-page-header`, used by the three lists. Put a conditional action inside `<ng-container pageActions>`: an `@if` block isn't projected into the slot by itself.
  - [x] A form-card layout (a centred `mat-card` with a title, fields, and Cancel and Save buttons) for the add-book and add-user forms.
    - Done 2026-10-20: `app-form-card`; the forms start using it in their own item below.
  - [x] `customizedTable`: an empty state ("Nenhum resultado"), a progress bar instead of the spinner that pushes the table down, row hover, and a sticky header.
  - [x] A confirmation dialog based on `TypedDialog` for destructive actions (removing a book copy, returning a book).
    - Done 2026-10-20: `ConfirmDialog.confirm(data)` emits true only on confirm. Wired into the book and rental lists in their own items below.
- [x] **Login**: a `mat-card` with `mat-form-field`s, `mat-error` messages, a password visibility toggle, and a spinner on the button while logging in. Use the app name or logo above the card.
  - Done 2026-10-20, plus the theme toggle next to the language selector (now a shared `app-theme-toggle`). The password no longer needs 4 characters: the API only requires one. Inside a `mat-form-field`, use one `mat-error` and pick its message inside it, since an `@if` chain isn't projected into the error slot.
- [ ] **Book list**
  - [ ] Actions become icon buttons with tooltips (rent, add copy, remove copy). Remove the permanently disabled "deletar" button, or implement deleting.
  - [ ] Availability shown as a chip (green when copies are available, grey when none are), and the cover as a fixed-size rounded thumbnail with a placeholder when the image fails to load.
  - [ ] Price through the `currency` pipe (`BRL`), not the raw number.
  - [ ] The search, date and sort toolbar wraps on narrow screens.
- [ ] **Add book and add user**: on the form card, with `mat-form-field`, `mat-error`, a hint for the CPF format, and a Cancel button that goes back to the list. Delete the custom SCSS they no longer need.
- [ ] **Rental list**: dates through the `date` pipe instead of `getDateOnly`, overdue rentals and fines highlighted (chip or warning colour), and an icon button with confirmation for returning a book.
- [ ] **User list**: role shown as a chip, and the same column and button style as the other lists.
- [ ] **Choose-user dialog**: `mat-dialog-title`, `mat-dialog-content` and `mat-dialog-actions`, with a search field if the user list is long.
- [ ] **Layout**: the sidebar shows the active route (`routerLinkActive`), and the sidebar and header use the theme colours.
- [ ] **Responsive**: check every screen at phone width. The lists may need fewer columns or cards on small screens.
- [ ] **Translations**: every hardcoded string (table headers, form errors, buttons such as "emprestar" and "Devolver") goes through `translate`, with entries in both `pt-BR.ts` and `en-US.ts`.
- [ ] **Tests and checks**: update the spec selectors that rely on plain elements (`button[name='rentBook']`, plain inputs) and keep coverage at 80% or more. `yarn lint`, `yarn lint:styles`, `yarn test` and `yarn build` pass after each screen.
