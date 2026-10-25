import { z } from "zod";
import { contracts } from "./registry.js";

/** The named contracts as OpenAPI 3.0 schemas, referencing each other. */
export const contractSchemas = (): Record<string, object> =>
  Object.fromEntries(
    Object.entries(
      z.toJSONSchema(contracts, {
        target: "openapi-3.0",
        io: "input",
        uri: (id) => `#/components/schemas/${id}`,
      }).schemas,
    ).map(([id, { $id: _, ...schema }]) => [id, schema]),
  );

/** A reference to a named contract, for Swagger's decorators. */
export const contractRef = (schema: z.ZodType): { $ref: string } => {
  const meta = contracts.get(schema);
  if (!meta) throw new Error("The schema isn't a named contract");
  return { $ref: `#/components/schemas/${meta.id}` };
};

/** A list of a named contract, for Swagger's decorators. */
export const contractList = (schema: z.ZodType) => ({
  type: "array" as const,
  items: contractRef(schema),
});
