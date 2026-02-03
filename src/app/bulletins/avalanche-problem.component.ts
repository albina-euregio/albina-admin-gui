import { BulletinDaytimeDescriptionModel } from "../models/bulletin-daytime-description.model";
import { BulletinModel } from "../models/bulletin.model";
import { AvalancheProblemDetailComponent } from "./avalanche-problem-detail.component";
import { AvalancheProblemPreviewComponent } from "./avalanche-problem-preview.component";
import { Component, inject, input, output } from "@angular/core";
import { BulletinsService } from "app/providers/bulletins-service/bulletins.service";
import { AccordionModule } from "ngx-bootstrap/accordion";

@Component({
  selector: "app-avalanche-problem",
  templateUrl: "avalanche-problem.component.html",
  standalone: true,
  imports: [AccordionModule, AvalancheProblemPreviewComponent, AvalancheProblemDetailComponent],
})
export class AvalancheProblemComponent {
  bulletinsService = inject(BulletinsService);

  readonly bulletinModel = input<BulletinModel>(undefined);
  readonly bulletinDaytimeDescription = input<BulletinDaytimeDescriptionModel>(undefined);
  readonly comparedBulletinDaytimeDescription = input<BulletinDaytimeDescriptionModel>(undefined);
  readonly isComparedBulletin = input<boolean>(undefined);
  readonly afternoon = input<boolean>(undefined);
  readonly disabled = input<boolean>(undefined);
  readonly changeAvalancheProblemEvent = output();

  changeAvalancheProblemDetail() {
    this.changeAvalancheProblemEvent.emit();
  }

  changeAvalancheProblemPreview() {
    this.changeAvalancheProblemEvent.emit();
  }

  accordionChanged(isOpen: boolean, groupName: string) {
    this.bulletinsService.emitAccordionChanged({ isOpen, groupName });
  }
}
