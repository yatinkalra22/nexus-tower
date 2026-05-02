interface GdeltArticle {
  title: string;
  url: string;
  source: string;
  sourcelat?: string;
  sourcelon?: string;
}

export async function getGdeltEvents(lat: number, lon: number, radiusKm = 200) {
  // GDELT 2.0 DOC API with geo-filter via sourceloc bounding box
  const degPerKm = 1 / 111;
  const latDelta = radiusKm * degPerKm;
  const lonDelta = radiusKm * degPerKm / Math.cos(lat * Math.PI / 180);
  const bbox = `${(lat - latDelta).toFixed(2)}:${(lon - lonDelta).toFixed(2)}:${(lat + latDelta).toFixed(2)}:${(lon + lonDelta).toFixed(2)}`;

  const query = encodeURIComponent(`(disruption OR strike OR congestion OR closure) sourceloc:${bbox}`);
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=artlist&format=json&timespan=24h&maxrecords=5`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    const data = await res.json();

    return (data.articles || []).slice(0, 3).map((a: GdeltArticle) => ({
      title: a.title,
      url: a.url,
      source: a.source,
    }));
  } catch (error) {
    console.error("GDELT fetch failed:", error);
    return [];
  }
}
