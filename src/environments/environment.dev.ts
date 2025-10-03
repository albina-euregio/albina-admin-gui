// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `angular-cli.json`.
import type { Environment } from "./environment-type";

export const environment: Environment = {
  initialUrl: "",
  apiBaseUrl: "https://admin.avalanche.report/albina_dev/api/",
  textcatUrl: "https://admin.avalanche.report/textcat-ng-dev/",
  awsomeConfigUrl: "https://models.avalanche.report/dashboard/awsome.json",
  headerBgColor: "#f4ea12",
  faviconPath: "assets/img/admin-favicon-dev.ico",
  logoPath: "assets/img/admin-logo-dev.svg",
  sentryDSN: "",
};

Object.assign(environment, globalThis.ENV);
