import { get } from "env-var";
import "@shared/utils/dotenv";
import { envConfig } from "@configs/environment.config";

export const loggerEnv = {
  prettify: get("LOG_PRETTIFY").default("true").asBool(),
  level: get("LOG_LEVEL")
    .default(envConfig.isProduction ? "info" : "debug")
    .asEnum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]),
};

export const logConfig = {
  level: loggerEnv.level,
  transport: loggerEnv.prettify
    ? {
        target: "pino-pretty",
        options: {
          singleLine: true,
        },
      }
    : undefined,
};
