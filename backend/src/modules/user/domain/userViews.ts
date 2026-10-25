import { User } from "@modules/user/domain/user.entity";

/** A user as the API answers it: never the password or the token version. */
export const toUserResponse = ({
  password: _password,
  tokenVersion: _tokenVersion,
  ...user
}: User) => user;
