import { GenericObservation, ObservationSource, ObservationType } from "./generic-observation.model";
import { Aspect, SnowpackStability } from "../../enums/enums";

export interface Observation {
  aspect: Aspect;
  authorName: string;
  content: string;
  elevation: number;
  eventDate: string | Date;
  eventType: EventType;
  id: number;
  latitude: number;
  locationName: string;
  longitude: number;
  region: string;
  reportDate?: string | Date;
}

export enum EventType {
  Important = "IMPORTANT",
  NeighborRegion = "NEIGHBOR_REGION",
  Normal = "NORMAL",
  PersonDead = "PERSON_DEAD",
  PersonInjured = "PERSON_INJURED",
  PersonNo = "PERSON_NO",
  PersonUninjured = "PERSON_UNINJURED",
  PersonUnknown = "PERSON_UNKNOWN",
  Traffic = "TRAFFIC",
}

export function convertObservationToGeneric(observation: Observation): GenericObservation<Observation> {
  return {
    ...observation,
    $data: observation,
    $extraDialogRows: null,
    $source: ObservationSource.AvalancheWarningService,
    $type: getObservationType(observation),
    stability: getObservationStability(observation),
    eventDate: observation.eventDate ? new Date(observation.eventDate) : undefined,
    reportDate: observation.reportDate ? new Date(observation.reportDate) : undefined,
  };
}

export function isAvalancheWarningServiceObservation(
  observation: GenericObservation,
): observation is GenericObservation<Observation> {
  return (
    observation.$source === ObservationSource.AvalancheWarningService &&
    !/models.avalanche.report/.test(observation.$externalURL)
  );
}

function getObservationStability(observation: Observation): SnowpackStability {
  switch (observation.eventType ?? EventType.Normal) {
    case EventType.PersonDead:
      return SnowpackStability.poor;
    case EventType.PersonInjured:
      return SnowpackStability.poor;
    case EventType.PersonUninjured:
      return SnowpackStability.poor;
    case EventType.PersonNo:
      return SnowpackStability.poor;
    case EventType.Important:
      return SnowpackStability.fair;
    default:
      return null;
  }
}

function getObservationType(observation: Observation): ObservationType {
  switch (observation.eventType ?? EventType.Normal) {
    case EventType.PersonDead:
      return ObservationType.Avalanche;
    case EventType.PersonInjured:
      return ObservationType.Avalanche;
    case EventType.PersonUninjured:
      return ObservationType.Avalanche;
    case EventType.PersonNo:
      return ObservationType.Avalanche;
    default:
      return ObservationType.SimpleObservation;
  }
}
