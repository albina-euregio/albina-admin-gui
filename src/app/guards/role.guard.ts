import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";

import * as Enums from "../enums/enums";
import { AuthenticationService } from "../providers/authentication-service/authentication.service";

/** Allows the route only if the effective role is one of `roles`, otherwise redirects to the bulletins. */
export function roleGuard(...roles: (keyof typeof Enums.UserRole)[]): CanActivateFn {
  return () =>
    inject(AuthenticationService).isCurrentUserInRole(...roles) || inject(Router).createUrlTree(["/bulletins"]);
}
