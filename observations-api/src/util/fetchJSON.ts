import { readFile } from "fs/promises";

export async function fetchJSON(url: RequestInfo, options?: RequestInit): Promise<any> {
  if (typeof url === "string" && url.startsWith("file://")) {
    const json = await readFile(url.slice("file://".length), { encoding: "utf-8" });
    return JSON.parse(json);
  }
  console.log("Fetching", url);
  const res = await fetch(url, {
    cache: "no-cache",
    headers: { Accept: "application/json" },
    ...options,
  });
  if (res.ok) {
    return res.json();
  } else {
    throw new Error(res.statusText);
  }
}
