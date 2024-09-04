import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";

import { AdminComponent } from "./admin.component";
import { ServersConfigurationComponent } from "./servers-configuration.component";
import { ServerConfigurationComponent } from "./server-configuration.component";
import { RegionsConfigurationComponent } from "./regions-configuration.component";
import { RegionConfigurationComponent } from "./region-configuration.component";
import { UsersComponent } from "./users.component";
import { BlogComponent } from "./blog.component";

import { AdminRoutingModule } from "./admin-routing.module";
import { TranslateModule } from "@ngx-translate/core";

import { AlertModule } from "ngx-bootstrap/alert";
import { TabsModule } from "ngx-bootstrap/tabs";
import { AccordionModule } from "ngx-bootstrap/accordion";
import { BsDatepickerModule } from "ngx-bootstrap/datepicker";

@NgModule({
  imports: [
    AdminRoutingModule,
    FormsModule,
    CommonModule,
    TranslateModule,
    AccordionModule,
    AlertModule.forRoot(),
    TabsModule,
    BsDatepickerModule.forRoot(),
  ],
  declarations: [
    AdminComponent,
    ServersConfigurationComponent,
    ServerConfigurationComponent,
    RegionsConfigurationComponent,
    RegionConfigurationComponent,
    UsersComponent,
    BlogComponent,
  ],
})
export class AdminModule {}
