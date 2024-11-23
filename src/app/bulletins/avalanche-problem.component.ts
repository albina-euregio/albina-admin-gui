import { Component, Input, input, output } from "@angular/core";
import { BulletinModel } from "../models/bulletin.model";
import { BulletinDaytimeDescriptionModel } from "../models/bulletin-daytime-description.model";
import { AccordionModule } from "ngx-bootstrap/accordion";
import { NgIf } from "@angular/common";
import { AvalancheProblemPreviewComponent } from "./avalanche-problem-preview.component";
import { AvalancheProblemDetailComponent } from "./avalanche-problem-detail.component";

@Component({
  selector: "app-avalanche-problem",
  templateUrl: "avalanche-problem.component.html",
  standalone: true,
  imports: [AccordionModule, NgIf, AvalancheProblemPreviewComponent, AvalancheProblemDetailComponent],
})
export class AvalancheProblemComponent {
  readonly bulletinModel = input<BulletinModel>(undefined);
  @Input() bulletinDaytimeDescription: BulletinDaytimeDescriptionModel;
  readonly afternoon = input<boolean>(undefined);
  readonly disabled = input<boolean>(undefined);
  readonly changeAvalancheProblemEvent = output<string>();

  constructor() {}

  changeAvalancheProblemDetail(event) {
    this.changeAvalancheProblemEvent.emit();
  }

  changeAvalancheProblemPreview(event) {
    this.changeAvalancheProblemEvent.emit();
  }
}
