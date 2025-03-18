
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

// Fetch weather data from National Weather Service API by coordinates
export async function getWeatherByGeolocation(lat: number, lon: number): Promise<WeatherData | null> {
  try {
    // First, get the nearest station point URL
    const pointsResponse = await fetch(
      `https://api.weather.gov/points/${lat},${lon}`
    );

    if (!pointsResponse.ok) {
      const errorData = await pointsResponse.json();
      throw new Error(errorData.detail || "Failed to fetch location data");
    }

    const pointsData = await pointsResponse.json();
    const forecastUrl = pointsData.properties.forecast;
    const gridpointUrl = pointsData.properties.forecastGridData;
    
    // Get the forecast for the current conditions
    const forecastResponse = await fetch(forecastUrl);
    if (!forecastResponse.ok) {
      const errorData = await forecastResponse.json();
      throw new Error(errorData.detail || "Failed to fetch forecast data");
    }
    
    const forecastData = await forecastResponse.json();
    const currentPeriod = forecastData.properties.periods[0];
    
    // Get detailed grid data for additional metrics
    const gridResponse = await fetch(gridpointUrl);
    if (!gridResponse.ok) {
      const errorData = await gridResponse.json();
      throw new Error(errorData.detail || "Failed to fetch detailed weather data");
    }
    
    const gridData = await gridResponse.json();
    
    // Extract and format the weather data
    const temperature = Math.round(currentPeriod.temperature);
    const windSpeed = parseInt(currentPeriod.windSpeed.replace(/[^0-9]/g, ''));
    const humidity = gridData.properties.relativeHumidity.values[0]?.value || 0;
    const pressure = gridData.properties.pressure.values[0]?.value || 0;
    const precipitation = gridData.properties.probabilityOfPrecipitation.values[0]?.value || 0;
    const clouds = gridData.properties.skyCover.values[0]?.value || 0;
    
    return {
      temperature,
      feelsLike: temperature, // NWS doesn't provide feels like directly
      humidity: Math.round(humidity),
      windSpeed,
      windDirection: 0, // Not as easily available from NWS
      condition: currentPeriod.shortForecast,
      icon: mapNWSIconToCode(currentPeriod.icon),
      precipitation: Math.round(precipitation),
      clouds: Math.round(clouds),
      pressure: Math.round(pressure / 10), // Convert to hPa
      location: pointsData.properties.relativeLocation.properties.city + ", " + 
                pointsData.properties.relativeLocation.properties.state,
      timestamp: Date.now() / 1000 // Current timestamp in seconds
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

// Fetch weather data from National Weather Service API by zipcode
// NWS doesn't directly support zipcode, so we'll use a geocoding service first
export async function getWeatherByZipcode(zipcode: string, country: string = "us"): Promise<WeatherData | null> {
  try {
    // Use the Census.gov geocoding API to convert zipcode to coordinates
    const geocodeResponse = await fetch(
      `https://geocoding.geo.census.gov/geocoder/locations/address?benchmark=2020&format=json&street=&zip=${zipcode}`
    );

    if (!geocodeResponse.ok) {
      throw new Error("Failed to geocode zipcode");
    }

    const geocodeData = await geocodeResponse.json();
    const addresses = geocodeData.result?.addressMatches;
    
    if (!addresses || addresses.length === 0) {
      throw new Error("No location found for this zipcode");
    }

    const coordinates = addresses[0].coordinates;
    const lat = coordinates.y;
    const lon = coordinates.x;

    // Now use the coordinates to get the weather
    return getWeatherByGeolocation(lat, lon);
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

function mapNWSIconToCode(iconUrl: string): string {
  // Extract the icon name from the URL
  const iconFile = iconUrl.split('/').pop() || '';
  
  // Map NWS icons to codes similar to what we used with OpenWeatherMap
  if (iconFile.includes('skc') || iconFile.includes('few')) return '01d';
  if (iconFile.includes('sct')) return '02d';
  if (iconFile.includes('bkn')) return '03d';
  if (iconFile.includes('ovc')) return '04d';
  if (iconFile.includes('rain') || iconFile.includes('ra')) return '09d';
  if (iconFile.includes('tsra')) return '11d';
  if (iconFile.includes('snow') || iconFile.includes('sn')) return '13d';
  if (iconFile.includes('fog') || iconFile.includes('fg')) return '50d';
  
  return '01d'; // Default to clear sky
}

export function getWeatherIconUrl(iconCode: string, size: "2x" | "4x" = "4x"): string {
  // Since we're not using OpenWeatherMap, let's use the NWS icons
  // But we'll continue to use the same format for compatibility
  return `https://openweathermap.org/img/wn/${iconCode}@${size}.png`;
}

export function getBackgroundClass(condition: string): string {
  const lowerCondition = condition.toLowerCase();
  
  if (lowerCondition.includes("clear") || lowerCondition.includes("sunny")) return "bg-weather-sunny";
  if (lowerCondition.includes("cloud") || lowerCondition.includes("partly")) return "bg-weather-cloudy";
  if (lowerCondition.includes("rain") || lowerCondition.includes("shower") || lowerCondition.includes("drizzle")) return "bg-weather-rainy";
  if (lowerCondition.includes("snow") || lowerCondition.includes("flurries")) return "bg-weather-snowy";
  if (lowerCondition.includes("thunder") || lowerCondition.includes("storm")) return "bg-weather-stormy";
  if (lowerCondition.includes("fog") || lowerCondition.includes("haze")) return "bg-weather-foggy";
  
  return "bg-sky";
}
