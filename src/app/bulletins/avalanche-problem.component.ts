import { BulletinDaytimeDescriptionModel } from "../models/bulletin-daytime-description.model";
import { BulletinModel } from "../models/bulletin.model";
import { AvalancheProblemDetailComponent } from "./avalanche-problem-detail.component";
import { AvalancheProblemPreviewComponent } from "./avalanche-problem-preview.component";
import { NgIf } from "@angular/common";
import { Component, inject, input, OnInit, output } from "@angular/core";
import { BulletinsService } from "app/providers/bulletins-service/bulletins.service";
import { AccordionModule } from "ngx-bootstrap/accordion";

@Component({
  selector: "app-avalanche-problem",
  templateUrl: "avalanche-problem.component.html",
  standalone: true,
  imports: [AccordionModule, NgIf, AvalancheProblemPreviewComponent, AvalancheProblemDetailComponent],
})
export class AvalancheProblemComponent implements OnInit {
  bulletinsService = inject(BulletinsService);

  readonly bulletinModel = input<BulletinModel>(undefined);
  readonly bulletinDaytimeDescription = input<BulletinDaytimeDescriptionModel>(undefined);
  readonly afternoon = input<boolean>(undefined);
  readonly disabled = input<boolean>(undefined);
  readonly changeAvalancheProblemEvent = output();

  ngOnInit() {
    this.bulletinsService.accordionChanged$.subscribe(({ isOpen, groupName }) => {
      switch (groupName) {
        case "avalancheProblem1":
          this.bulletinDaytimeDescription().isAvalancheProblemOpen[0] = isOpen;
          break;
        case "avalancheProblem2":
          this.bulletinDaytimeDescription().isAvalancheProblemOpen[1] = isOpen;
          break;
        case "avalancheProblem3":
          this.bulletinDaytimeDescription().isAvalancheProblemOpen[2] = isOpen;
          break;
        case "avalancheProblem4":
          this.bulletinDaytimeDescription().isAvalancheProblemOpen[3] = isOpen;
          break;
        case "avalancheProblem5":
          this.bulletinDaytimeDescription().isAvalancheProblemOpen[4] = isOpen;
          break;
        default:
          break;
      }
    });
  }

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
