import type { Environment } from "./environment-type";

export const environment: Environment = {
  apiBaseUrl: window["ENV"].API_BASE_URL,
  textcatUrl: window["ENV"].TEXTCAT_URL,
  awsomeConfigUrl: window["ENV"].AWSOME_CONFIG_URL,
  headerBgColor: window["ENV"].HEADER_BG_COLOR,
  faviconPath: window["ENV"].FAVICON_PATH,
  logoPath: window["ENV"].LOGO_PATH,
  sentryDSN: window["ENV"].SENTRY_DSN,
};

Object.assign(environment, (window as any).ENV);
