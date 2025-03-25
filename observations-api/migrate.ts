import { type Observation, convertObservationToGeneric } from "../src/app/observations/models/observation.model";
import { ObservationDatabaseConnection } from "./src/db/database";

async function migrate() {
  const headers = {
    Authorization: "Bearer ...",
  };
  const response = await fetch(
    "https://admin.avalanche.report/albina/api/observations?startDate=2000-01-01T00:00:00Z&endDate=2025-01-01T00:00:00Z",
    { headers },
  );
  const observations: Observation[] = await response.json();

  const connection = await ObservationDatabaseConnection.createConnection();
  for await (const obs of observations) {
    try {
      const generic = convertObservationToGeneric(obs);
      console.log(generic);
      await connection.insertObservation(generic);
    } catch (e) {
      console.error(e);
    }
  }
  connection.destroy();
}

migrate();
