
import { toast } from "@/components/ui/use-toast";

// OpenWeatherMap API key - In production, store this in environment variables
const API_KEY = "1b5ee719a29a8a6ded653cd7ea0483c9"; // Updated API key

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

export async function getWeatherByZipcode(zipcode: string, country: string = "us"): Promise<WeatherData | null> {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?zip=${zipcode},${country}&appid=${API_KEY}&units=imperial`
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
      precipitation: data.rain ? data.rain["1h"] || 0 : 0,
      clouds: data.clouds.all,
      pressure: data.main.pressure,
      location: `${data.name}`,
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

export async function getWeatherByGeolocation(lat: number, lon: number): Promise<WeatherData | null> {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=imperial`
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
      precipitation: data.rain ? data.rain["1h"] || 0 : 0,
      clouds: data.clouds.all,
      pressure: data.main.pressure,
      location: `${data.name}`,
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
  
  if (lowerCondition.includes("clear")) return "bg-weather-sunny";
  if (lowerCondition.includes("cloud")) return "bg-weather-cloudy";
  if (lowerCondition.includes("rain") || lowerCondition.includes("drizzle")) return "bg-weather-rainy";
  if (lowerCondition.includes("snow")) return "bg-weather-snowy";
  if (lowerCondition.includes("thunder") || lowerCondition.includes("storm")) return "bg-weather-stormy";
  
  return "bg-sky";
}
