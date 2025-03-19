
import { toast } from "@/components/ui/use-toast";

export interface WeatherData {
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  condition: string;
  icon: string;
  precipitation: number; 
  clouds: number;
  pressure: number;
  location: string;
  timestamp: number;
}

// Using OpenMeteo API which is free and doesn't require an API key
export async function getWeatherByGeolocation(lat: number, lon: number): Promise<WeatherData | null> {
  try {
    // Get the current weather from Open-Meteo API
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch weather data");
    }

    const data = await response.json();
    
    // Convert OpenMeteo weather codes to conditions
    const condition = mapWeatherCodeToCondition(data.current.weather_code);
    
    // Get location name using reverse geocoding API
    const locationName = await getLocationName(lat, lon);
    
    return {
      temperature: Math.round(data.current.temperature_2m),
      feelsLike: Math.round(data.current.apparent_temperature),
      humidity: data.current.relative_humidity_2m,
      windSpeed: Math.round(data.current.wind_speed_10m),
      windDirection: data.current.wind_direction_10m,
      condition: condition,
      icon: getWeatherIconFromCondition(condition),
      precipitation: Math.round(data.current.precipitation || 0),
      clouds: data.current.cloud_cover,
      pressure: Math.round(data.current.pressure_msl),
      location: locationName,
      timestamp: Math.floor(Date.now() / 1000) // Current timestamp in seconds
    };
  } catch (error) {
    if (error instanceof Error) {
      toast({
        title: "Weather Error",
        description: error.message,
        variant: "destructive"
      });
    }
    console.error("Weather fetch error:", error);
    return null;
  }
}

// Using OpenMeteo Geocoding API which is free and doesn't require an API key
export async function getWeatherByZipcode(zipcode: string, country: string = "us"): Promise<WeatherData | null> {
  try {
    // First convert zipcode to coordinates using OpenMeteo Geocoding API
    const geocodeResponse = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${zipcode}&count=1&language=en&format=json`
    );

    if (!geocodeResponse.ok) {
      throw new Error("Failed to find location");
    }

    const geocodeData = await geocodeResponse.json();
    
    if (!geocodeData.results || geocodeData.results.length === 0) {
      throw new Error("Location not found. Try a different zipcode.");
    }
    
    const { latitude, longitude } = geocodeData.results[0];
    
    // Now get the weather using these coordinates
    return getWeatherByGeolocation(latitude, longitude);
  } catch (error) {
    if (error instanceof Error) {
      toast({
        title: "Weather Error",
        description: error.message,
        variant: "destructive"
      });
    }
    console.error("Weather fetch error:", error);
    return null;
  }
}

// Get city name from coordinates using nominatim (OpenStreetMap) API
async function getLocationName(lat: number, lon: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10`
    );
    
    if (!response.ok) {
      return "Unknown Location";
    }
    
    const data = await response.json();
    
    if (data.address) {
      // Construct a readable location string
      const city = data.address.city || data.address.town || data.address.village || data.address.hamlet || "Unknown";
      const state = data.address.state || "";
      const country = data.address.country_code ? data.address.country_code.toUpperCase() : "";
      
      return `${city}${state ? ', ' + state : ''}${country ? ', ' + country : ''}`;
    }
    
    return "Unknown Location";
  } catch (error) {
    console.error("Error fetching location name:", error);
    return "Unknown Location";
  }
}

// Map OpenMeteo weather codes to conditions
function mapWeatherCodeToCondition(code: number): string {
  const weatherCodes: Record<number, string> = {
    0: "Clear",
    1: "Mainly Clear",
    2: "Partly Cloudy",
    3: "Cloudy",
    45: "Fog",
    48: "Depositing Rime Fog",
    51: "Light Drizzle",
    53: "Moderate Drizzle",
    55: "Dense Drizzle",
    56: "Light Freezing Drizzle",
    57: "Dense Freezing Drizzle",
    61: "Slight Rain",
    63: "Moderate Rain",
    65: "Heavy Rain",
    66: "Light Freezing Rain",
    67: "Heavy Freezing Rain",
    71: "Slight Snow",
    73: "Moderate Snow",
    75: "Heavy Snow",
    77: "Snow Grains",
    80: "Slight Rain Showers",
    81: "Moderate Rain Showers",
    82: "Violent Rain Showers",
    85: "Slight Snow Showers",
    86: "Heavy Snow Showers",
    95: "Thunderstorm",
    96: "Thunderstorm with Slight Hail",
    99: "Thunderstorm with Heavy Hail"
  };
  
  return weatherCodes[code] || "Unknown";
}

// Get weather icon code based on condition
function getWeatherIconFromCondition(condition: string): string {
  // Map condition to appropriate icon code
  const conditionLower = condition.toLowerCase();
  
  if (conditionLower.includes("clear") || conditionLower.includes("sunny")) return "01d";
  if (conditionLower.includes("mainly clear")) return "02d";
  if (conditionLower.includes("partly cloudy")) return "02d";
  if (conditionLower.includes("cloudy")) return "03d";
  if (conditionLower.includes("fog")) return "50d";
  if (conditionLower.includes("drizzle")) return "09d";
  if (conditionLower.includes("rain") || conditionLower.includes("shower")) return "10d";
  if (conditionLower.includes("freezing")) return "13d";
  if (conditionLower.includes("snow")) return "13d";
  if (conditionLower.includes("thunder")) return "11d";
  
  // Default icon
  return "01d";
}

export function getWeatherIconUrl(iconCode: string, size: "2x" | "4x" = "4x"): string {
  return `https://openweathermap.org/img/wn/${iconCode}@${size}.png`;
}

export function getBackgroundClass(condition: string): string {
  const lowerCondition = condition.toLowerCase();
  
  if (lowerCondition.includes("clear") || lowerCondition.includes("sunny")) return "bg-weather-sunny";
  if (lowerCondition.includes("cloud") || lowerCondition.includes("partly")) return "bg-weather-cloudy";
  if (lowerCondition.includes("rain") || lowerCondition.includes("shower") || lowerCondition.includes("drizzle")) return "bg-weather-rainy";
  if (lowerCondition.includes("snow") || lowerCondition.includes("flurries")) return "bg-weather-snowy";
  if (lowerCondition.includes("thunder") || lowerCondition.includes("storm")) return "bg-weather-stormy";
  if (lowerCondition.includes("fog") || lowerCondition.includes("haze") || lowerCondition.includes("mist")) return "bg-weather-foggy";
  
  return "bg-sky";
}
