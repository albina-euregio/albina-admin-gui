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
  readonly ngxMousetrapKey = input<string>(undefined);

  ngOnInit() {
    const ngxMousetrapKey = this.ngxMousetrapKey();
    if (!ngxMousetrapKey) {
      return;
    }
    if (ngxMousetrapKey.includes("ctrl+")) {
      throw new Error("Replace ctrl+ with mod+ for Mac support!");
    }
    const nativeElement: HTMLElement = this.elementRef.nativeElement;

    const keyString = ngxMousetrapKey.replace(
      "mod+",
      /Mac|iPod|iPhone|iPad/.test(navigator.platform)
        ? // metaKey
          "⌘+"
        : // ctrlKey
          "ctrl+",
    );
    const title = nativeElement.getAttribute("title") || "";
    nativeElement.setAttribute("title", `${title} [${keyString}]`.trim());

    MOUSETRAP.bind(ngxMousetrapKey, () => nativeElement.dispatchEvent(new MouseEvent("click")));
  }

  ngOnDestroy() {
    const ngxMousetrapKey = this.ngxMousetrapKey();
    if (!ngxMousetrapKey) {
      return;
    }
    MOUSETRAP.unbind(ngxMousetrapKey);
  }
}
