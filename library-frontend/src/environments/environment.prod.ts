import { env } from "src/environments/.env";

export const environment = {
  production: true,
  version: env["npm_package_version"] + "-dev",
  defaultLanguage: "pt-BR",
  supportedLanguages: ["pt-BR", "en-US"],
};
