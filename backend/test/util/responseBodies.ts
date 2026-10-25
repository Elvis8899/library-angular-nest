import { z } from "zod";

// The parts of API responses the e2e tests read. Parsing checks the response
// too, where a cast would only assume its shape

export const TokensBody = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

export const LoginBody = TokensBody.extend({
  user: z.object({ id: z.string() }),
});

export const PageBody = z.object({
  count: z.number(),
  data: z.array(z.object({ id: z.string() })),
});

export const SwaggerDocumentBody = z.object({
  info: z.object({ title: z.string() }),
  paths: z.record(z.string(), z.unknown()),
  components: z.object({
    securitySchemes: z.record(z.string(), z.unknown()),
    schemas: z.record(z.string(), z.unknown()),
  }),
});
