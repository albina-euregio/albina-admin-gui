import type { Environment } from "./environment-type";

export const environment: Environment = {
  initialUrl: "",
  apiBaseUrl: "https://avalanche.report/api/",
  textcatUrl: "https://avalanche.report/textcat-ng/",
  awsomeConfigUrl: "https://models.awsome.alpsolut.eu/dcfg/awsome.json",
  headerBgColor: "#ffffff",
  faviconPath: "assets/img/admin-favicon.ico",
  logoPath: "assets/img/admin-logo.svg",
};

Object.assign(environment, globalThis.ENV);
