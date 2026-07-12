import { Map as MlMap } from "maplibre-gl";

/**
 * Bi-directionally mirrors center/zoom/bearing/pitch between two (or more) maps.
 * Replaces `leaflet.sync` for the AM/PM dual-map view. Returns a disposer that
 * detaches the listeners.
 */
export function syncMaps(...maps: MlMap[]): () => void {
  let syncing = false;

  const propagate = (source: MlMap) => {
    if (syncing) return;
    syncing = true;
    const center = source.getCenter();
    const zoom = source.getZoom();
    const bearing = source.getBearing();
    const pitch = source.getPitch();
    for (const other of maps) {
      if (other === source) continue;
      other.jumpTo({ center, zoom, bearing, pitch });
    }
    syncing = false;
  };

  const handlers = maps.map((m) => {
    const handler = () => propagate(m);
    m.on("move", handler);
    return [m, handler] as const;
  });

  return () => handlers.forEach(([m, handler]) => m.off("move", handler));
}
