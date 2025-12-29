import type { Environment } from "./environment-type";

export const environment: Environment = {
  initialUrl: "",
  apiBaseUrl: "https://api.lauegi.report/api/",
  textcatUrl: "https://admin.lauegi.report/textcat-ng/",
  awsomeConfigUrl: "https://models.avalanche.report/dcfg/awsome.json",
  headerBgColor: "#ffffff",
  faviconPath: "assets/img/admin-favicon-aran.ico",
  logoPath: "assets/img/admin-logo-aran.svg",
};

Object.assign(environment, globalThis.ENV);
