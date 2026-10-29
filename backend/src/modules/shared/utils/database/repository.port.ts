import { O, TE } from "@shared/utils/application/monads";
import { PaginatedQueryParams } from "@shared/utils/domain/query.base";

/*  Most of repositories will probably need generic
    save/find/delete operations, so it's easier
    to have some shared interfaces.
    More specific queries should be defined
    in a respective repository.
*/

export interface Paginated<T> {
  count: number;
  limit: number;
  page: number;
  data: T[];
}

export interface RepositoryFindAllPort<Entity> {
  findAll(): TE.TaskEither<Error, Entity[]>;
}

export interface RepositoryFindByIdPort<Entity> {
  findById(id: string): TE.TaskEither<Error, O.Option<Entity>>;
}

export interface RepositoryFindAllPaginatedPort<Entity, Query = undefined> {
  findAllPaginated(
    params: PaginatedQueryParams<Query>,
  ): TE.TaskEither<Error, Paginated<Entity>>;
}

export interface RepositorySavePort<Entity> {
  save(entity: Partial<Entity>): TE.TaskEither<Error, void>;
}

export interface RepositoryDeleteByIdPort {
  deleteById(id: string): TE.TaskEither<Error, void>;
}

export interface RepositoryDefaultPort<Entity, Query = undefined>
  extends
    RepositoryFindAllPort<Entity>,
    RepositoryFindByIdPort<Entity>,
    RepositoryFindAllPaginatedPort<Entity, Query>,
    RepositorySavePort<Entity>,
    RepositoryDeleteByIdPort {}
