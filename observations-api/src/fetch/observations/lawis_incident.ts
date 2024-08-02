import { fetchJSON } from "../../util/fetchJSON";
import { type GenericObservation, findExistingObservation } from "../../models";
import { type Incident, type IncidentDetails, toLawisIncident, toLawisIncidentDetails } from "../../models/lawis.model";

const API = "https://lawis.at/lawis_api/public/incident";
const WEB = "https://lawis.at/incident/#{{id}}";

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
