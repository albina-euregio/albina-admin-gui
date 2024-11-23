import { Directive, ElementRef, Input, OnDestroy, OnInit } from "@angular/core";
import Mousetrap from "mousetrap";

const MOUSETRAP = new Mousetrap();

@Directive({
  standalone: true,
  selector: "[ngxMousetrapKey]",
})
export class NgxMousetrapDirective implements OnInit, OnDestroy {
  // list of hot key combination for this element.
  @Input() ngxMousetrapKey: string;

  constructor(private elementRef: ElementRef) {}

  ngOnInit() {
    if (!this.ngxMousetrapKey) {
      return;
    }
    const nativeElement: HTMLElement = this.elementRef.nativeElement;

    const title = nativeElement.getAttribute("title") || "";
    nativeElement.setAttribute("title", `${title} [${this.ngxMousetrapKey}]`.trim());

    MOUSETRAP.bind(this.ngxMousetrapKey, (event) => nativeElement.dispatchEvent(new MouseEvent("click")));
  }

  ngOnDestroy() {
    if (!this.ngxMousetrapKey) {
      return;
    }
    MOUSETRAP.unbind(this.ngxMousetrapKey);
  }
}
