import { Component, ChangeDetectionStrategy } from "@angular/core";
import { TranslatePipe } from "@ngx-translate/core";
import { TabsModule } from "ngx-bootstrap/tabs";

import { BlogComponent } from "./blog.component";
import { RegionsConfigurationComponent } from "./regions-configuration.component";
import { ServersConfigurationComponent } from "./servers-configuration.component";
import { UsersComponent } from "./users.component";

@Component({
  templateUrl: "admin.component.html",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [
    TabsModule,
    ServersConfigurationComponent,
    RegionsConfigurationComponent,
    UsersComponent,
    BlogComponent,
    TranslatePipe,
  ],
})
export class AdminComponent {}
