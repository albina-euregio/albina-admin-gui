import type dayjs from "dayjs";
import {
  Profile,
  ProfileDetails,
  toLawisProfile,
  toLawisProfileDetails,
} from "../src/app/observations/models/lawis.model";

const API = "https://lawis.at/lawis_api/v2_2/profile";
const WEB = "https://lawis.at/lawis_api/v2_2/files/profiles/snowprofile_{{id}}.pdf";

export async function* fetchLawisProfiles(startDate: dayjs.Dayjs, endDate: dayjs.Dayjs) {
  const url = `${API.replace("v2_2", "public")}?${new URLSearchParams({
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  })}`;
  console.log("Fetching", url);
  const json: Profile[] = await (await fetch(url)).json();

  for (const profile of json) {
    const obs = toLawisProfile(profile, WEB);
    const details: ProfileDetails = await (await fetch(`${API}/${profile.id}`)).json();
    yield toLawisProfileDetails(obs, details);
  }
}
