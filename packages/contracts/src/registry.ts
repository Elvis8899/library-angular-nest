import { z } from "zod";

/** What Swagger calls a contract: its name, and what it's for. */
export interface ContractMeta {
  id: string;
  description?: string;
}

/** Every contract with a name, for the API's OpenAPI document. */
export const contracts = z.registry<ContractMeta>();

/** Names a schema in the OpenAPI document. */
export const contract = <Schema extends z.ZodType>(
  schema: Schema,
  meta: ContractMeta,
): Schema => {
  contracts.add(schema, meta);
  return schema;
};
