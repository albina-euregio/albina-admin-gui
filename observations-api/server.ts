import * as observations from "./src/pages/observations";
import * as observationsFetchSnobs from "./src/pages/observations-fetch-snobs";
import * as observationsSyncImages from "./src/pages/observations-sync-images";
import * as observers from "./src/pages/observers";
import * as weatherStations from "./src/pages/weather-stations";
import * as webcams from "./src/pages/webcams";
import * as widgetAlpsolut from "./src/pages/widget.alpsolut.eu";

const server = Bun.serve({
  routes: {
    "/observations": observations,
    "/observations-fetch-snobs": observationsFetchSnobs,
    "/observations-sync-images": observationsSyncImages,
    "/observers": observers,
    "/weather-stations": weatherStations,
    "/webcams": webcams,
    "/widget.alpsolut.eu": widgetAlpsolut,
  },
});
console.log(`Running observations-api on ${server.hostname}:${server.port}`);
