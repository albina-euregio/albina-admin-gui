import { Incident, IncidentDetails, toLawisIncident, toLawisIncidentDetails } from "./models/lawis.model";
import { GenericObservation, findExistingObservation } from "./models";
import { fetchJSON } from "./fetchJSON";

const API = "https://lawis.at/lawis_api/public/incident";
const WEB = "https://lawis.at/lawis_api/v2_2/files/incidents/snowprofile_{{id}}.pdf";

export async function* fetchLawisIncidents(startDate: Date, endDate: Date, existing: GenericObservation[]) {
  const url = `${API}?${new URLSearchParams({
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
