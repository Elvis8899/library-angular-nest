import { RefreshSessionRepository } from "@modules/auth/database/refreshSession.repository.port";
import { RefreshSession } from "@modules/auth/domain/refreshSession.entity";
import { UserRepository } from "@modules/user/database/user.repository.port";
import {
  executeTask,
  executeTasks,
} from "@shared/utils/application/executeTask";
import { UserBuilder } from "@test/dataBuilders/userBuilder";
import { createTestId, TableNameEnum } from "@test/util/defaultIds";
import { RepositoryKind, useRepositories } from "@test/util/repositoryContract";

/** What RefreshSessionRepository promises, for the fake and the Prisma one.
 * The port has no read: a session is there while rotate takes it. */
export const refreshSessionRepositoryContract = (kind: RepositoryKind) =>
  describe(`[Contract] RefreshSessionRepository (${kind})`, () => {
    const ctx = useRepositories(kind, (get) => ({
      sessions: get(RefreshSessionRepository),
      users: get(UserRepository),
    }));
    const user = new UserBuilder().build();
    const tomorrow = () => new Date(Date.now() + 86400 * 1000);
    const yesterday = () => new Date(Date.now() - 86400 * 1000);
    const session = (n: number, expiresAt = tomorrow()): RefreshSession => ({
      id: createTestId(TableNameEnum.RefreshSession, n),
      userId: user.id,
      currentJti: createTestId(TableNameEnum.None, n),
      expiresAt,
    });
    const rotates = (stored: RefreshSession, newJti = 9) =>
      executeTask(
        ctx.sessions.rotate({
          id: stored.id,
          jti: stored.currentJti,
          newJti: createTestId(TableNameEnum.None, newJti),
          expiresAt: tomorrow(),
        }),
      );

    beforeEach(async () => {
      await executeTask(ctx.users.save(user));
    });

    it("Should rotate the session only from its current jti", async () => {
      const stored = session(1);
      await executeTask(ctx.sessions.create(stored));

      expect(await rotates(stored, 2)).toBe(true);
      // Reused: the jti is no longer the current one
      expect(await rotates(stored, 3)).toBe(false);
      expect(
        await rotates({
          ...stored,
          currentJti: createTestId(TableNameEnum.None, 2),
        }),
      ).toBe(true);
    });

    it("Should delete a session, even if it no longer exists", async () => {
      await executeTask(ctx.sessions.create(session(1)));

      await executeTask(ctx.sessions.deleteById(session(1).id));
      await executeTask(ctx.sessions.deleteById(session(1).id));

      expect(await rotates(session(1))).toBe(false);
    });

    it("Should delete only the user's expired sessions, rotated ones too", async () => {
      await executeTasks(
        ctx.sessions.create(session(1, yesterday())),
        ctx.sessions.create(session(2)),
        ctx.sessions.create(session(3)),
      );
      // Rotated to a date already gone
      await executeTask(
        ctx.sessions.rotate({
          id: session(3).id,
          jti: session(3).currentJti,
          newJti: createTestId(TableNameEnum.None, 4),
          expiresAt: yesterday(),
        }),
      );

      await executeTask(ctx.sessions.deleteExpired(user.id));

      expect(await rotates(session(1))).toBe(false);
      expect(await rotates(session(2))).toBe(true);
      expect(
        await rotates({
          ...session(3),
          currentJti: createTestId(TableNameEnum.None, 4),
        }),
      ).toBe(false);
    });
  });
