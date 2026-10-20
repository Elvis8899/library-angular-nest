// The source of the translation keys: TranslationKey is derived from this
// object, and every other language must have the same keys. No imports, so
// the template check (translationKeys.spec.ts) can read it too.
export const ptBR = {
  app: {
    name: "Biblioteca",
    home: "Página Inicial",
  },
  nav: {
    users: "Usuários",
    books: "Livros",
    rentals: "Empréstimos",
    logout: "Sair",
    toggleMenu: "Mostrar ou esconder o menu",
    openMenu: "Abrir menu",
    closeMenu: "Fechar menu",
  },
  theme: {
    dark: "Tema escuro",
    light: "Tema claro",
  },
  language: {
    label: "Idioma",
  },
  roles: {
    admin: "Administrador",
    client: "Cliente",
  },
  common: {
    actions: "Ações",
    book: "Livro",
    cancel: "Cancelar",
    confirm: "Confirmar",
    createdOn: "Criado em",
    email: "Email",
    moreActions: "Mais ações",
    name: "Nome",
    noResults: "Nenhum resultado",
    optional: "Opcional",
    password: "Senha",
    remove: "Remover",
    save: "Salvar",
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
  books: {
    create: "Criar Livro",
    created: "Livro criado com sucesso",
    price: "Preço",
    list: {
      title: "Lista de Livros",
      search: "Buscar pelo nome",
      orderBy: "Ordenar por",
      creationDate: "Data de criação",
      sortOrder: "Ordem",
      ascending: "Crescente",
      descending: "Decrescente",
    },
    form: {
      subtitle: "Preencha os dados do livro",
      priceInvalid: "Informe um preço de 0 ou mais",
      cover: "URL da imagem da capa",
      coverInvalid: "Informe uma URL que comece com http:// ou https://",
    },
    availability: {
      title: "Disponibilidade",
      none: "Sem exemplares",
      count: "{{available}} de {{total}} disponíveis",
      allRented: "Todos emprestados",
    },
    copies: {
      add: "Adicionar um exemplar",
      added: "Exemplar adicionado",
      remove: "Remover um exemplar",
      removeConfirm:
        "Remover um exemplar de {{book}}? Os empréstimos anteriores dele também são apagados.",
      removed: "Exemplar removido",
      noneToRemove: "Sem livros disponíveis para remoção",
    },
  },
  rentals: {
    list: {
      title: "Empréstimos",
      subtitle: "Livros ainda não devolvidos",
      rentedOn: "Emprestado em",
      dueOn: "Devolver até",
      overdue: "Atrasado",
    },
    fine: {
      title: "Multa",
      details: "{{fixed}} + {{perDay}} por dia × {{days}} dias de atraso",
    },
    rent: {
      title: "Emprestar livro",
      action: "Emprestar",
      confirm: "Emprestar {{book}}?",
      chooseClient: "Escolha o cliente que vai pegar {{book}}",
      client: "Cliente",
      noClients: "Nenhum cliente encontrado",
      noneAvailable: "Sem livros disponíveis para locação",
      done: "Livro alugado com sucesso",
    },
    return: {
      title: "Devolver livro",
      action: "Devolver",
      confirm: "Devolver {{book}}?",
      done: "Livro devolvido com sucesso",
    },
  },
  users: {
    create: "Criar Usuário",
    created: "Usuário criado com sucesso",
    list: {
      title: "Lista de Usuários",
      role: "Perfil",
    },
    form: {
      subtitle: "Novos usuários são clientes",
      passwordHint: "Pelo menos 4 caracteres",
    },
    document: {
      label: "CPF ou CNPJ",
      hint: "Com ou sem pontuação",
      required: "Informe o CPF ou CNPJ",
      invalid: "CPF ou CNPJ inválido",
    },
  },
  // The API's error codes (errorBody in library-backend's shared.erros.ts);
  // the error interceptor shows these instead of the API's message
  errors: {
    unknown: "Algo deu errado. Tente novamente.",
    auth: {
      wrongCredentials: "O email e/ou senha estão incorretos.",
      sessionExpired: "Sessão expirada. Faça login novamente.",
    },
    book: {
      notFound: "Livro não encontrado.",
      noAvailableCopy: "Nenhum exemplar livre deste livro.",
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
