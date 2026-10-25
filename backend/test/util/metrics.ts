import { Metrics } from "@shared/metrics/metrics";

// How many observations a histogram holds per value of one label, among
// the series whose other labels match `where`
const countsBy = async (
  metrics: Metrics,
  name: string,
  label: string,
  where: Record<string, string>,
): Promise<Record<string, number>> => {
  const metric = await metrics.registry.getSingleMetric(name)?.get();
  const counts: Record<string, number> = {};
  for (const entry of metric?.values ?? []) {
    const { labels, value } = entry;
    const matches = Object.entries(where).every(
      ([key, expected]) => labels[key] === expected,
    );
    // A histogram's values are its buckets, sum and count
    const isCount =
      "metricName" in entry && entry.metricName === `${name}_count`;
    if (isCount && matches) counts[String(labels[label])] = value;
  }
  return counts;
};

/** A use case's runs by outcome: `{ ok: 2, notFound: 1 }`. */
export const useCaseRuns = (
  metrics: Metrics,
  useCase: string,
): Promise<Record<string, number>> =>
  countsBy(metrics, "use_case_duration_seconds", "outcome", {
    use_case: useCase,
  });

/** A route's requests by status: `{ "200": 1 }`. */
export const requestsTo = (
  metrics: Metrics,
  method: string,
  route: string,
): Promise<Record<string, number>> =>
  countsBy(metrics, "http_request_duration_seconds", "status", {
    method,
    route,
  });
