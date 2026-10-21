import { Global, Module } from "@nestjs/common";
import { DomainEventPublisherModule } from "@shared/domainEventPublisher/domainEventPublisher.module";
import { UseCase } from "@shared/utils/application/useCase";

@Global()
@Module({
  imports: [DomainEventPublisherModule],
  providers: [UseCase],
  exports: [UseCase],
})
export class UseCaseModule {}
