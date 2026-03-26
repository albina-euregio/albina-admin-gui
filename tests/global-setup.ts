import path from "path";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import dotenv from "dotenv";

export default function setup() {
  dotenv.config({ path: path.resolve(__dirname, "../.env"), override: true });
}
