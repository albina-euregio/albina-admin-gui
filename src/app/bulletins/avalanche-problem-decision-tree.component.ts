import * as Enums from "../enums/enums";
import { Component, inject } from "@angular/core";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { TranslateService, TranslateModule } from "@ngx-translate/core";
import { BsModalRef } from "ngx-bootstrap/modal";

@Component({
  selector: "app-avalanche-problem-decision-tree",
  templateUrl: "avalanche-problem-decision-tree.component.html",
  styleUrls: ["avalanche-problem-decision-tree.component.scss"],
  standalone: true,
  imports: [TranslateModule],
})
export class AvalancheProblemDecisionTreeComponent {
  private bsModalRef = inject(BsModalRef);
  private sanitizer = inject(DomSanitizer);
  private translateService = inject(TranslateService);

  private resultIcons: HTMLElement[];
  private resultLabels: HTMLElement[];
  private resultIconLabelMap = ["9", "10", "8", "7", "6", "5", "4", "3", "2", "1", "0", "11"];
  private resultProblemMap = [
    Enums.AvalancheProblem.wet_snow,
    Enums.AvalancheProblem.no_distinct_avalanche_problem,
    Enums.AvalancheProblem.new_snow,
    Enums.AvalancheProblem.wet_snow,
    Enums.AvalancheProblem.persistent_weak_layers,
    Enums.AvalancheProblem.wet_snow,
    Enums.AvalancheProblem.wind_slab,
    Enums.AvalancheProblem.new_snow,
    Enums.AvalancheProblem.wind_slab,
    Enums.AvalancheProblem.persistent_weak_layers,
    Enums.AvalancheProblem.gliding_snow,
    Enums.AvalancheProblem.cornices,
  ];

  public problem: Enums.AvalancheProblem;
  localizedImage: SafeResourceUrl;

  public constructor() {
    const url = this.translateService.instant("bulletins.create.decisionTree.filepath");
    this.localizedImage = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  resultsInit() {
    // check if layer names are still correct when modifying the decision tree's svgs, also make sure the layers are the same for each language
    const picker = document.getElementById("picker-result");
    const svg = (picker as HTMLObjectElement).contentDocument;
    this.resultIcons = Array.from(svg.getElementById("layer11").children) as HTMLElement[];
    this.resultLabels = Array.from(svg.getElementById("layer12").children) as HTMLElement[];

    const resultsTransparent = () => {
      [...this.resultIcons, ...this.resultLabels].forEach((item) => {
        item.style.cursor = "pointer";
        item.style.opacity = "0.2";
      });
    };

    resultsTransparent();
    for (let i = 0; i < this.resultIcons.length; i++) {
      this.resultIcons[i].addEventListener("click", () => {
        resultsTransparent();
        this.resultIcons[i].style.opacity = "1";
        this.resultLabels[this.resultIconLabelMap[i]].style.opacity = "1";
        this.problem = this.resultProblemMap[i];
      });
    }
    for (let i = 0; i < this.resultLabels.length; i++) {
      this.resultLabels[i].addEventListener("click", () => {
        resultsTransparent();
        this.resultLabels[i].style.opacity = "1";
        this.resultIcons[this.resultIconLabelMap.indexOf(i.toString())].style.opacity = "1";
        this.problem = this.resultProblemMap[this.resultIconLabelMap.indexOf(i.toString())];
      });
    }
  }

  discard() {
    this.problem = undefined;
    this.bsModalRef.hide();
  }

  save() {
    this.bsModalRef.hide();
  }
}
