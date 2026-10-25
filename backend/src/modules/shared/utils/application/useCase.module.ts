import { Global, Module } from "@nestjs/common";
import { DomainEventPublisherModule } from "@shared/domainEventPublisher/domainEventPublisher.module";
import { MetricsModule } from "@shared/metrics/metrics.module";
import { UseCase } from "@shared/utils/application/useCase";

@Global()
@Module({
  imports: [DomainEventPublisherModule, MetricsModule],
  providers: [UseCase],
  exports: [UseCase],
})
export class UseCaseModule {}
