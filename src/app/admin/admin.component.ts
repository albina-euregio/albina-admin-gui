import { BlogComponent } from "./blog.component";
import { RegionsConfigurationComponent } from "./regions-configuration.component";
import { ServersConfigurationComponent } from "./servers-configuration.component";
import { UsersComponent } from "./users.component";
import { Component } from "@angular/core";
import { TranslateModule } from "@ngx-translate/core";
import { TabsModule } from "ngx-bootstrap/tabs";

@Component({
  templateUrl: "admin.component.html",
  standalone: true,
  imports: [
    TabsModule,
    ServersConfigurationComponent,
    RegionsConfigurationComponent,
    UsersComponent,
    BlogComponent,
    TranslateModule,
  ],
})
export class AdminComponent {}
