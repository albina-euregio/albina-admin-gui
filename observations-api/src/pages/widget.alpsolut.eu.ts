export const GET = async () => {
  const token = process.env.ALBINA_ALPSOLUT_API_TOKEN ?? "???";
  return new Response(token, {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
};
