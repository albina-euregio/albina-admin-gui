export const environment = {
  production: true,
  apiBaseUrl: "https://admin.avalanche.report/albina/api/",
  wsBaseUrl: "wss://socket.avalanche.report/albina/",
  textcatUrl: "https://admin.avalanche.report/textcat-ng/",
  headerBgColor: "#ffffff",
  faviconPath: "assets/img/admin-favicon.ico",
  logoPath: "assets/img/admin-logo.svg",
  showChat: true
};

Object.assign(environment, (window as any).ENV);
