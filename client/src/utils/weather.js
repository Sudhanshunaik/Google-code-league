/**
 * Weather Utility (Rain-Check Feature)
 * Fetches data from the free Open-Meteo API.
 */

// Default Goa coordinates
const DEFAULT_LAT = 15.2993;
const DEFAULT_LNG = 74.1240;

export async function getMatchWeather(latitude, longitude, matchTimeStr) {
  try {
    const lat = latitude || DEFAULT_LAT;
    const lng = longitude || DEFAULT_LNG;
    const matchTime = new Date(matchTimeStr);
    
    // Fetch hourly precipitation probability for the next 7 days
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&hourly=precipitation_probability&timezone=auto`
    );
    
    if (!res.ok) throw new Error('Weather API failed');
    const data = await res.json();
    
    // Find the hourly index closest to our match time
    const matchTimeMs = matchTime.getTime();
    let closestDiff = Infinity;
    let closestIndex = 0;
    
    data.hourly.time.forEach((timeStr, index) => {
      const forecastTimeMs = new Date(timeStr).getTime();
      const diff = Math.abs(forecastTimeMs - matchTimeMs);
      if (diff < closestDiff) {
        closestDiff = diff;
        closestIndex = index;
      }
    });
    
    // Return the precipitation probability for that specific hour
    const prob = data.hourly.precipitation_probability[closestIndex];
    
    return {
      rainProbability: prob,
      isHighRainRisk: prob >= 60,
    };
  } catch (err) {
    console.error('Failed to fetch weather:', err);
    // Graceful fallback if API fails
    return { rainProbability: 0, isHighRainRisk: false };
  }
}
