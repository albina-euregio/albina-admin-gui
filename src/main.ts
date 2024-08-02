import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";
import * as sentry from "@sentry/angular";
import { AppModule } from "./app/app.module";
import { environment } from "./environments/environment";

if (environment.sentryDSN) {
  sentry.init({ dsn: environment.sentryDSN });
}

platformBrowserDynamic().bootstrapModule(AppModule);
