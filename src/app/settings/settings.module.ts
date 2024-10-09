import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";

import { SettingsComponent } from "./settings.component";

import { SettingsRoutingModule } from "./settings-routing.module";
import { TranslateModule } from "@ngx-translate/core";

import { AlertModule } from "ngx-bootstrap/alert";
import { PasswordMismatchValidatorDirective } from "./password-mismatch.directive";
import { Password2MismatchValidatorDirective } from "./password2-mismatch.directive";

@NgModule({
  imports: [
    SettingsRoutingModule,
    FormsModule,
    CommonModule,
    TranslateModule,
    AlertModule.forRoot(),
    SettingsComponent,
    PasswordMismatchValidatorDirective,
    Password2MismatchValidatorDirective,
  ],
})
export class SettingsModule {}
