import helmet from "@fastify/helmet";
import fastifyRequestContext from "@fastify/request-context";
import { contractSchemas } from "@library/contracts";
import { RequestJWTPayload } from "@modules/auth/guards/authenticatedRequest";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from "@nestjs/swagger";
import { Metrics } from "@shared/metrics/metrics";
import { FPF } from "@shared/utils/application/monads";
import { envConfig } from "@shared/utils/config/environment.config";
import { DomainErrorFilter } from "@shared/utils/http/domainError.filter";
import { appInfo } from "@src/app.info";
import { Logger } from "nestjs-pino";

// Shared by main.ts and the e2e tests, so the tests run the app with the
// same setup as production

/**
 * Client IPs (used for rate limiting) come from X-Forwarded-For only when
 * the request arrives from a trusted proxy (TRUST_PROXY)
 */
export const createAdapter = (
  trustProxy: boolean | string[] = envConfig.trustProxy,
): FastifyAdapter => new FastifyAdapter({ trustProxy });

export const configureApp = async (
  app: NestFastifyApplication,
): Promise<NestFastifyApplication> => {
  const fastifyInstance = app.getHttpAdapter().getInstance();
  fastifyInstance.decorateRequest("user", null);
  fastifyInstance.addHook("preHandler", (req, reply, next) => {
    // Fastify's request type doesn't declare the user the guards set
    const request: { user?: Partial<RequestJWTPayload> } =
      FPF.unsafeCoerce(req);
    request.user = request.user || {};
    next();
  });
  // Every answered request, by its route's pattern, for the metrics
  const metrics = app.get(Metrics);
  fastifyInstance.addHook("onResponse", (request, reply, done) => {
    metrics.observeRequest(
      request.method,
      request.routeOptions.url,
      reply.statusCode,
      reply.elapsedTime / 1000,
    );
    done();
  });
  app.useLogger(app.get(Logger));
  app.useGlobalFilters(new DomainErrorFilter(app.getHttpAdapter()));

  const options = new DocumentBuilder()
    .setTitle(appInfo.title)
    .setVersion(appInfo.version)
    .addSecurity("bearer", {
      type: "http",
      scheme: "bearer",
    })
    .build();
  const document = SwaggerModule.createDocument(app, options);
  // The contracts' schemas, which controllers reference by name. JSON Schema
  // and OpenAPI's SchemaObject describe the same JSON
  document.components = {
    ...document.components,
    schemas: {
      ...document.components?.schemas,
      ...FPF.unsafeCoerce<
        Record<string, object>,
        NonNullable<OpenAPIObject["components"]>["schemas"]
      >(contractSchemas()),
    },
  };
  SwaggerModule.setup("swagger", app, document);

  await app.register(fastifyRequestContext);
  await app.register(helmet, {
    contentSecurityPolicy: false,
  });

  return app;
};
