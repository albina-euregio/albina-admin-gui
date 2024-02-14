import { Profile, ProfileDetails, toLawisProfile, toLawisProfileDetails } from "./models/lawis.model";
import { GenericObservation, findExistingObservation } from "../src/app/observations/models/generic-observation.model";
import { fetchJSON } from "./fetchJSON";

const API = "https://lawis.at/lawis_api/public/profile";
const WEB = "https://lawis.at/lawis_api/v2_2/files/profiles/snowprofile_{{id}}.pdf";

export async function* fetchLawisProfiles(startDate: Date, endDate: Date, existing: GenericObservation[]) {
  const url = `${API}?${new URLSearchParams({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  })}`;
  const json: Profile[] = await fetchJSON(url);

  for (const profile of json) {
    const obs = toLawisProfile(profile, WEB);
    if (findExistingObservation(existing, obs)) continue;
    const details: ProfileDetails = await fetchJSON(`${API}/${profile.id}`);
    yield toLawisProfileDetails(obs, details);
  }
}
