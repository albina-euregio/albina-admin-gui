import { Component } from "@angular/core";

@Component({
  selector: "app-zamg-wbt",
  standalone: true,
  imports: [],
  template: `
    <a
      href="https://portal.tirol.gv.at/at.ac.zamg.wbt-p/"
      class="btn btn-success btn-lg position-absolute top-50 start-50 translate-middle"
    >
      Wetterinformationsportal © ZAMG
    </a>
  `,
})
export class ZamgWbtComponent {}
