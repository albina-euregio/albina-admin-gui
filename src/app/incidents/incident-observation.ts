import type { AlbinaLanguage, LangTexts } from "../models/text.model";
import {
  GenericObservation,
  ObservationSource,
  ObservationTableRow,
  ObservationType,
  PersonInvolvement,
} from "../observations/models/generic-observation.model";
import { computeInvolvementsFatalitiesBurials, IncidentReport } from "./incident-report.model";

/**
 * Adapt an incident report to a generic observation, so that incidents can be shown
 * on the observations map next to the observations themselves.
 *
 * The report is kept in `$data`; `region` is left unset because the observations map
 * derives it from the coordinates anyway (see `augmentRegion`).
 */
export function incidentToGenericObservation(
  incident: IncidentReport,
  lang: AlbinaLanguage,
  translate: (key: string) => string,
): GenericObservation<IncidentReport> {
  return {
    $data: incident,
    $id: incident.id,
    $source: ObservationSource.AvalancheWarningService,
    $type: ObservationType.Avalanche,
    $allowEdit: false,
    $deleted: false,
    eventDate: incident.dateTime,
    reportDate: incident.publishedAt ?? incident.updatedAt,
    authorName: incident.author,
    locationName: incident.location,
    latitude: incident.latitude,
    longitude: incident.longitude,
    elevation: incident.startZoneElevation,
    aspect: incident.startZoneAspect,
    avalancheProblems: incident.relevantAvalancheProblem ? [incident.relevantAvalancheProblem] : undefined,
    personInvolvement: toPersonInvolvement(incident),
    content: toPlainText(incident.incidentLede, lang) || toPlainText(incident.incidentDescription, lang),
    $extraDialogRows: toExtraDialogRows(incident, translate),
  };
}

/**
 * The worst outcome among the victims, so that the marker classification treats an
 * incident like an observation with person involvement.
 */
function toPersonInvolvement(incident: IncidentReport): PersonInvolvement {
  if (incident.personInvolvement === "No") return PersonInvolvement.No;
  const { fatalities, injuredSurvivors, uninjuredSurvivors, caughtOnly } = involvements(incident);
  if (fatalities) return PersonInvolvement.Dead;
  if (injuredSurvivors) return PersonInvolvement.Injured;
  if (uninjuredSurvivors || caughtOnly) return PersonInvolvement.Uninjured;
  return PersonInvolvement.Unknown;
}

function toExtraDialogRows(incident: IncidentReport, translate: (key: string) => string): ObservationTableRow[] {
  const { numberInvolved, fatalities } = involvements(incident);
  const rows: ObservationTableRow[] = [
    { label: translate("incidentReport.avalancheSize"), value: incident.avalancheSize },
    { label: translate("incidentReport.numberInvolved"), number: numberInvolved },
    { label: translate("incidentReport.fatalities"), number: fatalities },
    {
      label: translate("sidebar.incidents"),
      url: incident.id ? new URL(`#/incidents/${incident.id}?readOnly=true`, location.href).toString() : undefined,
    },
  ];
  return rows.filter((row) => row.value !== undefined || row.number !== undefined || row.url !== undefined);
}

/** Reports imported before the counts were stored carry no summary, so derive it from the victims. */
function involvements(incident: IncidentReport) {
  return incident.involvementsFatalitiesBurials ?? computeInvolvementsFatalitiesBurials(incident);
}

/** The rich text of the given language as plain text, since the observation dialog does not render HTML. */
function toPlainText(texts: LangTexts | null | undefined, lang: AlbinaLanguage): string | undefined {
  const html = texts?.[lang] ?? texts?.en ?? texts?.de;
  return (
    html
      ?.replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim() || undefined
  );
}
