import dayjs from "dayjs";
import {
  Incident,
  IncidentDetails,
  toLawisIncident,
  toLawisIncidentDetails,
} from "../src/app/observations/models/lawis.model";

const API = "https://lawis.at/lawis_api/v2_2/incident";
const WEB = "https://lawis.at/lawis_api/v2_2/files/incidents/snowprofile_{{id}}.pdf";

export async function* fetchLawisIncidents() {
  const url = `${API.replace("v2_2", "public")}?${new URLSearchParams({
    startDate: dayjs().millisecond(0).subtract(1, "week").toISOString(),
    endDate: dayjs().millisecond(0).toISOString(),
  })}`;
  console.log("Fetching", url);
  const json: Incident[] = await (await fetch(url)).json();

  for (const incident of json) {
    const obs = toLawisIncident(incident, WEB);
    const details: IncidentDetails = await (await fetch(`${API}/${incident.id}`)).json();
    yield toLawisIncidentDetails(obs, details);
  }
}
