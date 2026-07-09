import { HttpClient } from "@angular/common/http";
import { inject, provideAppInitializer } from "@angular/core";
import { environment } from "environments/environment";

import { client } from "./albina-api/client.gen";

/**
 * ALBINA servers expect array query parameters (notably `regions`) as repeated
 * params (regions=AT-05&regions=AT-06&…). The generated client serializes
 * `regions` comma-joined (explode:false) per the OpenAPI spec, so pass this at
 * the call site to restore the repeated-param serialization the servers parse.
 */
export const repeatedArrayQuerySerializer = { array: { explode: true, style: "form" } } as const;

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
