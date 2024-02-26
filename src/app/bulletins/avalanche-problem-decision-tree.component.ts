import { Component } from "@angular/core";
import { TranslateService } from "@ngx-translate/core";
import { DynamicDialogRef } from "primeng/dynamicdialog";
import * as Enums from "../enums/enums";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";

@Component({
  selector: "app-avalanche-problem-decision-tree",
  templateUrl: "avalanche-problem-decision-tree.component.html",
  styleUrls: ["avalanche-problem-decision-tree.component.scss"],
})
export class AvalancheProblemDecisionTreeComponent {
  private resultIcons: HTMLElement[];
  private resultLabels: HTMLElement[];
  private resultIconLabelMap = ["9", "10", "8", "7", "6", "5", "4", "3", "2", "1", "0", "11"];
  private resultProblemMap = [
    Enums.AvalancheProblem.wet_snow,
    Enums.AvalancheProblem.no_distinct_problem,
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

  private problem: Enums.AvalancheProblem;
  localizedImage: SafeResourceUrl;

  public constructor(
    private dialogRef: DynamicDialogRef,
    private sanitizer: DomSanitizer,
    private translateService: TranslateService,
  ) {
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
        this.save();
      });
    }
    for (let i = 0; i < this.resultLabels.length; i++) {
      this.resultLabels[i].addEventListener("click", () => {
        resultsTransparent();
        this.resultLabels[i].style.opacity = "1";
        this.resultIcons[this.resultIconLabelMap.indexOf(i.toString())].style.opacity = "1";
        this.problem = this.resultProblemMap[this.resultIconLabelMap.indexOf(i.toString())];
        this.save();
      });
    }
  }

  discard() {
    this.dialogRef.close();
  }

  save() {
    this.dialogRef.close({ problem: this.problem });
  }
}
