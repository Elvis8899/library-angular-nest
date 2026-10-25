import { Prisma } from "@db/generated/client";
import { Injectable } from "@nestjs/common";
import { AuditEntry, NewAuditEntry } from "@shared/audit/auditEntry";
import { AuditFilter, AuditLog } from "@shared/audit/auditLog";
import { PrismaService } from "@shared/prisma/prisma.service";
import { FPF, TE } from "@shared/utils/application/monads";
import { validateFromUnknown } from "@shared/utils/application/validateWith";
import { prismaTasks } from "@shared/utils/database/prismaTasks";
import { Paginated } from "@shared/utils/database/repository.port";
import { loadPage } from "@shared/utils/database/rowValidation";
import { PageWindow } from "@shared/utils/domain/query.base";
import { RealUUIDGeneratorService } from "@shared/uuid/realUUIDGenerator.service";

export const auditWhere = ({
  userId,
  useCase,
  recordId,
  from,
  before,
}: AuditFilter): Prisma.AuditEntryWhereInput => ({
  ...(userId && { userId }),
  ...(useCase && { useCase: { contains: useCase, mode: "insensitive" } }),
  ...(recordId && { recordId }),
  ...((from ?? before) && {
    recordedAt: { ...(from && { gte: from }), ...(before && { lt: before }) },
  }),
});

@Injectable()
export class RealAuditLog implements AuditLog {
  constructor(
    private prisma: PrismaService,
    private uuids: RealUUIDGeneratorService,
  ) {}

  private validator = validateFromUnknown(AuditEntry, "AuditEntry");
  private entries = prismaTasks(() => this.prisma.auditEntry);

  record = ({ input, ...entry }: NewAuditEntry): TE.TaskEither<Error, void> =>
    FPF.pipe(
      this.entries.create({
        data: {
          ...entry,
          id: this.uuids.generateUUID(),
          // Plain JSON already (auditEntryOf)
          input: input === null ? Prisma.DbNull : FPF.unsafeCoerce(input),
        },
      }),
      TE.asUnit,
    );

  findPage = (
    filter: AuditFilter,
    window: PageWindow,
  ): TE.TaskEither<Error, Paginated<AuditEntry>> => {
    const where = auditWhere(filter);
    return loadPage(
      {
        rows: ({ skip, take }) =>
          this.entries.findMany({
            where,
            skip,
            take,
            orderBy: [{ recordedAt: "desc" }, { id: "desc" }],
          }),
        total: () => this.entries.count({ where }),
      },
      this.validator,
    )(window);
  };
}
