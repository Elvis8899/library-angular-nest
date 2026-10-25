import { Injectable } from "@nestjs/common";
import { DomainError } from "@shared/utils/domain/shared.errors";
import { Histogram, Registry } from "prom-client";

/** How a use case ended: "ok", its domain error's kind, or "error". */
export const outcomeOf = (error: Error): string =>
  error instanceof DomainError ? error.kind : "error";

// Requests are quick; a use case may read a whole dashboard or a file. The
// p95 is interpolated inside a bucket, so they're closer where the slow
// screens fall (0.25 s to 2.5 s)
const httpBuckets = [
  0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 0.75, 1, 1.5, 2, 2.5, 5, 10,
];
const useCaseBuckets = [
  0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 0.75, 1, 1.5, 2, 2.5, 5, 10,
];

/**
 * The API's Prometheus metrics, which the metrics server (metricsServer.ts,
 * its own port, never behind nginx) serves. Each instance has its own
 * registry, so test modules don't share counts; main.ts adds the process'
 * own (memory, event loop, GC).
 */
@Injectable()
export class Metrics {
  readonly registry = new Registry();

  private readonly httpRequests = new Histogram({
    name: "http_request_duration_seconds",
    help: "HTTP requests, by method, route pattern and status",
    labelNames: ["method", "route", "status"],
    buckets: httpBuckets,
    registers: [this.registry],
  });

  private readonly useCases = new Histogram({
    name: "use_case_duration_seconds",
    help: "Command and query handlers' runs, by name and outcome",
    labelNames: ["use_case", "outcome"],
    buckets: useCaseBuckets,
    registers: [this.registry],
  });

  /**
   * @param route the route's pattern (`/v1/users/:id`), never the URL, so
   * ids don't each make a series; undefined for one that matched none
   */
  observeRequest(
    method: string,
    route: string | undefined,
    status: number,
    seconds: number,
  ): void {
    this.httpRequests.observe(
      { method, route: route ?? "unmatched", status: String(status) },
      seconds,
    );
  }

  /** Starts timing a use case; call what it returns with its outcome. */
  startUseCase(name: string): (outcome: string) => void {
    const end = this.useCases.startTimer({ use_case: name });
    return (outcome) => {
      end({ outcome });
    };
  }
}
