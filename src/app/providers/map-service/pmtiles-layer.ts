// @ts-nocheck

import * as L from "leaflet";
import { PMTiles } from "pmtiles";
import {
  Labelers,
  LabelRule,
  paint,
  PaintRule,
  PickedFeature,
  PolygonSymbolizer,
  PreparedTile,
  SourceOptions,
  sourcesToViews,
  View,
} from "protomaps-leaflet";

export class BlendModePolygonSymbolizer extends PolygonSymbolizer {
  constructor(
    private blendMode: GlobalCompositeOperation,
    ...args: ConstructorParameters<typeof PolygonSymbolizer>
  ) {
    super(...args);
  }
  before(ctx: CanvasRenderingContext2D, z: number): void {
    ctx.globalCompositeOperation = this.blendMode;
    super.before(ctx, z);
  }
}

const timer = (duration: number) => {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      resolve();
    }, duration);
  });
};

interface LeafletLayerOptions extends L.LayerOptions {
  bounds?: number[][];
  attribution?: string;
  debug?: string;
  lang?: string;
  tileDelay?: number;
  language?: string[];
  noWrap?: boolean;
  paintRules?: PaintRule[];
  labelRules?: LabelRule[];
  maxDataZoom?: number;
  url?: PMTiles | string;
  sources?: Record<string, SourceOptions>;
  theme?: string;
  backgroundColor?: string;
}

export class PmLeafletLayer extends L.GridLayer {
  backgroundColor: string | undefined;
  labelers: Labelers;
  labelRules: LabelRule[];
  lang: string | undefined;
  lastRequestedZ: number | undefined;
  onTilesInvalidated: (tiles: Set<string>) => void;
  paintRules: PaintRule[];
  scratch: CanvasRenderingContext2D;
  tileDelay: number;
  tileSize: number;
  views: Map<string, View>;

  constructor(options: LeafletLayerOptions = {}) {
    if (options.noWrap && !options.bounds)
      options.bounds = [
        [-90, -180],
        [90, 180],
      ];
    if (options.attribution == null)
      options.attribution =
        '<a href="https://protomaps.com">Protomaps</a> © <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>';
    super(options);

    this.paintRules = options.paintRules || [];
    this.labelRules = options.labelRules || [];
    this.backgroundColor = options.backgroundColor;

    this.lastRequestedZ = undefined;

    this.views = sourcesToViews(options);

    this.scratch = document.createElement("canvas").getContext("2d")!;
    this.onTilesInvalidated = (tiles: Set<string>) => {
      for (const t of tiles) {
        this.rerenderTile(t);
      }
    };
    this.labelers = new Labelers(this.scratch, this.labelRules, 16, this.onTilesInvalidated);
    this.tileSize = 256 * window.devicePixelRatio;
    this.tileDelay = options.tileDelay || 3;
    this.lang = options.lang;
  }

  public async renderTile(
    coords: L.Coords,
    element: HTMLCanvasElement & { key: string },
    key: string,
    done = () => {},
  ) {
    this.lastRequestedZ = coords.z;

    const promises = [] as { key: string; promise: Promise<PreparedTile> }[];
    for (const [k, v] of this.views) {
      const promise = v.getDisplayTile(coords);
      promises.push({ key: k, promise: promise });
    }
    const tileResponses = await Promise.all(
      promises.map((o) =>
        o.promise.then(
          (v: PreparedTile) => ({ status: "fulfilled", value: v, key: o.key }) as const,
          (error: Error) => ({ status: "rejected", reason: error, key: o.key }) as const,
        ),
      ),
    );

    const preparedTilemap = new Map<string, PreparedTile[]>();
    for (const tileResponse of tileResponses) {
      if (tileResponse.status === "fulfilled") {
        preparedTilemap.set(tileResponse.key, [tileResponse.value]);
      } else {
        if (tileResponse.reason.name === "AbortError") {
          // do nothing
        } else {
          console.error(tileResponse.reason);
        }
      }
    }

    if (element.key !== key) return;
    if (this.lastRequestedZ !== coords.z) return;

    if (element.key !== key) return;
    if (this.lastRequestedZ !== coords.z) return;

    this.labelers.add(coords.z, preparedTilemap);

    if (element.key !== key) return;
    if (this.lastRequestedZ !== coords.z) return;

    const labelData = this.labelers.getIndex(coords.z);

    if (!this._map) return; // the layer has been removed from the map

    const center = this._map.getCenter().wrap();
    const pixelBounds = this._getTiledPixelBounds(center);
    const tileRange = this._pxBoundsToTileRange(pixelBounds);
    const tileCenter = tileRange.getCenter();
    const priority = coords.distanceTo(tileCenter) * this.tileDelay;

    await timer(priority);

    if (element.key !== key) return;
    if (this.lastRequestedZ !== coords.z) return;

    const buf = 16;
    const bbox = {
      minX: 256 * coords.x - buf,
      minY: 256 * coords.y - buf,
      maxX: 256 * (coords.x + 1) + buf,
      maxY: 256 * (coords.y + 1) + buf,
    };
    const origin = new L.Point(256 * coords.x, 256 * coords.y);

    element.width = this.tileSize;
    element.height = this.tileSize;
    const ctx = element.getContext("2d");
    if (!ctx) {
      console.error("Failed to get Canvas context");
      return;
    }
    ctx.setTransform(this.tileSize / 256, 0, 0, this.tileSize / 256, 0, 0);
    ctx.clearRect(0, 0, 256, 256);

    if (this.backgroundColor) {
      ctx.save();
      ctx.fillStyle = this.backgroundColor;
      ctx.fillRect(0, 0, 256, 256);
      ctx.restore();
    }

    let paintingTime = 0;

    const paintRules = this.paintRules;

    paintingTime = paint(
      ctx,
      coords.z,
      preparedTilemap,
      this.xray ? null : labelData,
      paintRules,
      bbox,
      origin,
      false,
      this.debug,
    );

    done();
  }

  public rerenderTile(key: string) {
    for (const unwrappedK in this._tiles) {
      const wrappedCoord = this._wrapCoords(this._keyToTileCoords(unwrappedK));
      if (key === this._tileCoordsToKey(wrappedCoord)) {
        this.renderTile(wrappedCoord, this._tiles[unwrappedK].el, key);
      }
    }
  }

  // a primitive way to check the features at a certain point.
  // it does not support hover states, cursor changes, or changing the style of the selected feature,
  // so is only appropriate for debuggging or very basic use cases.
  // those features are outside of the scope of this library:
  // for fully pickable, interactive features, use MapLibre GL JS instead.
  public queryTileFeaturesDebug(lng: number, lat: number, brushSize = 16): Map<string, PickedFeature[]> {
    const featuresBySourceName = new Map<string, PickedFeature[]>();
    for (const [sourceName, view] of this.views) {
      featuresBySourceName.set(sourceName, view.queryFeatures(lng, lat, this._map.getZoom(), brushSize));
    }
    return featuresBySourceName;
  }

  public clearLayout() {
    this.labelers = new Labelers(this.scratch, this.labelRules, 16, this.onTilesInvalidated);
  }

  public rerenderTiles() {
    for (const unwrappedK in this._tiles) {
      const wrappedCoord = this._wrapCoords(this._keyToTileCoords(unwrappedK));
      const key = this._tileCoordsToKey(wrappedCoord);
      this.renderTile(wrappedCoord, this._tiles[unwrappedK].el, key);
    }
  }

  public createTile(coords: L.Coords, showTile: L.DoneCallback) {
    const element = L.DomUtil.create("canvas", "leaflet-tile") as HTMLCanvasElement & { key: string };
    element.lang = this.lang;

    const key = this._tileCoordsToKey(coords);
    element.key = key;

    this.renderTile(coords, element, key, () => {
      showTile(undefined, element);
    });

    return element;
  }

  public _removeTile(key: string) {
    const tile = this._tiles[key];
    if (!tile) {
      return;
    }
    tile.el.removed = true;
    tile.el.key = undefined;
    L.DomUtil.removeClass(tile.el, "leaflet-tile-loaded");
    tile.el.width = tile.el.height = 0;
    L.DomUtil.remove(tile.el);
    delete this._tiles[key];
    this.fire("tileunload", {
      tile: tile.el,
      coords: this._keyToTileCoords(key),
    });
  }

  public getLayers() {
    // fixme
    return [];
  }

  public resetStyle() {
    // fixme
  }
}
