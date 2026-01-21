import { config } from "dotenv";
import * as path from "path";

export const getBaseEnvPath = (nodeEnv: string | undefined) =>
  nodeEnv === "test" ? "../../../.env.test" : "../../../../.env";

// Initializing dotenv
const envPath: string = path.resolve(
  __dirname,
  getBaseEnvPath(process.env.NODE_ENV),
);
config({ path: envPath });
