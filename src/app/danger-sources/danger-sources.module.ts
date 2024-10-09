import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";

import { DangerSourcesComponent } from "./danger-sources.component";
import { DangerSourceVariantComponent } from "./danger-source-variant.component";
import { CreateDangerSourcesComponent } from "./create-danger-sources.component";

// Bulletins Routing
import { DangerSourcesRoutingModule } from "./danger-sources-routing.module";
import { TranslateModule } from "@ngx-translate/core";
import { NgxSliderModule } from "@angular-slider/ngx-slider";

// Bootstrap ngx
import { AccordionModule } from "ngx-bootstrap/accordion";
import { BsDropdownModule } from "ngx-bootstrap/dropdown";
import { NgxEchartsDirective } from "ngx-echarts";

@NgModule({
  imports: [
    DangerSourcesRoutingModule,
    FormsModule,
    CommonModule,
    TranslateModule,
    AccordionModule.forRoot(),
    BsDropdownModule.forRoot(),
    NgxSliderModule,
    NgxEchartsDirective,
    DangerSourcesComponent,
    DangerSourceVariantComponent,
    CreateDangerSourcesComponent,
  ],
  exports: [],
})
export class DangerSourcesModule {}
