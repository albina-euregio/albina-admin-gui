import type { Environment } from "./environment-type";

export const environment: Environment = {
  production: true,
  apiBaseUrl: "https://admin.avalanche.report/albina/api/",
  wsBaseUrl: "wss://socket.avalanche.report/albina/",
  textcatUrl: "https://admin.avalanche.report/textcat-ng/",
  headerBgColor: "#ffffff",
  faviconPath: "assets/img/admin-favicon.ico",
  logoPath: "assets/img/admin-logo.svg",
  isEuregio: true,
  showChat: true
};

Object.assign(environment, (window as any).ENV);
