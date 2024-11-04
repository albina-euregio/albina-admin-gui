import { type Observation, convertObservationToGeneric } from "../src/app/observations/models/observation.model";
import { createConnection, insertObservation } from "./src/db/database";

async function migrate() {
  const headers = {
    Authorization: "Bearer ...",
  };
  const response = await fetch(
    "https://admin.avalanche.report/albina/api/observations?startDate=2000-01-01T00:00:00Z&endDate=2025-01-01T00:00:00Z",
    { headers },
  );
  const observations: Observation[] = await response.json();

  const connection = await createConnection();
  for await (const obs of observations) {
    try {
      const generic = convertObservationToGeneric(obs);
      console.log(generic);
      await insertObservation(connection, generic);
    } catch (e) {
      console.error(e);
    }
  }
  connection.destroy();
}

migrate();
