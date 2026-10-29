import {
  AuditEntryPage,
  AuditQuery,
  PageQuery,
  QueryString,
} from "@library/contracts";
import { auditEntryView } from "@modules/audit/domain/auditQuery";
import { AuditEntriesQuery } from "@modules/audit/queries/auditEntries/auditEntries.query";
import { ApiController } from "@modules/auth/decorators/apiController.decorator";
import { Roles } from "@modules/auth/decorators/roles.decorator";
import { RolesGuard } from "@modules/auth/guards/roles.guard";
import { UserRoleEnum } from "@modules/user/domain/user.entity";
import { Get, Query, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiUnprocessableEntityResponse } from "@nestjs/swagger";
import { QueryBus } from "@shared/utils/application/cqrs";
import { Answers } from "@shared/utils/http/answers";
import { ApiQueryContract } from "@shared/utils/http/apiQueryContract";

@ApiController("Auditoria")
export class AuditEntriesController {
  constructor(private readonly queryBus: QueryBus) {}

  @Get("audit")
  @UseGuards(RolesGuard)
  @Roles(UserRoleEnum.Admin)
  @ApiOperation({
    summary: "Listar quem alterou o quê, do mais recente",
    description:
      "Uma entrada por operação de escrita que deu certo, com quem fez, o registro que nomeou e o que recebeu. Só o administrador.",
  })
  @ApiQueryContract(PageQuery)
  @ApiQueryContract(AuditQuery)
  @Answers(AuditEntryPage)
  @ApiUnprocessableEntityResponse({
    description: "Filtro inválido, ou início que não é antes do fim.",
  })
  async auditEntries(
    // Parsed by the handler
    @Query()
    {
      page,
      limit,
      ...filters
    }: QueryString<typeof PageQuery> & QueryString<typeof AuditQuery>,
  ) {
    return this.queryBus
      .execute(new AuditEntriesQuery({ page, limit }, filters))
      .then(({ page: result, names }) => ({
        count: result.count,
        limit: result.limit,
        page: result.page,
        data: result.data.map(auditEntryView(names)),
      }));
  }
}
