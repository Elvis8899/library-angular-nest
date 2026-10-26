import { TokenRevocationRepository } from "@modules/auth/database/tokenRevocation.repository.port";
import { TokenRevocation } from "@modules/auth/domain/tokenRevocation.entity";
import { Injectable } from "@nestjs/common";
import { O, TE } from "@shared/utils/application/monads";

/**
 * The revocations in memory. FakeUserRepository writes them through
 * `revoke`, as RealUserRepository's transaction writes the table.
 */
@Injectable()
export class FakeTokenRevocationRepository implements TokenRevocationRepository {
  private readonly rows = new Map<string, TokenRevocation>();

  findByUserId = (
    userId: string,
  ): TE.TaskEither<Error, O.Option<TokenRevocation>> =>
    TE.of(O.fromNullable(this.rows.get(userId)));

  /** The user's latest revocation replaces the earlier one, and the expired
   * ones go. */
  revoke = (revocation: TokenRevocation, at: Date): void => {
    for (const [userId, { expiresAt }] of this.rows)
      if (expiresAt < at) this.rows.delete(userId);
    this.rows.set(revocation.userId, revocation);
  };

  /** A user's deletion cascades to its revocation. */
  removeUser = (userId: string): void => {
    this.rows.delete(userId);
  };
}
