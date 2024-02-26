import { Component, EventEmitter, Input, Output } from "@angular/core";
import { SettingsService } from "../providers/settings-service/settings.service";
import { BulletinModel } from "../models/bulletin.model";
import { BulletinDaytimeDescriptionModel } from "../models/bulletin-daytime-description.model";

@Component({
  selector: "app-avalanche-problem",
  templateUrl: "avalanche-problem.component.html",
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
