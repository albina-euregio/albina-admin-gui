import { NgModule } from "@angular/core";
import { AspectsComponent } from "./aspects.component";
import { AvalancheProblemIconsComponent } from "./avalanche-problem-icons.component";
import { AvalancheTypeComponent } from "./avalanche-type.component";
import { DangerRatingIconComponent } from "./danger-rating-icon.component";
import { DangerRatingComponent } from "./danger-rating.component";
import { MatrixParameterComponent } from "./matrix-parameter.component";
import { MatrixComponent } from "./matrix.component";

import { TranslateModule } from "@ngx-translate/core";
import { NgxSliderModule } from "@angular-slider/ngx-slider";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";

@NgModule({
  imports: [TranslateModule, NgxSliderModule, FormsModule, CommonModule],
  declarations: [
    AspectsComponent,
    AvalancheProblemIconsComponent,
    AvalancheTypeComponent,
    DangerRatingComponent,
    DangerRatingIconComponent,
    MatrixParameterComponent,
    MatrixComponent,
  ],
  exports: [
    AspectsComponent,
    AvalancheProblemIconsComponent,
    AvalancheTypeComponent,
    DangerRatingComponent,
    DangerRatingIconComponent,
    MatrixParameterComponent,
    MatrixComponent,
  ],
})
export class SharedModule {}
