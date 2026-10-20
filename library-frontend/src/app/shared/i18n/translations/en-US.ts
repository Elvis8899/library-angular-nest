import { Translations } from "@app/shared/i18n/translations/translationKey";

// Typed as pt-BR's shape, so a missing or extra key fails the build
export const enUS: Translations = {
  app: {
    name: "Library",
    home: "Home",
  },
  nav: {
    users: "Users",
    books: "Books",
    rentals: "Rentals",
    logout: "Logout",
    toggleMenu: "Toggle menu",
    openMenu: "Open menu",
    closeMenu: "Close menu",
  },
  theme: {
    dark: "Dark theme",
    light: "Light theme",
  },
  language: {
    label: "Language",
  },
  roles: {
    admin: "Admin",
    client: "Client",
  },
  common: {
    actions: "Actions",
    book: "Book",
    cancel: "Cancel",
    confirm: "Confirm",
    createdOn: "Created on",
    email: "Email",
    moreActions: "More actions",
    name: "Name",
    noResults: "No results",
    optional: "Optional",
    password: "Password",
    remove: "Remove",
    save: "Save",
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
    login: {
      title: "Login",
      subtitle: "Sign in with your email and password",
    },
    password: {
      show: "Show password",
      hide: "Hide password",
    },
  },
  books: {
    create: "Create Book",
    created: "Book created successfully",
    price: "Price",
    list: {
      title: "Books List",
      search: "Search by name",
      orderBy: "Order by",
      creationDate: "Creation date",
      sortOrder: "Sort order",
      ascending: "Ascending",
      descending: "Descending",
    },
    form: {
      subtitle: "Fill in the book's details",
      priceInvalid: "Enter a price of 0 or more",
      cover: "Cover image URL",
      coverInvalid: "Enter a URL starting with http:// or https://",
    },
    availability: {
      title: "Availability",
      none: "No copies",
      count: "{{available}} of {{total}} available",
      allRented: "All rented",
    },
    copies: {
      add: "Add a copy",
      added: "Copy added",
      remove: "Remove a copy",
      removeConfirm: "Remove a copy of {{book}}? Its past rentals go with it.",
      removed: "Copy removed",
      noneToRemove: "No books available to remove",
    },
  },
  rentals: {
    list: {
      title: "Rentals",
      subtitle: "Books not returned yet",
      rentedOn: "Rented on",
      dueOn: "Due on",
      overdue: "Overdue",
    },
    fine: {
      title: "Fine",
      details: "{{fixed}} + {{perDay}} per day × {{days}} days late",
    },
    rent: {
      title: "Rent book",
      action: "Rent",
      confirm: "Rent {{book}}?",
      chooseClient: "Choose the client renting {{book}}",
      client: "Client",
      noClients: "No clients found",
      noneAvailable: "No books available to rent",
      done: "Book rented successfully",
    },
    return: {
      title: "Return book",
      action: "Return",
      confirm: "Return {{book}}?",
      done: "Book returned successfully",
    },
  },
  users: {
    create: "Create User",
    created: "User created successfully",
    list: {
      title: "Users List",
      role: "Role",
    },
    form: {
      subtitle: "New users are clients",
      passwordHint: "At least 4 characters",
    },
    document: {
      label: "CPF or CNPJ",
      hint: "With or without punctuation",
      required: "CPF or CNPJ is required",
      invalid: "Invalid CPF or CNPJ",
    },
  },
  errors: {
    unknown: "Something went wrong. Please try again.",
    auth: {
      wrongCredentials: "The email or password is incorrect.",
      sessionExpired: "Your session expired. Please log in again.",
    },
    book: {
      notFound: "Book not found.",
      noAvailableCopy: "No copy of this book is available.",
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
