import { Abstract, Type } from "@nestjs/common";
import { TestingModule } from "@nestjs/testing";

/** Gets a provider, typed from its class token. */
export type TypedGet = <T>(token: Type<T> | Abstract<T>) => T;

/**
 * Nest's get types abstract-class tokens, such as the repository ports, as
 * any, so specs had to repeat the type: get<UserRepository>(UserRepository).
 * This infers it from any class token: get(UserRepository).
 */
export const typedGet =
  (module: TestingModule): TypedGet =>
  <T>(token: Type<T> | Abstract<T>): T =>
    module.get<T>(token);
