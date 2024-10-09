import { Component, EventEmitter, Input, Output } from "@angular/core";
import { SettingsService } from "../providers/settings-service/settings.service";
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
  @Input() bulletinModel: BulletinModel;
  @Input() bulletinDaytimeDescription: BulletinDaytimeDescriptionModel;
  @Input() afternoon: boolean;
  @Input() disabled: boolean;
  @Output() changeAvalancheProblemEvent = new EventEmitter<string>();

  constructor(public settingsService: SettingsService) {}

  changeAvalancheProblemDetail(event) {
    this.changeAvalancheProblemEvent.emit();
  }

  changeAvalancheProblemPreview(event) {
    this.changeAvalancheProblemEvent.emit();
  }
}
