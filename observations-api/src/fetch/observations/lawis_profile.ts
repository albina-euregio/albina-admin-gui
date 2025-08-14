import { type GenericObservation, findExistingObservation } from "../../generic-observation";
import { fetchJSON } from "../../util/fetchJSON";
import { type Profile, type ProfileDetails, toLawisProfile, toLawisProfileDetails } from "./lawis.model";

const API = "https://lawis.at/lawis_api/public/profile";
const WEB = "https://lawis.at/lawis_api/v2_3/files/profiles/snowprofile_{{id}}.pdf";

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
