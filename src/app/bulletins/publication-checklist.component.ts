import { DatePipe } from "@angular/common";
import { Component, inject, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { TranslateModule, TranslateService } from "@ngx-translate/core";
import { BulletinsService } from "app/providers/bulletins-service/bulletins.service";

export interface ChecklistItem {
  title: string;
  link?: string;
  description: string;
  ok: boolean;
  problem: boolean;
  problemDescription: string;
}

@Component({
  templateUrl: "publication-checklist.component.html",
  standalone: true,
  imports: [DatePipe, TranslateModule],
})
export class PublicationChecklistComponent implements OnInit {
  private activeRoute = inject(ActivatedRoute);
  bulletinsService = inject(BulletinsService);
  translateService = inject(TranslateService);

  date = "";
  checklistItems: ChecklistItem[] = [];

  private createChecklistItems(date: string): ChecklistItem[] {
    return [
      {
        title: "Website",
        description: "bulletins.publicationChecklist.descWebsite",
        link: `https://lawinen.report/bulletin/${date}`,
        ok: false,
        problem: false,
        problemDescription: "",
      },
      {
        title: "Email",
        description: "bulletins.publicationChecklist.descEmail",
        ok: false,
        problem: false,
        problemDescription: "",
      },
      {
        title: "WhatsApp",
        description: "bulletins.publicationChecklist.descMessage",
        link: "https://www.whatsapp.com/channel/0029Vb9EFivJUM2ShOiocj3h",
        ok: false,
        problem: false,
        problemDescription: "",
      },
      {
        title: "Telegram",
        description: "bulletins.publicationChecklist.descMessage",
        link: "https://t.me/s/lawinenwarndienst_tirol",
        ok: false,
        problem: false,
        problemDescription: "",
      },
    ];
  }

  onOkChange(index: number, event: Event) {
    const item = this.checklistItems[index];
    const isOk = (event.target as HTMLInputElement).checked;
    item.ok = isOk;
    if (isOk) {
      item.problem = false;
    }
  }

  onProblemChange(index: number, event: Event) {
    const item = this.checklistItems[index];
    const hasProblem = (event.target as HTMLInputElement).checked;
    item.problem = hasProblem;
    if (hasProblem) {
      item.ok = false;
      return;
    }

    item.problemDescription = "";
  }

  onProblemDescriptionChange(index: number, event: Event) {
    this.checklistItems[index].problemDescription = (event.target as HTMLInputElement).value;
  }

  ngOnInit() {
    this.activeRoute.params.subscribe(({ date }) => {
      this.date = date;
      this.checklistItems = this.createChecklistItems(date);
      this.bulletinsService.sourceDates.setActiveDate(date);
    });
  }
}
