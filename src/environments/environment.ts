// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `angular-cli.json`.
import type { Environment } from "./environment-type";

export const environment: Environment = {
  initialUrl: "",
  apiBaseUrl: "http://localhost:8080/albina/api/",
  textcatUrl: "https://admin.avalanche.report/textcat-ng-dev/",
  awsomeConfigUrl: "https://models.avalanche.report/dashboard/awsome.json",
  headerBgColor: "#8e2232",
  faviconPath: "assets/img/admin-favicon-local.ico",
  logoPath: "assets/img/admin-logo-local.svg",
  sentryDSN: "",
};

Object.assign(environment, (window as any).ENV);
