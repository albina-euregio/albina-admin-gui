import { BulletinDaytimeDescriptionModel } from "../models/bulletin-daytime-description.model";
import { BulletinModel } from "../models/bulletin.model";
import { AvalancheProblemDetailComponent } from "./avalanche-problem-detail.component";
import { AvalancheProblemPreviewComponent } from "./avalanche-problem-preview.component";
import { NgIf } from "@angular/common";
import { Component, input, output } from "@angular/core";
import { AccordionModule } from "ngx-bootstrap/accordion";

@Component({
  selector: "app-avalanche-problem",
  templateUrl: "avalanche-problem.component.html",
  standalone: true,
  imports: [AccordionModule, NgIf, AvalancheProblemPreviewComponent, AvalancheProblemDetailComponent],
})
export class AvalancheProblemComponent {
  readonly bulletinModel = input<BulletinModel>(undefined);
  readonly bulletinDaytimeDescription = input<BulletinDaytimeDescriptionModel>(undefined);
  readonly afternoon = input<boolean>(undefined);
  readonly disabled = input<boolean>(undefined);
  readonly changeAvalancheProblemEvent = output();

  changeAvalancheProblemDetail() {
    this.changeAvalancheProblemEvent.emit();
  }

  changeAvalancheProblemPreview() {
    this.changeAvalancheProblemEvent.emit();
  }
}
