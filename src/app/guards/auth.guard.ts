import { Injectable, inject } from "@angular/core";
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from "@angular/router";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";

@Injectable()
export class AuthGuard {
  private router = inject(Router);
  private authService = inject(AuthenticationService);

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    if (this.authService.isUserLoggedIn()) {
      return true;
    } else {
      this.router.navigate(["/pages/login"], { queryParams: { returnUrl: state.url } });
      return false;
    }
  }
}
