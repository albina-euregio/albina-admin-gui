import { Component } from "@angular/core";
import { TabsModule } from "ngx-bootstrap/tabs";
import { ServersConfigurationComponent } from "./servers-configuration.component";
import { RegionsConfigurationComponent } from "./regions-configuration.component";
import { UsersComponent } from "./users.component";
import { BlogComponent } from "./blog.component";
import { TranslateModule } from "@ngx-translate/core";

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
export class AdminComponent {
  constructor() {}
}
