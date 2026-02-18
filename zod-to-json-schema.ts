import { AwsomeConfigSchema } from "./src/app/modelling/awsome.config";
import { writeFile } from "fs/promises";
import { join } from "path";
import * as oxfmt from "oxfmt";
import * as z from "zod/v4";

main();

async function main() {
  const file = join(__dirname, "src/app/modelling/awsome.schema.json");
  const schema = z.toJSONSchema(AwsomeConfigSchema);
  const json = JSON.stringify(schema, null, 2);
  const { code } = await oxfmt.format("awsome.schema.json", json);
  await writeFile(file, code);
}
