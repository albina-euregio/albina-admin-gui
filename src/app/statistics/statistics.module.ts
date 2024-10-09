import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";

import { StatisticsComponent } from "./statistics.component";

import { StatisticsRoutingModule } from "./statistics-routing.module";
import { TranslateModule } from "@ngx-translate/core";

import { AlertModule } from "ngx-bootstrap/alert";
import { TabsModule } from "ngx-bootstrap/tabs";
import { AccordionModule } from "ngx-bootstrap/accordion";
import { BsDatepickerModule } from "ngx-bootstrap/datepicker";

@NgModule({
  imports: [
    StatisticsRoutingModule,
    FormsModule,
    CommonModule,
    TranslateModule,
    AccordionModule,
    AlertModule.forRoot(),
    TabsModule,
    BsDatepickerModule.forRoot(),
    StatisticsComponent,
  ],
})
export class StatisticsModule {}
