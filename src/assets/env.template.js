(function (window) {
  /**
   * @type {import("../environments/environment-type").Environment}
   */
  window.ENV = {
    initialUrl: "${INITIAL_URL}",
    apiBaseUrl: "${API_BASE_URL}",
    wsBaseUrl: "${WS_BASE_URL}",
    textcatUrl: "${TEXTCAT_URL}",
    awsomeConfigUrl: "${AWSOME_CONFIG_URL}",
    headerBgColor: "${HEADER_BG_COLOR}",
    faviconPath: "${FAVICON_PATH}",
    logoPath: "${LOGO_PATH}",
    sentryDSN: "${SENTRY_DSN}",
  };
})(this);
