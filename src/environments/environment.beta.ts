import type { Environment } from "./environment-type";

export const environment: Environment = {
  production: true,
  apiBaseUrl: "https://admin.avalanche.report/albina/api/",
  wsBaseUrl: "wss://socket.avalanche.report/albina/",
  textcatUrl: "https://admin.avalanche.report/textcat-ng/",
  headerBgColor: "#f4ea12",
  faviconPath: "assets/img/admin-favicon-beta.ico",
  isEuregio: true
};

Object.assign(environment, (window as any).ENV);
