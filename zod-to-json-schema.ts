import { writeFile } from "fs/promises";
import { join } from "path";
import * as prettier from "prettier";
import { zodToJsonSchema } from "zod-to-json-schema";
import { AwsomeConfigSchema } from "./src/app/modelling/awsome.config";

main();

async function main() {
  const configFile = await prettier.resolveConfigFile();
  const options = await prettier.resolveConfig(configFile!);
  const file = join(__dirname, "src/app/modelling/awsome.schema.json");
  const schema = zodToJsonSchema(AwsomeConfigSchema);
  const json = JSON.stringify(schema, null, 2);
  await writeFile(file, await prettier.format(json, { ...options, parser: "json" }));
}
