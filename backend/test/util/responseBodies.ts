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

/** A refusal's body: its code, and the details the client acts on. */
export const ErrorBody = z.object({
  code: z.string(),
  details: z.record(z.string(), z.unknown()).optional(),
});

/** A response's status and error code, to compare in one go. */
export const errorOf = (response: { status: number; body: unknown }) => [
  response.status,
  ErrorBody.parse(response.body).code,
];

/** A response's body, read with what describes it:
 * `await bodyOf(ProductDay, e2e.http().get(url))`. */
export const bodyOf = async <S extends z.ZodType>(
  schema: S,
  request: PromiseLike<{ body: unknown }>,
): Promise<z.output<S>> => schema.parse((await request).body);
