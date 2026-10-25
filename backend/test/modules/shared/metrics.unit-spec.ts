import { Metrics } from "@shared/metrics/metrics";
import { startMetricsServer } from "@shared/metrics/metricsServer";
import { FPF } from "@shared/utils/application/monads";
import { requestsTo } from "@test/util/metrics";
import { AddressInfo } from "node:net";
import { Registry } from "prom-client";

describe("[Unit] Metrics", () => {
  it("Should count requests by route pattern, unmatched ones together", async () => {
    const metrics = new Metrics();

    metrics.observeRequest("GET", "/v1/users/:id", 200, 0.02);
    metrics.observeRequest("GET", "/v1/users/:id", 200, 0.03);
    metrics.observeRequest("GET", undefined, 404, 0.001);

    expect(await requestsTo(metrics, "GET", "/v1/users/:id")).toEqual({
      "200": 2,
    });
    expect(await requestsTo(metrics, "GET", "unmatched")).toEqual({
      "404": 1,
    });
  });
});

describe("[Unit] Metrics server", () => {
  const listen = async (registry: Registry) => {
    const server = await startMetricsServer(registry, 0, "127.0.0.1");
    const { port } = FPF.unsafeCoerce<unknown, AddressInfo>(server.address());
    return { server, url: `http://127.0.0.1:${String(port)}` };
  };

  it("Should serve the registry at /metrics and nothing else", async () => {
    const metrics = new Metrics();
    metrics.observeRequest("GET", "/check/status", 200, 0.01);
    const { server, url } = await listen(metrics.registry);
    try {
      const [scrape, other, posted] = await Promise.all([
        fetch(`${url}/metrics`),
        fetch(`${url}/v1/users`),
        fetch(`${url}/metrics`, { method: "POST" }),
      ]);

      expect(scrape.status).toBe(200);
      expect(scrape.headers.get("content-type")).toBe(
        metrics.registry.contentType,
      );
      expect(await scrape.text()).toContain(
        'http_request_duration_seconds_count{method="GET",route="/check/status",status="200"} 1',
      );
      expect(other.status).toBe(404);
      expect(posted.status).toBe(404);
    } finally {
      server.close();
    }
  });

  it("Should answer 500 when the registry can't be read", async () => {
    const failing = FPF.unsafeCoerce<object, Registry>({
      metrics: () => Promise.reject(new Error("broken")),
    });
    const { server, url } = await listen(failing);
    try {
      expect((await fetch(`${url}/metrics`)).status).toBe(500);
    } finally {
      server.close();
    }
  });

  it("Should fail when the port is taken", async () => {
    const { server, url } = await listen(new Registry());
    try {
      const port = Number(new URL(url).port);
      await expect(
        startMetricsServer(new Registry(), port, "127.0.0.1"),
      ).rejects.toThrow("EADDRINUSE");
    } finally {
      server.close();
    }
  });
});
