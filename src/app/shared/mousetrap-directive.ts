import { Directive, ElementRef, OnDestroy, OnInit, input, inject } from "@angular/core";
import Mousetrap from "mousetrap";

const MOUSETRAP = new Mousetrap();

@Directive({
  standalone: true,
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: "[ngxMousetrapKey]",
})
export class NgxMousetrapDirective implements OnInit, OnDestroy {
  private elementRef = inject(ElementRef);

  // list of hot key combination for this element.
  readonly ngxMousetrapKey = input<string[] | string>(undefined);

  ngOnInit() {
    const ngxMousetrapKey = this.ngxMousetrapKey();
    if (!ngxMousetrapKey || ngxMousetrapKey.length === 0) {
      return;
    }
    const nativeElement: HTMLElement = this.elementRef.nativeElement;

    const keyString = ngxMousetrapKey instanceof Array ? ngxMousetrapKey[0] : ngxMousetrapKey;
    const title = nativeElement.getAttribute("title") || "";
    nativeElement.setAttribute("title", `${title} [${keyString}]`.trim());

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
