# TODO

Improvements found while reviewing the repository (2026-10-12), most important first.

Everything from that review is done (2026-10-13).

## Frontend UI with Angular Material (2026-10-20)

The theme, login, forms, dialogs and lists are rebuilt with Angular Material (branch `frontend-material-ui`). What's left, plus two API problems found on the way:

- [ ] **Layout**: the header repeats the app name the sidebar already shows; show something useful there instead (the page title or the user's name).
- [ ] **Responsive**: check every screen at phone width. The lists may need fewer columns or cards on small screens.
- [ ] **Translations**: the paginator's labels ("Items per page", "1 – 3 of 3") are still in English; give `MatPaginatorIntl` translated labels that follow the selected language.
- [ ] **API: search and role filter on `GET /v1/users`**. The choose-user dialog loads the largest page (1000 users) and searches it in the browser, so with more clients than that some can't be picked.
- [ ] **API: deleting a book erases its rentals**. `DELETE /v1/bookInfos/:id` has no checks, and the schema cascades from the book to its copies and from each copy to its rentals (`onDelete: Cascade`), so deleting a book with rented copies silently erases active rentals; removing a copy (`DELETE /v1/bookInfos/item/:id`, available copies only) erases that copy's past rentals. The book list has no delete button until the API refuses books with rented copies and keeps rental history (for example `onDelete: Restrict` or soft deletes).
