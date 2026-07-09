import { HttpClient } from "@angular/common/http";
import { inject, provideAppInitializer } from "@angular/core";
import { environment } from "environments/environment";

import { client } from "./albina-api/client.gen";

/**
 * Configure the generated hey-api client once at bootstrap: point it at the
 * configured API base URL and hand it Angular's HttpClient, so requests flow
 * through the `httpHeaders` interceptor (bearer token) and resolve outside
 * injection contexts.
 */
export function provideAlbinaApiClient() {
  return provideAppInitializer(() => {
    const httpClient = inject(HttpClient);
    client.setConfig({
      baseUrl: environment.apiBaseUrl,
      httpClient,
    });
  });
}
