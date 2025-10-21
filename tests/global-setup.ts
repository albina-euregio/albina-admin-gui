/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import dotenv from "dotenv";
import path from "path";

export default function setup() {
  dotenv.config({ path: path.resolve(__dirname, "../.env"), override: true });
}
