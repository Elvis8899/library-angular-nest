import { RefreshSessionRepository } from "@auth/database/refreshSession.repository.port";
import {
  RefreshSession,
  RotateRefreshSession,
} from "@auth/domain/refreshSession.entity";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "@shared/prisma/prisma.service";
import { FPF, TE } from "@shared/utils/application/monads";
import { prismaTasks } from "@shared/utils/database/prismaTasks";

@Injectable()
export class RealRefreshSessionRepository implements RefreshSessionRepository {
  constructor(private prisma: PrismaService) {}

  private sessions = prismaTasks(() => this.prisma.refreshSession);

  create = (session: RefreshSession): TE.TaskEither<Error, void> =>
    FPF.pipe(this.sessions.create({ data: session }), TE.asUnit);

  // Conditional update, so two concurrent uses of one token cannot both win
  rotate = ({
    id,
    jti,
    newJti,
    expiresAt,
  }: RotateRefreshSession): TE.TaskEither<Error, boolean> =>
    FPF.pipe(
      this.sessions.updateMany({
        where: { id, currentJti: jti },
        data: { currentJti: newJti, expiresAt },
      }),
      TE.map(({ count }) => count === 1),
    );

  deleteById = (id: string): TE.TaskEither<Error, void> =>
    FPF.pipe(this.sessions.deleteMany({ where: { id } }), TE.asUnit);

  deleteExpired = (userId: string): TE.TaskEither<Error, void> =>
    FPF.pipe(
      this.sessions.deleteMany({
        where: { userId, expiresAt: { lt: new Date() } },
      }),
      TE.asUnit,
    );
}
