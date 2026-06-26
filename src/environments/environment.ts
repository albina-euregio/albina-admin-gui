import type { Environment } from "./environment-type";

// Empty base that satisfies the Environment type. Every value is supplied at
// runtime by `assets/env.js` (see `Object.assign` below):
//   - in CI, the matching `env.<name>.js` is copied to `env.js`
//   - in the Docker image, `env.js` is generated at container start from
//     `env.template.js` via envsubst (see Dockerfile)
//   - for local dev, `pnpm start-dev` etc. copy `env.<name>.js` to `env.js`
export const environment: Environment = {
  initialUrl: "",
  apiBaseUrl: "",
  textcatUrl: "",
  awsomeConfigUrl: "",
  headerBgColor: "",
  faviconPath: "",
  logoPath: "",
};

Object.assign(environment, globalThis.ENV);
