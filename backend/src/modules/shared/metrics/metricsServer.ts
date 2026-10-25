import { createServer, Server } from "node:http";
import { Registry } from "prom-client";

/**
 * Serves `GET /metrics` for Prometheus on a port of its own, which nginx
 * never proxies: only what shares the Docker network scrapes it, so it
 * needs no token (and no place in routeProtection's public routes).
 */
export const startMetricsServer = (
  registry: Registry,
  port: number,
  host: string,
): Promise<Server> => {
  const server = createServer((request, response) => {
    if (request.method !== "GET" || request.url !== "/metrics") {
      response.writeHead(404).end();
      return;
    }
    registry.metrics().then(
      (body) => {
        response.writeHead(200, { "Content-Type": registry.contentType });
        response.end(body);
      },
      () => {
        response.writeHead(500).end();
      },
    );
  });
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, host, () => {
      resolve(server);
    });
  });
};
