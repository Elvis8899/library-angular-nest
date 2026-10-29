import { Global, Module } from "@nestjs/common";
import { DomainEventPublisherModule } from "@shared/domainEventPublisher/domainEventPublisher.module";
import { MetricsModule } from "@shared/metrics/metrics.module";
import { FPF } from "@shared/utils/application/monads";
import { UseCase } from "@shared/utils/application/useCase";
import { UseCaseObserver } from "@shared/utils/application/useCaseObserver";
import { RealUUIDGeneratorService } from "@shared/uuid/realUUIDGenerator.service";

@Global()
@Module({
  imports: [DomainEventPublisherModule, MetricsModule],
  // The UUIDs too, which every handler's recording draws ids from
  providers: [
    UseCase,
    RealUUIDGeneratorService,
    // Nobody watches the runs in the app; specs bind their own
    { provide: UseCaseObserver, useValue: { ran: FPF.constVoid } },
  ],
  exports: [UseCase, RealUUIDGeneratorService, UseCaseObserver],
})
export class UseCaseModule {}
