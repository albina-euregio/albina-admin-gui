import { Directive, ElementRef, OnDestroy, OnInit, input } from "@angular/core";
import Mousetrap from "mousetrap";

const MOUSETRAP = new Mousetrap();

@Directive({
  standalone: true,
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: "[ngxMousetrapKey]",
})
export class NgxMousetrapDirective implements OnInit, OnDestroy {
  // list of hot key combination for this element.
  readonly ngxMousetrapKey = input<string>(undefined);

  constructor(private elementRef: ElementRef) {}

  ngOnInit() {
    const ngxMousetrapKey = this.ngxMousetrapKey();
    if (!ngxMousetrapKey) {
      return;
    }
    const nativeElement: HTMLElement = this.elementRef.nativeElement;

    const title = nativeElement.getAttribute("title") || "";
    nativeElement.setAttribute("title", `${title} [${ngxMousetrapKey}]`.trim());

    MOUSETRAP.bind(ngxMousetrapKey, (event) => nativeElement.dispatchEvent(new MouseEvent("click")));
  }

  ngOnDestroy() {
    const ngxMousetrapKey = this.ngxMousetrapKey();
    if (!ngxMousetrapKey) {
      return;
    }
    MOUSETRAP.unbind(ngxMousetrapKey);
  }
}
