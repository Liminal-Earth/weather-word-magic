
import { toast } from "@/components/ui/use-toast";

// We'll use localStorage to store the user's API key
const getApiKey = (): string => {
  return localStorage.getItem("openweather_api_key") || "";
};

// Function to save API key to localStorage
export const saveApiKey = (apiKey: string): void => {
  localStorage.setItem("openweather_api_key", apiKey);
};

// Function to check if API key exists
export const hasApiKey = (): boolean => {
  return !!getApiKey();
};

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

export async function getWeatherByGeolocation(lat: number, lon: number): Promise<WeatherData | null> {
  try {
    const apiKey = getApiKey();
    
    if (!apiKey) {
      throw new Error("OpenWeatherMap API key not found. Please set your API key first.");
    }
    
    // Use OpenWeatherMap API
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch weather data");
    }

    const data = await response.json();
    
    return {
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed),
      windDirection: data.wind.deg,
      condition: data.weather[0].main,
      icon: data.weather[0].icon,
      precipitation: data.rain ? Math.round(data.rain["1h"] || 0) : 0,
      clouds: data.clouds.all,
      pressure: Math.round(data.main.pressure),
      location: `${data.name}, ${data.sys.country}`,
      timestamp: data.dt
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

export async function getWeatherByZipcode(zipcode: string, country: string = "us"): Promise<WeatherData | null> {
  try {
    const apiKey = getApiKey();
    
    if (!apiKey) {
      throw new Error("OpenWeatherMap API key not found. Please set your API key first.");
    }
    
    // Use OpenWeatherMap API directly with zipcode
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?zip=${zipcode},${country}&units=imperial&appid=${apiKey}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Failed to fetch weather data");
    }

    const data = await response.json();
    
    return {
      temperature: Math.round(data.main.temp),
      feelsLike: Math.round(data.main.feels_like),
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed),
      windDirection: data.wind.deg,
      condition: data.weather[0].main,
      icon: data.weather[0].icon,
      precipitation: data.rain ? Math.round(data.rain["1h"] || 0) : 0,
      clouds: data.clouds.all,
      pressure: Math.round(data.main.pressure),
      location: `${data.name}, ${data.sys.country}`,
      timestamp: data.dt
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
