import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: "https://dev.avalanche.report/api/openapi.json",
  output: "src/app/providers/albina-api",
  plugins: ["@hey-api/typescript", "@hey-api/client-angular", "@hey-api/sdk"],
});
