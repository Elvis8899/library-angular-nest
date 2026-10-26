import { CoreTranslations } from "@app/shared/i18n/translations/translationKey";

// Typed as pt-BR's shape, so a missing or extra key fails the build
export const enUS: CoreTranslations = {
  app: {
    name: "Library",
    home: "Home",
  },
  nav: {
    users: "Users",
    audit: "Audit",
    groups: {
      admin: "Administration",
    },
    // Lending example
    books: "Books",
    rentals: "Rentals",
    logout: "Logout",
    toggleMenu: "Toggle menu",
    openMenu: "Open menu",
    closeMenu: "Close menu",
  },
  theme: {
    label: "Theme",
    auto: "Automatic",
    light: "Light",
    dark: "Dark",
  },
  language: {
    label: "Language",
  },
  roles: {
    admin: "Admin",
    client: "Client",
  },
  unsavedChanges: {
    title: "Discard changes?",
    message: "There are unsaved changes. Discard them and leave?",
    confirm: "Discard",
  },
  common: {
    cancel: "Cancel",
    close: "Close",
    confirm: "Confirm",
    createdOn: "Created on",
    email: "Email",
    name: "Name",
    noResults: "No results",
    password: "Password",
    save: "Save",
    moreActions: "More actions",
    // Lending example: only its pages use these
    actions: "Actions",
    book: "Book",
    remove: "Remove",
  },
  validation: {
    email: {
      required: "Email is required",
      invalid: "Enter a valid email",
    },
    name: {
      required: "Name is required",
    },
    password: {
      required: "Password is required",
    },
  },
  auth: {
    logout: {
      inProgress: "Logging out…",
    },
    login: {
      title: "Login",
      subtitle: "Sign in with your email and password",
    },
    password: {
      show: "Show password",
      hide: "Hide password",
    },
  },
  errors: {
    unknown: "Something went wrong. Please try again.",
    auth: {
      wrongCredentials: "The email or password is incorrect.",
      sessionExpired: "Your session expired. Please log in again.",
    },
    // Lending example
    book: {
      notFound: "Book not found.",
      noAvailableCopy: "No copy of this book is available.",
      copyNotFound: "Copy not found.",
      coverNotFound: "The book has no cover.",
      coverType: "The cover must be a JPG, PNG, WEBP or GIF image.",
      coverTooLarge: "The cover must be up to 5 MB.",
      coverChanged:
        "The book's cover changed while this one was sent; reload and try again.",
    },
    rental: {
      notFound: "Rental not found.",
      finished: "This rental has already ended.",
      unavailable: "Book unavailable.",
    },
    user: {
      notFound: "User not found.",
      cpfTaken: "This CPF is already used by another user.",
      emailTaken: "This email is already used by another user.",
      // Lending example
      hasActiveRentals:
        "This user has rentals in progress. Finish them before deleting the user.",
    },
  },
  update: {
    available: "A new version is available.",
    reload: "Reload",
  },
  paginator: {
    itemsPerPage: "Items per page",
    nextPage: "Next page",
    previousPage: "Previous page",
    firstPage: "First page",
    lastPage: "Last page",
    empty: "0 of {{length}}",
    range: "{{start}} – {{end}} of {{length}}",
  },
};
