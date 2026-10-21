import { PasswordHash } from "@modules/user/domain/password";

/**
 * Hashes passwords and checks them against a stored hash. A port, so the
 * user module owns hashing and auth only depends on user, not the reverse.
 */
export abstract class PasswordHasher {
  abstract hash(password: string): Promise<PasswordHash>;
  abstract matches(password: string, hash: string): Promise<boolean>;
}
