import { TokenRevocationRepository } from "@modules/auth/database/tokenRevocation.repository.port";
import { TokenRevocation } from "@modules/auth/domain/tokenRevocation.entity";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "@shared/prisma/prisma.service";
import { FPF, TE } from "@shared/utils/application/monads";
import { validateFromUnknown } from "@shared/utils/application/validateWith";
import { prismaTasks } from "@shared/utils/database/prismaTasks";
import { validateMaybeRow } from "@shared/utils/database/rowValidation";

@Injectable()
export class RealTokenRevocationRepository implements TokenRevocationRepository {
  constructor(private prisma: PrismaService) {}

  private revocations = prismaTasks(() => this.prisma.tokenRevocation);
  private validate = validateFromUnknown(TokenRevocation, "TokenRevocation");

  // By the primary key, as each request asks
  findByUserId = (userId: string) =>
    FPF.pipe(
      this.revocations.findUnique({ where: { userId } }),
      TE.chainEitherK(validateMaybeRow(this.validate)),
    );
}
