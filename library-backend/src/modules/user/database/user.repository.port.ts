import { Paginated, RepositoryDefaultPort } from "@shared/ddd";
import { PaginatedQueryParams } from "@shared/ddd/query.base";
import { O, TE } from "@shared/functional/monads";
import { User } from "@user/domain/user.entity";

export abstract class UserRepository implements RepositoryDefaultPort<User> {
  findById!: (id: string) => TE.TaskEither<Error, O.Option<User>>;
  findByEmail!: (cpf: string) => TE.TaskEither<Error, O.Option<User>>;
  findByCPF!: (cpf: string) => TE.TaskEither<Error, O.Option<User>>;
  findAll!: () => TE.TaskEither<Error, User[]>;
  findAllPaginated!: (
    params: PaginatedQueryParams,
  ) => TE.TaskEither<Error, Paginated<User>>;
  deleteById!: (id: string) => TE.TaskEither<Error, void>;
  save!: (user: User) => TE.TaskEither<Error, void>;
}
