import { PasswordHash } from "@modules/user/domain/password";
import { PasswordHasher } from "@modules/user/domain/passwordHasher.port";
import { Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

@Injectable()
export class BcryptPasswordHasher extends PasswordHasher {
  async hash(password: string): Promise<PasswordHash> {
    return PasswordHash.parse(await bcrypt.hash(password, SALT_ROUNDS));
  }

  matches(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Raising SALT_ROUNDS strengthens each password at its next login
  needsRehash(hash: string): boolean {
    return bcrypt.getRounds(hash) < SALT_ROUNDS;
  }
}
