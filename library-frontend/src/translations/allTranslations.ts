import { StrictTranslation } from "@ngx-translate/core";
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
  | "Create User";

export type AllTranslations = Record<keys, StrictTranslation>;
