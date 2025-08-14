import { AwsomeConfigSchema } from "./src/app/modelling/awsome.config";
import { writeFile } from "fs/promises";
import { join } from "path";
import * as prettier from "prettier";
import * as z from "zod/v4";

main();

async function main() {
  const configFile = await prettier.resolveConfigFile();
  const options = await prettier.resolveConfig(configFile!);
  const file = join(__dirname, "src/app/modelling/awsome.schema.json");
  const schema = z.toJSONSchema(AwsomeConfigSchema);
  const json = JSON.stringify(schema, null, 2);
  await writeFile(file, await prettier.format(json, { ...options, parser: "json" }));
}
