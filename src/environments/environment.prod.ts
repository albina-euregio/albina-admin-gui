import type { Environment } from "./environment-type";

export const environment: Environment = {
  apiBaseUrl: "https://admin.avalanche.report/albina/api/",
  textcatUrl: "https://admin.avalanche.report/textcat-ng/",
  headerBgColor: "#ffffff",
  faviconPath: "assets/img/admin-favicon.ico",
  logoPath: "assets/img/admin-logo.svg",
  sentryDSN: "",
};

Object.assign(environment, (window as any).ENV);
