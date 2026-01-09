import type { Environment } from "./environment-type";

export const environment: Environment = {
  initialUrl: "",
  apiBaseUrl: "https://admin.avalanche.report/albina/api/",
  textcatUrl: "https://admin.avalanche.report/textcat-ng/",
  awsomeConfigUrl: "https://models.avalanche.report/dcfg/awsome.json",
  headerBgColor: "#ffffff",
  faviconPath: "assets/img/admin-favicon.ico",
  logoPath: "assets/img/admin-logo.svg",
};

Object.assign(environment, globalThis.ENV);
