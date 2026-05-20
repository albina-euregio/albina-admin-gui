import type { Environment } from "./environment-type";

export const environment: Environment = {
  initialUrl: "",
  apiBaseUrl: "https://www2.avalanche.report/api/",
  textcatUrl: "https://dev.avalanche.report/textcat-ng/",
  awsomeConfigUrl: "",
  headerBgColor: "#1a8943",
  faviconPath: "assets/img/admin-favicon.ico",
  logoPath: "assets/img/admin-logo.svg",
};

Object.assign(environment, globalThis.ENV);
