import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { Observable } from "rxjs";
import { inject, Injectable } from "@angular/core";
import { AuthenticationService } from "./authentication.service";
import { ConstantsService } from "../constants-service/constants.service";

@Injectable()
export class HttpHeadersInterceptor implements HttpInterceptor {
  authenticationService = inject(AuthenticationService);
  constantsService = inject(ConstantsService);

  /**
   * Add Authorization header to requests towards server URL if the user is logged in.
   */
  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const setHeaders: Record<string, string> = {};
    setHeaders["Accept"] ??= "application/json";
    if (req.method === "POST" || req.method === "PUT") {
      setHeaders["Content-Type"] ??= "application/json";
    }
    if (this.authenticationService.isUserLoggedIn() && req.url.startsWith(this.constantsService.getServerUrl())) {
      setHeaders["Authorization"] = "Bearer " + this.authenticationService.currentAuthor?.accessToken;
    }
    req = req.clone({ setHeaders });
    return next.handle(req);
  }
}
