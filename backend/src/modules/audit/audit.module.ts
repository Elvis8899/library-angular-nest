import { AuditEntriesController } from "@modules/audit/queries/auditEntries/auditEntries.controller";
import { AuditEntriesQueryHandler } from "@modules/audit/queries/auditEntries/auditEntries.query";
import { UserModule } from "@modules/user/user.module";
import { Module } from "@nestjs/common";
import { CqrsModule } from "@shared/utils/application/cqrs";

// The audit screen's reads; the entries are written by every UseCase
// (AuditLogModule)
@Module({
  imports: [CqrsModule, UserModule],
  controllers: [AuditEntriesController],
  providers: [AuditEntriesQueryHandler],
})
export class AuditModule {}
