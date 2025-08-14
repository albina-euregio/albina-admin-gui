import "./DecompressionStream-polyfill";
import { readFile } from "fs/promises";

export async function fetchText(url: RequestInfo, options?: RequestInit): Promise<string> {
  if (typeof url === "string" && url.startsWith("file://")) {
    return await readFile(url.slice("file://".length), { encoding: "utf-8" });
  }
  const response = await fetch(url, {
    cache: "no-cache",
    ...options,
  });
  if (!response.ok) {
    console.warn("Fetching", url, response.statusText);
    throw new Error(response.statusText);
  }
  console.log("Fetching", url, response.statusText, response.headers.get("Content-Length"));
  if (
    response.headers.get("Content-Encoding") === "gzip" ||
    response.headers.get("Content-Type") === "application/x-gzip"
  ) {
    const stream = (await response.blob()).stream().pipeThrough(new DecompressionStream("gzip"));
    const blob = await new Response(stream).blob();
    return await blob.text();
  } else {
    return await response.text();
  }
}

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
