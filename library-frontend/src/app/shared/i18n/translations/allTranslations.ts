import { StrictTranslation } from "@ngx-translate/core";
export enum LanguagesEnum {
  EN_US = "en-US",
  PT_BR = "pt-BR",
}
type keys =
  | "APP_NAME"
  | "LANGUAGE"
  | "Books"
  | "Users"
  | "Hello World"
  | "Home"
  | "Login"
  | "Username"
  | "Password"
  | "Angular Boiler Plate V18"
  | "Dashboard"
  | "Logout"
  | "Users List"
  | "Create User"
  | "Books List"
  | "Add Book";

export type AllTranslations = Record<keys, StrictTranslation>;
