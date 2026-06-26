import type { Environment } from "./environment-type";

// Compile-time defaults for local development (`ng serve`).
// For deployed builds and for serving against a remote backend, these are
// overridden at runtime by `assets/env.js` (see `Object.assign` below):
//   - in CI, the matching `env.<name>.js` is copied to `env.js`
//   - in the Docker image, `env.js` is generated at container start from
//     `env.template.js` via envsubst (see Dockerfile)
//   - for local dev, `pnpm start-dev` etc. copy `env.<name>.js` to `env.js`
export const environment: Environment = {
  initialUrl: "",
  apiBaseUrl: "http://localhost:8080/albina/api/",
  textcatUrl: "https://dev.avalanche.report/textcat-ng/",
  awsomeConfigUrl: "https://models.avalanche.report/dcfg/awsome.json",
  headerBgColor: "#8e2232",
  faviconPath: "assets/img/admin-favicon-local.ico",
  logoPath: "assets/img/admin-logo-local.svg",
};

Object.assign(environment, globalThis.ENV);
