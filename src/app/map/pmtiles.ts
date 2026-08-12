import { addProtocol } from "maplibre-gl";
import { Protocol } from "pmtiles";

let registered = false;

/**
 * Registers the `pmtiles://` protocol with MapLibre exactly once.
 * Call before creating any map that uses a PMTiles source (base map or aggregated regions).
 */
export function registerPmtilesProtocol(): void {
  if (registered) return;
  const protocol = new Protocol();
  addProtocol("pmtiles", protocol.tile);
  registered = true;
}
