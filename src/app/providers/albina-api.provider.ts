import { HttpClient } from "@angular/common/http";
import { inject, provideAppInitializer } from "@angular/core";

import { client } from "./albina-api/client.gen";
import { ConstantsService } from "./constants-service/constants.service";

/**
 * Configure the generated hey-api client once at bootstrap: point it at the
 * configured API base URL and hand it Angular's HttpClient, so requests flow
 * through the `httpHeaders` interceptor (bearer token) and resolve outside
 * injection contexts.
 */
export function provideAlbinaApiClient() {
  return provideAppInitializer(() => {
    const constantsService = inject(ConstantsService);
    const httpClient = inject(HttpClient);
    client.setConfig({
      baseUrl: constantsService.getServerUrlGET("/"),
      httpClient,
    });
  });
}
