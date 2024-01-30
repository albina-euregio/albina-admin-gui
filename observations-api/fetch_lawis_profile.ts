import type dayjs from "dayjs";
import {
  Profile,
  ProfileDetails,
  toLawisProfile,
  toLawisProfileDetails,
} from "./models/lawis.model";
import { GenericObservation, findExistingObservation } from "../src/app/observations/models/generic-observation.model";

const API = "https://lawis.at/lawis_api/v2_2/profile";
const WEB = "https://lawis.at/lawis_api/v2_2/files/profiles/snowprofile_{{id}}.pdf";

export async function* fetchLawisProfiles(
  startDate: dayjs.Dayjs,
  endDate: dayjs.Dayjs,
  existing: GenericObservation[],
) {
  const url = `${API.replace("v2_2", "public")}?${new URLSearchParams({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  })}`;
  console.log("Fetching", url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(res.statusText + ": " + (await res.text()));
  const json: Profile[] = await res.json();

  for (const profile of json) {
    const obs = toLawisProfile(profile, WEB);
    if (findExistingObservation(existing, obs)) continue;
    const details: ProfileDetails = await (await fetch(`${API}/${profile.id}`)).json();
    yield toLawisProfileDetails(obs, details);
  }
}
