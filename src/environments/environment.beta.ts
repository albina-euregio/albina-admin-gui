import type { Environment } from "./environment-type";

export const environment: Environment = {
  initialUrl: "",
  apiBaseUrl: "https://avalanche.report/api/",
  textcatUrl: "https://avalanche.report/textcat-ng/",
  awsomeConfigUrl: "https://models.awsome.alpsolut.eu/dcfg/awsome.json",
  headerBgColor: "#839194",
  faviconPath: "assets/img/admin-favicon-beta.ico",
  logoPath: "assets/img/admin-logo-beta.svg",
};

Object.assign(environment, globalThis.ENV);
