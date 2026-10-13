import type { FilterSelectionData } from "../observations/filter-selection-data";

/** The selected values of the url-backed filters as one deterministic query string, empty while they select none. */
export function selectionQuery<T>(filters: readonly FilterSelectionData<T>[]): string {
  const pairs = filters
    .filter((f) => f.url)
    .flatMap((f) =>
      f
        .getSelectedValues("selected")
        .map((v) => v.value)
        .sort()
        .map((value) => [f.type, value]),
    );
  return new URLSearchParams(pairs).toString();
}
