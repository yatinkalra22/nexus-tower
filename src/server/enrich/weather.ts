export async function getWeatherForPoint(lat: number, lon: number) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&hourly=temperature_2m,weather_code`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  
  return {
    temp: data.current.temperature_2m,
    code: data.current.weather_code,
    // Maps code to a human string (simplified)
    condition: data.current.weather_code > 50 ? "Rain/Storm" : "Clear/Cloudy",
  };
}

export async function getMarineWeatherForPoint(lat: number, lon: number) {
  const url = `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&current=wave_height`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  
  return {
    waveHeight: data.current.wave_height,
  };
}
