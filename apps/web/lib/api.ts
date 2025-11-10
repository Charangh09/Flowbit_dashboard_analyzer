export async function getJSON(endpoint: string) {
  // Base URL for your backend API. If NEXT_PUBLIC_API_BASE is not set,
  // use the local nextjs API routes under /api.
  const configured = process.env.NEXT_PUBLIC_API_BASE;
  const base = configured === undefined || configured === '' ? '' : configured;
  const url = base ? `${base}${endpoint}` : `/api${endpoint}`;

  try {
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store", // prevent caching in dev
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`API error at ${endpoint}: ${res.status} - ${errorText}`);
    }

    // Return parsed JSON
    return res.json();
  } catch (err: any) {
    console.error(`❌ Failed to fetch ${url}:`, err.message || err);
    throw err;
  }
}
