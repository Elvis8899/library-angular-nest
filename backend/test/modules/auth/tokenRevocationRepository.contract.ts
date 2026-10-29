import { authConfig } from "@modules/auth/auth.config";
import { TokenRevocationRepository } from "@modules/auth/database/tokenRevocation.repository.port";
import { UserRepository } from "@modules/user/database/user.repository.port";
import {
  executeTask,
  executeTasks,
} from "@shared/utils/application/executeTask";
import { O } from "@shared/utils/application/monads";
import { UserBuilder } from "@test/dataBuilders/userBuilder";
import { RepositoryKind, useRepositories } from "@test/util/repositoryContract";

/** What TokenRevocationRepository promises, for the fake and the Prisma
 * one. UserRepository.revokeTokens writes the revocations. */
export const tokenRevocationRepositoryContract = (kind: RepositoryKind) =>
  describe(`[Contract] TokenRevocationRepository (${kind})`, () => {
    const ctx = useRepositories(kind, (get) => ({
      revocations: get(TokenRevocationRepository),
      users: get(UserRepository),
    }));
    const user = new UserBuilder(1).build();
    const other = new UserBuilder(2)
      .withEmail("outro@example.com")
      .withCPF("11144477735")
      .build();
    const at = new Date("2026-10-21T12:00:00Z");
    const ttl = authConfig.accessTokenTtl * 1000;
    const revocationOf = (userId: string) =>
      executeTask(ctx.revocations.findByUserId(userId));
    const revoke = (userId: string, when = at) =>
      executeTask(ctx.users.revokeTokens({ userId, at: when }));

    beforeEach(async () => {
      await executeTasks(ctx.users.save(user), ctx.users.save(other));
    });

    it("Should find nothing for a user never revoked", async () => {
      expect(await revocationOf(user.id)).toEqual(O.none);
    });

    it("Should keep the latest revocation, until its tokens expire", async () => {
      await revoke(user.id);
      await revoke(user.id);

      expect(await revocationOf(user.id)).toEqual(
        O.some({
          userId: user.id,
          tokenVersion: user.tokenVersion + 2,
          expiresAt: new Date(at.getTime() + ttl),
        }),
      );
    });

    it("Should drop the expired revocations when revoking", async () => {
      await revoke(other.id);
      const later = new Date(at.getTime() + ttl + 1);

      await revoke(user.id, later);

      const [otherRevocation, userRevocation] = await Promise.all([
        revocationOf(other.id),
        revocationOf(user.id),
      ]);
      expect(otherRevocation).toEqual(O.none);
      expect(O.isSome(userRevocation)).toBe(true);
    });

    it("Should drop a user's revocation with the user", async () => {
      await revoke(user.id);

      await executeTask(ctx.users.deleteById(user.id));

      expect(await revocationOf(user.id)).toEqual(O.none);
    });
  });
