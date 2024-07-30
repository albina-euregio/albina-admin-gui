// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `angular-cli.json`.
import type { Environment } from "./environment-type";

export const environment: Environment = {
  apiBaseUrl: "http://localhost:8080/albina/api/",
  wsBaseUrl: "ws://localhost:8080/albina/",
  textcatUrl: "https://admin.avalanche.report/textcat-ng-dev/",
  headerBgColor: "#f95bdc",
  faviconPath: "assets/img/admin-favicon-local.ico",
  logoPath: "assets/img/admin-logo-local.svg",
};

Object.assign(environment, (window as any).ENV);
