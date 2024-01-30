import type dayjs from "dayjs";
import { Incident, IncidentDetails, toLawisIncident, toLawisIncidentDetails } from "./models/lawis.model";
import { GenericObservation, findExistingObservation } from "../src/app/observations/models/generic-observation.model";
import { fetchJSON } from "./fetchJSON";

const API = "https://lawis.at/lawis_api/v2_2/incident";
const WEB = "https://lawis.at/lawis_api/v2_2/files/incidents/snowprofile_{{id}}.pdf";

export async function* fetchLawisIncidents(
  startDate: dayjs.Dayjs,
  endDate: dayjs.Dayjs,
  existing: GenericObservation[],
) {
  const url = `${API.replace("v2_2", "public")}?${new URLSearchParams({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  })}`;
  const json: Incident[] = await fetchJSON(url);

  for (const incident of json) {
    const obs = toLawisIncident(incident, WEB);
    if (findExistingObservation(existing, obs)) continue;
    const details: IncidentDetails = await fetchJSON(`${API}/${incident.id}`);
    yield toLawisIncidentDetails(obs, details);
  }
}
