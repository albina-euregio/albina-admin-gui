import type { Environment } from "./environment-type";

export const environment: Environment = {
  apiBaseUrl: "https://admin.avalanche.report/albina/api/",
  textcatUrl: "https://admin.avalanche.report/textcat-ng/",
  headerBgColor: "#839194",
  faviconPath: "assets/img/admin-favicon-beta.ico",
  logoPath: "assets/img/admin-logo-beta.svg",
  sentryDSN: "",
};

Object.assign(environment, (window as any).ENV);
