import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { TranslateModule } from "@ngx-translate/core";
import { CommonModule } from "@angular/common";

import { P404Component } from "./404.component";
import { P500Component } from "./500.component";
import { LoginComponent } from "./login.component";

import { PagesRoutingModule } from "./pages-routing.module";

@NgModule({
  imports: [PagesRoutingModule, FormsModule, TranslateModule, CommonModule],
  declarations: [P404Component, P500Component, LoginComponent],
})
export class PagesModule {}
