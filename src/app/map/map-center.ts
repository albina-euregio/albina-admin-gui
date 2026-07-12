import { Map as MlMap } from "maplibre-gl";

export interface MapCenter {
  lng: number;
  lat: number;
  zoom: number;
}

/**
 * Minimal structural view of `LocalStorageService` — kept here so the map helpers
 * stay free of Angular imports. `LocalStorageService` satisfies this shape.
 */
export interface MapCenterStore {
  setMapCenter(center: MapCenter): void;
  observeMapCenter(): { subscribe(next: (center: MapCenter) => void): { unsubscribe(): void } };
}

/**
 * Persists the map center/zoom on `moveend` and re-applies it when another tab
 * updates the stored value. Returns a disposer. Replaces the `dragend zoomend`
 * persistence + `observeMapCenter` subscription in the Leaflet map services.
 */
export function bindMapCenterPersistence(map: MlMap, store: MapCenterStore): () => void {
  const onMoveEnd = () => {
    const { lng, lat } = map.getCenter();
    store.setMapCenter({ lng, lat, zoom: map.getZoom() });
  };
  map.on("moveend", onMoveEnd);
  const subscription = store.observeMapCenter().subscribe((center) => {
    map.jumpTo({ center: [center.lng, center.lat], zoom: center.zoom });
  });
  return () => {
    map.off("moveend", onMoveEnd);
    subscription.unsubscribe();
  };
}
