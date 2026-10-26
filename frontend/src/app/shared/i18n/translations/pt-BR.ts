// The source of the translation keys, with pages.pt-BR.ts: TranslationKey is
// derived from both, and every other language must have the same keys. This
// half is in the bundle: what the login, the layout and the API's errors show.
// No imports, so the template check (translationKeys.spec.ts) can read it too.
export const ptBR = {
  app: {
    name: "Biblioteca",
    home: "Página Inicial",
  },
  nav: {
    users: "Usuários",
    audit: "Auditoria",
    groups: {
      admin: "Administração",
    },
    // Lending example
    books: "Livros",
    rentals: "Empréstimos",
    logout: "Sair",
    toggleMenu: "Mostrar ou esconder o menu",
    openMenu: "Abrir menu",
    closeMenu: "Fechar menu",
  },
  theme: {
    label: "Tema",
    auto: "Automático",
    light: "Claro",
    dark: "Escuro",
  },
  language: {
    label: "Idioma",
  },
  roles: {
    admin: "Administrador",
    client: "Cliente",
  },
  common: {
    cancel: "Cancelar",
    close: "Fechar",
    confirm: "Confirmar",
    createdOn: "Criado em",
    email: "Email",
    name: "Nome",
    noResults: "Nenhum resultado",
    password: "Senha",
    save: "Salvar",
    moreActions: "Mais ações",
    // Lending example: only its pages use these
    actions: "Ações",
    book: "Livro",
    remove: "Remover",
  },
  validation: {
    email: {
      required: "Informe o email",
      invalid: "Informe um email válido",
    },
    name: {
      required: "Informe o nome",
    },
    password: {
      required: "Informe a senha",
    },
  },
  auth: {
    logout: {
      inProgress: "Saindo…",
    },
    login: {
      title: "Login",
      subtitle: "Entre com seu email e senha",
    },
    password: {
      show: "Mostrar senha",
      hide: "Esconder senha",
    },
  },
  // The API's error codes (the contracts' errorCodes);
  // the error interceptor shows these instead of the API's message
  errors: {
    unknown: "Algo deu errado. Tente novamente.",
    auth: {
      wrongCredentials: "O email e/ou senha estão incorretos.",
      sessionExpired: "Sessão expirada. Faça login novamente.",
    },
    // Lending example
    book: {
      notFound: "Livro não encontrado.",
      noAvailableCopy: "Nenhum exemplar livre deste livro.",
      copyNotFound: "Exemplar não encontrado.",
      coverNotFound: "Livro sem capa.",
      coverType: "A capa deve ser uma imagem JPG, PNG, WEBP ou GIF.",
      coverTooLarge: "A capa deve ter até 5 MB.",
      coverChanged:
        "A capa do livro mudou enquanto esta era enviada; recarregue e tente de novo.",
    },
    rental: {
      notFound: "Empréstimo não encontrado.",
      finished: "Este empréstimo já foi finalizado.",
      unavailable: "Livro indisponível.",
    },
    user: {
      notFound: "Usuário não encontrado.",
      cpfTaken: "O CPF informado já está sendo usado por outro usuário.",
      emailTaken: "O email informado já está sendo usado por outro usuário.",
      // Lending example
      hasActiveRentals:
        "O usuário tem empréstimos em andamento. Finalize-os antes de excluí-lo.",
    },
  },
  update: {
    available: "Uma nova versão está disponível.",
    reload: "Atualizar",
  },
  paginator: {
    itemsPerPage: "Itens por página",
    nextPage: "Próxima página",
    previousPage: "Página anterior",
    firstPage: "Primeira página",
    lastPage: "Última página",
    empty: "0 de {{length}}",
    range: "{{start}} – {{end}} de {{length}}",
  },
};
