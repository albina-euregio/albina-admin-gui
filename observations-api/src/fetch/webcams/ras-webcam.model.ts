import { type GenericObservation, ObservationSource, ObservationType } from "../../generic-observation";

// https://www.ras.bz.it/de/webcams/
export const webcams = [
  {
    position: { lat: 46.6041, lng: 11.509 },
    detailPage: "https://www.ras.bz.it/de/webcams/barbian/",
    title: "Barbian",
  },
  {
    position: { lat: 46.9952, lng: 11.9343 },
    detailPage: "https://www.ras.bz.it/de/webcams/blossenberg/",
    title: "Blossenberg",
  },
  {
    position: { lat: 46.4821, lng: 11.3301 },
    detailPage: "https://www.ras.bz.it/de/webcams/bozen/",
    title: "Bozen",
  },
  {
    position: { lat: 46.6981, lng: 11.9119 },
    detailPage: "https://www.ras.bz.it/de/webcams/enneberg/",
    title: "Enneberg",
  },
  {
    position: { lat: 46.2746, lng: 11.1738 },
    detailPage: "https://www.ras.bz.it/de/webcams/fennberg/",
    title: "Fennberg",
  },
  {
    position: { lat: 46.876, lng: 11.4268 },
    detailPage: "https://www.ras.bz.it/de/webcams/freienfeld/",
    title: "Freienfeld",
  },
  {
    position: { lat: 46.9392, lng: 11.4557 },
    detailPage: "https://www.ras.bz.it/de/webcams/gossensass/",
    title: "Gossensass",
  },
  {
    position: { lat: 46.5534, lng: 11.7999 },
    detailPage: "https://www.ras.bz.it/de/webcams/groednerjoch/",
    title: "Grödnerjoch",
  },
  {
    position: { lat: 46.7649, lng: 12.1895 },
    detailPage: "https://www.ras.bz.it/de/webcams/gsies/",
    title: "Gsies",
  },
  {
    position: { lat: 46.5093, lng: 10.7251 },
    detailPage: "https://www.ras.bz.it/de/webcams/hintermartell/",
    title: "Hintermartell",
  },
  {
    position: { lat: 46.7772, lng: 11.4591 },
    detailPage: "https://www.ras.bz.it/de/webcams/hohe-scheibe/",
    title: "Hohe Scheibe",
  },
  {
    position: { lat: 46.861, lng: 11.4053 },
    detailPage: "https://www.ras.bz.it/de/webcams/jaufental/",
    title: "Jaufental",
  },
  {
    position: { lat: 46.5595, lng: 11.5765 },
    detailPage: "https://www.ras.bz.it/de/webcams/kastelruth/",
    title: "Kastelruth",
  },
  {
    position: { lat: 46.9689, lng: 11.5613 },
    detailPage: "https://www.ras.bz.it/de/webcams/kematen/",
    title: "Kematen",
  },
  {
    position: { lat: 46.74, lng: 11.9599 },
    detailPage: "https://www.ras.bz.it/de/webcams/kronplatz/",
    title: "Kronplatz",
  },
  {
    position: { lat: 46.2693, lng: 11.2455 },
    detailPage: "https://www.ras.bz.it/de/webcams/laag/",
    title: "Laag",
  },
  {
    position: { lat: 46.8112, lng: 11.6629 },
    detailPage: "https://www.ras.bz.it/de/webcams/meransen/",
    title: "Meransen",
  },
  {
    position: { lat: 46.6162, lng: 10.5506 },
    detailPage: "https://www.ras.bz.it/de/webcams/montoni/",
    title: "Montoni",
  },
  {
    position: { lat: 46.8889, lng: 11.8269 },
    detailPage: "https://www.ras.bz.it/de/webcams/muehlwald/",
    title: "Mühlwald",
  },
  {
    position: { lat: 46.7003, lng: 11.1322 },
    detailPage: "https://www.ras.bz.it/de/webcams/mut/",
    title: "Mut",
  },
  {
    position: { lat: 46.4431, lng: 11.2172 },
    detailPage: "https://www.ras.bz.it/de/webcams/penegal/",
    title: "Penegal",
  },
  {
    position: { lat: 46.807, lng: 11.111 },
    detailPage: "https://www.ras.bz.it/de/webcams/pfelders/",
    title: "Pfelders",
  },
  {
    position: { lat: 46.9063, lng: 11.696 },
    detailPage: "https://www.ras.bz.it/de/webcams/pfunders/",
    title: "Pfunders",
  },
  {
    position: { lat: 46.683, lng: 11.7075 },
    detailPage: "https://www.ras.bz.it/de/webcams/plose/",
    title: "Plose",
  },
  {
    position: { lat: 46.6985, lng: 11.734 },
    detailPage: "https://www.ras.bz.it/de/webcams/plose-telegraph/",
    title: "Plose Telegraph",
  },
  {
    position: { lat: 47.0292, lng: 12.073 },
    detailPage: "https://www.ras.bz.it/de/webcams/prettau/",
    title: "Prettau",
  },
  {
    position: { lat: 46.4616, lng: 11.0307 },
    detailPage: "https://www.ras.bz.it/de/webcams/proveis/",
    title: "Proveis",
  },
  {
    position: { lat: 46.8806, lng: 11.1551 },
    detailPage: "https://www.ras.bz.it/de/webcams/rabenstein/",
    title: "Rabenstein",
  },
  {
    position: { lat: 46.8623, lng: 11.2903 },
    detailPage: "https://www.ras.bz.it/de/webcams/ratschings/",
    title: "Ratschings",
  },
  {
    position: { lat: 46.9479, lng: 12.0776 },
    detailPage: "https://www.ras.bz.it/de/webcams/rein-in-taufers/",
    title: "Rein in Taufers",
  },
  {
    position: { lat: 46.928, lng: 11.4162 },
    detailPage: "https://www.ras.bz.it/de/webcams/rosskopf/",
    title: "Rosskopf",
  },
  {
    position: { lat: 46.6503, lng: 11.3509 },
    detailPage: "https://www.ras.bz.it/de/webcams/sarnthein/",
    title: "Sarnthein",
  },
  {
    position: { lat: 46.68372, lng: 10.42954 },
    detailPage: "https://www.ras.bz.it/de/webcams/schlinig/",
    title: "Schlinig",
  },
  {
    position: { lat: 46.5404, lng: 10.9052 },
    detailPage: "https://www.ras.bz.it/de/webcams/schwemmalm/",
    title: "Schwemmalm",
  },
  {
    position: { lat: 46.5587, lng: 11.6705 },
    detailPage: "https://www.ras.bz.it/de/webcams/seiser-alm/",
    title: "Seiser Alm",
  },
  {
    position: { lat: 46.4831, lng: 10.8748 },
    detailPage: "https://www.ras.bz.it/de/webcams/st-gertraud/",
    title: "St. Gertraud",
  },
  {
    position: { lat: 46.822, lng: 11.2513 },
    detailPage: "https://www.ras.bz.it/de/webcams/st-leonhard-in-passeier/",
    title: "St. Leonhard in Passeier",
  },
  {
    position: { lat: 46.6365, lng: 10.8622 },
    detailPage: "https://www.ras.bz.it/de/webcams/st-martin-im-kofel/",
    title: "St. Martin im Kofel",
  },
  {
    position: { lat: 46.652, lng: 11.9462 },
    detailPage: "https://www.ras.bz.it/de/webcams/tolpeit/",
    title: "Tolpeit",
  },
  {
    position: { lat: 46.56878, lng: 10.50439 },
    detailPage: "https://www.ras.bz.it/de/webcams/trafoi/",
    title: "Trafoi",
  },
  {
    position: { lat: 46.5559, lng: 11.0444 },
    detailPage: "https://www.ras.bz.it/de/webcams/ulten/",
    title: "Ulten",
  },
  {
    position: { lat: 46.6372, lng: 11.0984 },
    detailPage: "https://www.ras.bz.it/de/webcams/vinschgau/",
    title: "Vinschgau",
  },
  {
    position: { lat: 46.5216, lng: 11.5125 },
    detailPage: "https://www.ras.bz.it/de/webcams/voels/",
    title: "Völs",
  },
];

export function convertRasWebcam(webcam: (typeof webcams)[number]): GenericObservation {
  return {
    $data: webcam,
    $externalURL: webcam.detailPage,
    $source: ObservationSource.FotoWebcamsEU,
    $type: ObservationType.Webcam,
    authorName: "ras.bz.it",
    eventDate: new Date(),
    latitude: webcam.position.lat,
    longitude: webcam.position.lng,
    locationName: webcam.title,
  };
}
