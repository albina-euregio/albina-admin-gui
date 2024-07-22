import { NgModule } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";

import { BulletinsComponent } from "./bulletins.component";
import { CreateBulletinComponent } from "./create-bulletin.component";
import { AvalancheBulletinComponent } from "./avalanche-bulletin.component";
import { AspectsComponent } from "./aspects.component";
import { DangerRatingComponent } from "./danger-rating.component";
import { DangerRatingIconComponent } from "./danger-rating-icon.component";
import { AvalancheProblemComponent } from "./avalanche-problem.component";
import { AvalancheProblemDetailComponent } from "./avalanche-problem-detail.component";
import { AvalancheProblemDecisionTreeComponent } from "./avalanche-problem-decision-tree.component";
import { AvalancheProblemPreviewComponent } from "./avalanche-problem-preview.component";
import { MatrixComponent } from "./matrix.component";
import { MatrixParameterComponent } from "./matrix-parameter.component";
import { CaamlComponent } from "./caaml.component";
import { JsonComponent } from "./json.component";
import { AvalancheProblemIconsComponent } from "./avalanche-problem-icons.component";

// Bulletins Routing
import { BulletinsRoutingModule } from "./bulletins-routing.module";
import { TranslateModule } from "@ngx-translate/core";
import { NgxSliderModule } from "@angular-slider/ngx-slider";

// Pipes
import { HtmlPipe } from "./html.pipe";

// Bootstrap ngx
import { AccordionModule } from "ngx-bootstrap/accordion";
import { BsDropdownModule } from "ngx-bootstrap/dropdown";
import { BulletinTextComponent } from "./bulletin-text.component";

@NgModule({
  imports: [
    BulletinsRoutingModule,
    FormsModule,
    CommonModule,
    TranslateModule,
    AccordionModule.forRoot(),
    BsDropdownModule.forRoot(),
    NgxSliderModule,
  ],
  exports: [AspectsComponent],
  declarations: [
    BulletinsComponent,
    CreateBulletinComponent,
    AvalancheBulletinComponent,
    BulletinTextComponent,
    AspectsComponent,
    DangerRatingComponent,
    DangerRatingIconComponent,
    AvalancheProblemComponent,
    AvalancheProblemDetailComponent,
    AvalancheProblemDecisionTreeComponent,
    AvalancheProblemPreviewComponent,
    MatrixComponent,
    MatrixParameterComponent,
    CaamlComponent,
    JsonComponent,
    AvalancheProblemIconsComponent,
    HtmlPipe,
  ],
})
export class BulletinsModule {}
