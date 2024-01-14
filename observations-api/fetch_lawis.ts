import dayjs from "dayjs";
import { Profile, toLawisProfile, toLawisProfileDetails } from "../src/app/observations/models/lawis.model";
import { augmentRegion } from "./regions";
import { insertObservation } from "./database";

const url =
  "https://lawis.at/lawis_api/public/profile?" +
  new URLSearchParams({
    startDate: dayjs().subtract(1, "week").toISOString(),
    endDate: dayjs().toISOString(),
  });
const json: Profile[] = await (await fetch(url)).json();
const observations$ = json
  .map((p) => toLawisProfile(p, "https://lawis.at/lawis_api/v2_2/files/profiles/snowprofile_{{id}}.pdf"))
  .map((p) => augmentRegion(p))
  .map(async (o) =>
    toLawisProfileDetails(o, await (await fetch(`https://lawis.at/lawis_api/v2_2/profile/${o.$id}`)).json()),
  );
const observations = await Promise.all(observations$);
console.table(observations);
Promise.all(observations.map((o) => insertObservation(o)));
