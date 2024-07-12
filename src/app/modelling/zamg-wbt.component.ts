import { Component } from "@angular/core";

@Component({
  selector: "app-zamg-wbt",
  standalone: true,
  imports: [],
  template: `<iframe
    src="https://portal.tirol.gv.at/at.ac.zamg.wbt-p/"
    style="width: 100%; height: 90vh"
    referrerpolicy="no-referrer"
    allow="fullscreen"
  ></iframe>`,
})
export class ZamgWbtComponent {}
