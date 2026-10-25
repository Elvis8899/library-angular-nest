// The pages' texts, loaded with the layout (I18nService.loadPages); the
// login, the layout and the API's errors use pt-BR.ts, in the bundle. No
// imports, so the template check (translationKeys.spec.ts) can read it too.
export const ptBRPages = {
  audit: {
    title: "Auditoria",
    help: "Quem alterou o quê: uma linha por operação que deu certo, da mais recente. A operação é o nome técnico do que foi feito; o detalhe mostra o que ela recebeu (nunca senhas).",
    person: "Pessoa",
    anyone: "Qualquer uma",
    noAccount: "Sem conta",
    useCase: "Operação",
    useCaseExample: "ex: User, Login",
    recordId: "Registro",
    from: "De",
    to: "Até",
    search: "Filtrar",
    clear: "Limpar",
    periodInverted: "O início do período não pode ser depois do fim.",
    when: "Quando",
    input: "Detalhe",
    showInput: "Ver",
  },
  home: {
    welcome: "Olá, {{name}}.",
  },
  // Lending example
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
      pickCover: "Escolher capa",
      coverHint: "A capa é opcional: JPG, PNG, WEBP ou GIF, até 5 MB.",
      coverType: "A capa deve ser uma imagem JPG, PNG, WEBP ou GIF.",
      coverTooLarge: "A capa deve ter até 5 MB.",
      coverNotSaved:
        "O livro foi criado, mas a capa não foi enviada; troque-a na lista.",
    },
    availability: {
      title: "Disponibilidade",
      none: "Sem exemplares",
      count: "{{available}} de {{total}} disponíveis",
      allRented: "Todos emprestados",
    },
    cover: {
      title: "Capa",
      change: "Trocar capa",
      changed: "Capa trocada",
      remove: "Tirar capa",
      removeConfirm: "Tirar a capa de {{book}}?",
      removed: "Capa removida",
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
  // Lending example
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
};
