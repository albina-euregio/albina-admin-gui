export async function fetchJSON(url: RequestInfo, options?: RequestInit): Promise<any> {
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
