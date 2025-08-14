import { ConstantsService } from "../constants-service/constants.service";
import { AuthenticationService } from "./authentication.service";
import { HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";

/**
 * Add Authorization header to requests towards server URL if the user is logged in.
 */
export const httpHeaders: HttpInterceptorFn = (req, next) => {
  const authenticationService = inject(AuthenticationService);
  const constantsService = inject(ConstantsService);

  const setHeaders: Record<string, string> = {};
  if (!req.headers.has("Accept")) {
    setHeaders["Accept"] = "application/json";
  }
  if (req.method === "POST" || req.method === "PUT") {
    if (req.body instanceof FormData) {
      // `Content-Type: multipart/form-data; boundary=...` is added automatically
    } else if (!req.headers.has("Content-Type")) {
      setHeaders["Content-Type"] = "application/json";
    }
  }
  if (authenticationService.isUserLoggedIn() && req.url.startsWith(constantsService.getServerUrl())) {
    setHeaders["Authorization"] = "Bearer " + authenticationService.currentAuthor?.accessToken;
    if (!window.location.origin.includes("localhost")) {
      setHeaders["X-Client-Version"] = constantsService.release;
    }
  }
  req = req.clone({ setHeaders });
  return next(req);
};
