import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { AuthenticationService } from "./authentication.service";
import { ConstantsService } from "../constants-service/constants.service";

/**
 * Add Authorization header to requests towards server URL if the user is logged in.
 */
export const httpHeaders: HttpInterceptorFn = (req, next) => {
  const authenticationService = inject(AuthenticationService);
  const constantsService = inject(ConstantsService);

  const setHeaders: Record<string, string> = {};
  setHeaders["Accept"] ??= "application/json";
  if (req.method === "POST" || req.method === "PUT") {
    setHeaders["Content-Type"] ??= "application/json";
  }
  if (authenticationService.isUserLoggedIn() && req.url.startsWith(constantsService.getServerUrl())) {
    setHeaders["Authorization"] = "Bearer " + authenticationService.currentAuthor?.accessToken;
  }
  req = req.clone({ setHeaders });
  return next(req);
};
