import { AuthenticationService } from "../providers/authentication-service/authentication.service";
import { Injectable, inject } from "@angular/core";
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { environment } from "environments/environment";

@Injectable()
export class AuthGuard {
  private router = inject(Router);
  private authService = inject(AuthenticationService);

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    if (this.authService.isUserLoggedIn()) {
      return true;
    } else if (environment.initialUrl) {
      this.router.navigate([environment.initialUrl]);
      return false;
    } else {
      this.router.navigate(["/pages/login"], { queryParams: { returnUrl: state.url } });
      return false;
    }
  }
}
