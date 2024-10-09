import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";

import { BulletinsComponent } from "./bulletins.component";
import { CreateBulletinComponent } from "./create-bulletin.component";
import { AvalancheBulletinComponent } from "./avalanche-bulletin.component";
import { AvalancheProblemComponent } from "./avalanche-problem.component";
import { AvalancheProblemDetailComponent } from "./avalanche-problem-detail.component";
import { AvalancheProblemDecisionTreeComponent } from "./avalanche-problem-decision-tree.component";
import { AvalancheProblemPreviewComponent } from "./avalanche-problem-preview.component";
import { CaamlComponent } from "./caaml.component";
import { JsonComponent } from "./json.component";

// Bulletins Routing
import { BulletinsRoutingModule } from "./bulletins-routing.module";
import { TranslateModule } from "@ngx-translate/core";

// Pipes
import { HtmlPipe } from "./html.pipe";

// Bootstrap ngx
import { AccordionModule } from "ngx-bootstrap/accordion";
import { BsDropdownModule } from "ngx-bootstrap/dropdown";
import { BulletinTextComponent } from "./bulletin-text.component";
import { TeamStressLevelsComponent } from "./team-stress-levels.component";
import { NgxEchartsDirective } from "ngx-echarts";
import { AvalancheProblemIconsComponent } from "../shared/avalanche-problem-icons.component";

@NgModule({
  imports: [
    AvalancheProblemIconsComponent,
    BulletinsRoutingModule,
    FormsModule,
    CommonModule,
    TranslateModule,
    AccordionModule.forRoot(),
    BsDropdownModule.forRoot(),
    NgxEchartsDirective,
    BulletinsComponent,
    CreateBulletinComponent,
    AvalancheBulletinComponent,
    BulletinTextComponent,
    AvalancheProblemComponent,
    AvalancheProblemDetailComponent,
    AvalancheProblemDecisionTreeComponent,
    AvalancheProblemPreviewComponent,
    CaamlComponent,
    JsonComponent,
    HtmlPipe,
    TeamStressLevelsComponent,
  ],
  exports: [],
})
export class BulletinsModule {}
