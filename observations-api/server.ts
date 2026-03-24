import * as observations from "./src/pages/observations";
import * as observationsFetchSnobs from "./src/pages/observations-fetch-snobs";
import * as observationsSyncImages from "./src/pages/observations-sync-images";
import * as observers from "./src/pages/observers";
import * as weatherStations from "./src/pages/weather-stations";
import * as widgetAlpsolut from "./src/pages/widget.alpsolut.eu";

Bun.serve({
  port: 3000,
  routes: {
    "/observations": observations,
    "/observations-fetch-snobs": observationsFetchSnobs,
    "/observations-sync-images": observationsSyncImages,
    "/observers": observers,
    "/weather-stations": weatherStations,
    "/widget.alpsolut.eu": widgetAlpsolut,
  },
});
