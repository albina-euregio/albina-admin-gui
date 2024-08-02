import {
  type GenericObservation,
  ObservationSource,
  ObservationType,
} from "../../../src/app/observations/models/generic-observation.model";
import BeobachterAT from "../data/Beobachter-AT.json";
import BeobachterIT from "../data/Beobachter-IT.json";

export function getAwsObservers(): GenericObservation[] {
  const eventDate = new Date();
  eventDate.setHours(0, 0, 0, 0);
  return [...BeobachterAT, ...BeobachterIT].map(
    (observer): GenericObservation => ({
      $data: observer,
      $externalImgs: [`https://wiski.tirol.gv.at/lawine/grafiken/800/beobachter/${observer["plot.id"]}.png`],
      $source: ObservationSource.Observer,
      $type: ObservationType.TimeSeries,
      aspect: undefined,
      authorName: observer.name,
      content: "",
      elevation: undefined,
      eventDate,
      latitude: +observer.latitude,
      locationName: observer.name.replace("Beobachter", "").trim(),
      longitude: +observer.longitude,
      region: "",
    }),
  );
}
