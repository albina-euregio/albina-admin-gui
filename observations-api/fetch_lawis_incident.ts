import dayjs from "dayjs";
import { createConnection, insertObservation } from "./database";
import { augmentRegion } from "../src/app/providers/regions-service/augmentRegion";
import {
  Incident,
  IncidentDetails,
  toLawisIncident,
  toLawisIncidentDetails,
} from "../src/app/observations/models/lawis.model";

const API = "https://lawis.at/lawis_api/v2_2/incident";
const WEB = "https://lawis.at/lawis_api/v2_2/files/incidents/snowprofile_{{id}}.pdf";

export async function fetchLawisIncidents() {
  const url = `${API.replace("v2_2", "public")}?${new URLSearchParams({
    startDate: dayjs().millisecond(0).subtract(1, "week").toISOString(),
    endDate: dayjs().millisecond(0).toISOString(),
  })}`;
  console.log("Fetching", url);
  const json: Incident[] = await (await fetch(url)).json();

  const connection = await createConnection();
  for (const incident of json) {
    let obs = toLawisIncident(incident, WEB);
    const details: IncidentDetails = await (await fetch(`${API}/${incident.id}`)).json();
    obs = toLawisIncidentDetails(obs, details);
    obs = augmentRegion(obs);
    await insertObservation(connection, obs);
  }
  connection.destroy();
}
