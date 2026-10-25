import { PagesTranslations } from "@app/shared/i18n/translations/translationKey";

// Typed as pt-BR's shape, so a missing or extra key fails the build
export const enUSPages: PagesTranslations = {
  home: {
    welcome: "Hello, {{name}}.",
  },
  // Lending example
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
  // Lending example
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
};
