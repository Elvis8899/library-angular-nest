import { PasswordHash } from "@modules/user/domain/password";
import * as bcrypt from "bcrypt";

export const comparePassword = async (
  password: string,
  hash: string,
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const hashPassword = async (password: string): Promise<PasswordHash> =>
  PasswordHash.parse(await bcrypt.hash(password, 10));
