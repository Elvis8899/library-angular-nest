import { Global, Module } from "@nestjs/common";
import { AuditLog } from "@shared/audit/auditLog";
import { RealAuditLog } from "@shared/audit/realAuditLog";
import { RealUUIDGeneratorService } from "@shared/uuid/realUUIDGenerator.service";

// Global: every handler's UseCase writes to it
@Global()
@Module({
  providers: [
    RealUUIDGeneratorService,
    { provide: AuditLog, useClass: RealAuditLog },
  ],
  exports: [AuditLog],
})
export class AuditLogModule {}
