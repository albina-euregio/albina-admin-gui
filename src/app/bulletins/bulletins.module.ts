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
import { TabsComponent } from "./tabs.component";
import { TabComponent } from "./tab.component";
import { AvalancheProblemIconsComponent } from './avalanche-problem-icons/avalanche-problem-icons.component';

// Bulletins Routing
import { BulletinsRoutingModule } from "./bulletins-routing.module";
import { TranslateModule } from "@ngx-translate/core";
import { ConfirmDialogModule } from "primeng/confirmdialog";
import { NgxSliderModule } from '../ngx-slider/lib/slider.module';

// Pipes
import { PipeModule } from "../pipes/pipes.module";
import { DatePipe } from "@angular/common";

// Bootstrap ngx
import { AccordionModule } from "ngx-bootstrap/accordion";
import { BsDropdownModule } from 'ngx-bootstrap/dropdown';
import { DialogModule } from "primeng/dialog";
import { MapService } from "../providers/map-service/map.service";


@NgModule({
    imports: [
        BulletinsRoutingModule,
        FormsModule,
        CommonModule,
        TranslateModule,
        ConfirmDialogModule,
        PipeModule.forRoot(),
        AccordionModule.forRoot(),
        BsDropdownModule.forRoot(),
        NgxSliderModule,
        DialogModule
    ],
    exports: [
        AspectsComponent
    ],
    declarations: [
        BulletinsComponent,
        CreateBulletinComponent,
        AvalancheBulletinComponent,
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
        TabsComponent,
        TabComponent,
        AvalancheProblemIconsComponent
    ],
    providers: [DatePipe, MapService]
})
export class BulletinsModule { }
