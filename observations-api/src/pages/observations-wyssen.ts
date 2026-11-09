import { ObservationDatabaseConnection } from "../db/database";
import { toWyssenAvalancheObservation } from "../fetch/observations/wyssen.model";

/**
 * Receives an avalanche in the format of the SLF Aval API v5 (https://test-api.slf.ch/aval/api/v5/)
 * and stores it as generic observation. Re-sending the same externalId updates the observation.
 */
export const POST = async (request: Bun.BunRequest) => {
  if (
    !process.env.ALBINA_WYSSEN_POST_SECRET ||
    process.env.ALBINA_WYSSEN_POST_SECRET !== request.headers.get("Authorization")
  ) {
    return new Response("", { status: 403, statusText: "Forbidden" });
  }
  if (!request.headers.get("Content-Type")?.startsWith("application/json")) {
    return new Response("Expecting application/json", { status: 415 });
  }
  let observation: ReturnType<typeof toWyssenAvalancheObservation>;
  try {
    const body = await request.json();
    // do not log the whole payload, it contains notes and personal data
    console.info("Receiving avalanche", body?.externalId);
    observation = toWyssenAvalancheObservation(body);
  } catch (e) {
    console.error(e);
    return new Response(String(e), { status: 400 });
  }
  try {
    const connection = await ObservationDatabaseConnection.createConnection();
    try {
      const ex = await connection.selectObservation(observation);
      if (ex?.$allowEdit || ex?.$deleted) {
        return new Response("Observation has been edited or deleted in albina-admin-gui", { status: 409 });
      }
      await connection.augmentAndInsertObservation(observation);
    } finally {
      connection.destroy();
    }
  } catch (e) {
    console.error(e);
    return new Response(String(e), { status: 500 });
  }
  return new Response(JSON.stringify({ id: observation.$id }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
};
