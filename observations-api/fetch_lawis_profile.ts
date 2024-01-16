import dayjs from "dayjs";
import {
  Profile,
  ProfileDetails,
  toLawisProfile,
  toLawisProfileDetails,
} from "../src/app/observations/models/lawis.model";

const API = "https://lawis.at/lawis_api/v2_2/profile";
const WEB = "https://lawis.at/lawis_api/v2_2/files/profiles/snowprofile_{{id}}.pdf";

export async function* fetchLawisProfiles() {
  const url = `${API.replace("v2_2", "public")}?${new URLSearchParams({
    startDate: dayjs().millisecond(0).subtract(1, "week").toISOString(),
    endDate: dayjs().millisecond(0).toISOString(),
  })}`;
  console.log("Fetching", url);
  const json: Profile[] = await (await fetch(url)).json();

  for (const profile of json) {
    const obs = toLawisProfile(profile, WEB);
    const details: ProfileDetails = await (await fetch(`${API}/${profile.id}`)).json();
    yield toLawisProfileDetails(obs, details);
  }
}
