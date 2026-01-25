import { env } from "./.env";

export const environment = {
  production: false,
  version: env["npm_package_version"] + "-dev",
  defaultLanguage: "pt-BR",
  supportedLanguages: ["pt-BR", "en-US"],
  baseURL: "http://localhost:3000",
};
