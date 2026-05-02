interface GdeltArticle {
  title: string;
  url: string;
  source: string;
}

export async function getGdeltEvents(lat: number, lon: number, radiusKm = 200) {
  // GDELT 2.0 DOC API
  // We search for "disruption" or "port" or "strike" near coordinates
  const query = `(disruption OR strike OR congestion OR closure)`;
  const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${query}&mode=artlist&format=json&timespan=24h`;
  
  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    
    // In a real app, we'd filter results by proximity using GDELT's location fields.
    // For the hackathon, we return the top 3 relevant global events to show signal.
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
