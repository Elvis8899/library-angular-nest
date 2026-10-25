import { Global, Module } from "@nestjs/common";
import { Metrics } from "@shared/metrics/metrics";

@Global()
@Module({
  providers: [Metrics],
  exports: [Metrics],
})
export class MetricsModule {}
