import { Routes } from "@angular/router";
import { t } from "@app/shared/i18n/translations/translationKey";

export const routes: Routes = [
  {
    path: "",
    loadComponent: () =>
      import("./auditLog/auditLog.component").then((m) => m.AuditLogComponent),
    data: { title: t("audit.title") },
  },
];
