import { Component, inject } from "@angular/core";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { AuthenticationService } from "app/providers/authentication-service/authentication.service";

@Component({
  templateUrl: "education.component.html",
  standalone: true,
})
export class EducationComponent {
  readonly authenticationService = inject(AuthenticationService);
  private sanitizer = inject(DomSanitizer);

  get educationUrl(): SafeResourceUrl {
    const educationUrl = this.authenticationService.getActiveRegion()?.educationUrl;
    return educationUrl ? this.sanitizer.bypassSecurityTrustResourceUrl(educationUrl) : undefined;
  }
}
