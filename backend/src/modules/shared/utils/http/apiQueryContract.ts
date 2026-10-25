import { contractQuery } from "@library/contracts";
import { applyDecorators } from "@nestjs/common";
import { ApiQuery, ApiQueryOptions } from "@nestjs/swagger";
import { FPF } from "@shared/utils/application/monads";
import { z } from "zod";

/** Documents a route's query string from a contract: a parameter per
 * field. */
export const ApiQueryContract = (schema: z.ZodObject) =>
  applyDecorators(
    ...contractQuery(schema).map((parameter) =>
      // JSON Schema and OpenAPI's SchemaObject describe the same JSON
      ApiQuery(FPF.unsafeCoerce<typeof parameter, ApiQueryOptions>(parameter)),
    ),
  );
