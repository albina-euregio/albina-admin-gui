import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  linkedSignal,
  output,
  signal,
  viewChild,
} from "@angular/core";
import { TranslatePipe } from "@ngx-translate/core";
import { isEqual } from "es-toolkit";
import { BsDropdownDirective, BsDropdownModule } from "ngx-bootstrap/dropdown";
import { firstValueFrom } from "rxjs";

import { BAR_CHART_ROWS } from "../observations/bar-chart-layout";
import type { FilterSelectionValue } from "../observations/filter-selection-config";
import { isDateDatetag } from "./dormant-datetags";

@Component({
  selector: "app-dormant-datetags-menu",
  standalone: true,
  imports: [BsDropdownModule, TranslatePipe],
  templateUrl: "dormant-datetags-menu.component.html",
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: "obs-switch-item",
    "[class.is-active]": "changed()",
  },
})
export class DormantDatetagsMenuComponent {
  private httpClient = inject(HttpClient);
  private changeDetectorRef = inject(ChangeDetectorRef);

  readonly values = input.required<FilterSelectionValue[]>();
  readonly dormant = input.required<ReadonlySet<string>>();
  readonly saveUrl = input.required<string>();
  readonly saved = output();
  readonly dropdown = viewChild(BsDropdownDirective);

  readonly isDateDatetag = isDateDatetag;
  readonly hintKey = "awsome.{{active}} active, {{visible}} visible in the chart";
  readonly pending = linkedSignal(() => new Set(this.dormant()));
  readonly opensUp = signal(false);
  readonly saving = signal(false);
  readonly error = signal("");
  readonly activeCount = computed(() => this.values().filter((v) => !this.pending().has(v.value)).length);
  readonly visibleCount = computed(() => Math.min(this.activeCount(), BAR_CHART_ROWS));
  readonly changed = computed(() => !isEqual(this.pending(), this.dormant()));

  /** Listens for Escape before the page's shortcuts do, so that it closes only the open menu. */
  constructor() {
    const escape = (event: KeyboardEvent) => this.closeOnEscape(event);
    document.addEventListener("keydown", escape, true);
    inject(DestroyRef).onDestroy(() => document.removeEventListener("keydown", escape, true));
  }

  /** Closes the open menu on Escape, keeping the key from the page's other shortcuts such as closing the details. */
  private closeOnEscape(event: KeyboardEvent) {
    const dropdown = this.dropdown();
    if (event.key !== "Escape" || !dropdown?.isOpen) return;
    event.stopPropagation();
    dropdown.hide();
  }

  /** Opens the menu upwards when the icon sits in the lower half of the viewport, settled before the click opens it. */
  aim(toggle: HTMLElement) {
    const { top, bottom } = toggle.getBoundingClientRect();
    this.opensUp.set(top + bottom > window.innerHeight);
    this.changeDetectorRef.detectChanges();
  }

  /** Marks a date active or dormant in the pending list. */
  setActive(value: string, active: boolean) {
    const pending = new Set(this.pending());
    if (active) pending.delete(value);
    else pending.add(value);
    this.pending.set(pending);
  }

  /** Marks every date active, or every date dormant. */
  setAllDates(active: boolean) {
    const dates = this.values()
      .map((v) => v.value)
      .filter(isDateDatetag);
    this.pending.set(new Set(active ? [] : dates));
  }

  /** Stores the pending dormant dates newest first and reports success; a failure stays in the menu. */
  async save() {
    this.saving.set(true);
    this.error.set("");
    const dormant = this.values()
      .map((v) => v.value)
      .filter((value) => isDateDatetag(value) && this.pending().has(value));
    try {
      await firstValueFrom(this.httpClient.put(this.saveUrl(), { dormant_datetags: dormant }));
      this.saved.emit();
    } catch (err) {
      this.error.set(err instanceof HttpErrorResponse ? (err.error?.error ?? err.message) : String(err));
      this.saving.set(false);
    }
  }
}
