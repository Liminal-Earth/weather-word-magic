import { WeatherData } from "./weatherService";

// Factor weights determine how much each weather parameter influences the word selection
export const factorWeights = {
  temperature: 0.30,
  humidity: 0.20,
  windSpeed: 0.25,
  condition: 0.20,
  timeOfDay: 0.05
};

// Enhanced mapping for weather conditions with much more granularity
export function mapConditionToValue(condition: string): number {
  // Expanded condition map with more specific gradations from 0-1
  const conditionMap: Record<string, number> = {
    // Clear/Sunny conditions (0.9-1.0)
    "Clear": 0.92,
    "Sunny": 0.98,
    "Mostly Clear": 0.86,
    "Mostly Sunny": 0.88,
    "Fair": 0.82,
    
    // Partly cloudy conditions (0.6-0.8)
    "Partly Cloudy": 0.75,
    "Partly Sunny": 0.78,
    "Few Clouds": 0.80,
    "Scattered Clouds": 0.68,
    
    // Mostly cloudy conditions (0.4-0.6)
    "Broken Clouds": 0.55,
    "Mostly Cloudy": 0.45,
    "Clouds": 0.50,
    
    // Hazy/Misty conditions (0.3-0.5)
    "Haze": 0.48,
    "Mist": 0.40,
    "Fog": 0.25,
    "Dense Fog": 0.15,
    
    // Overcast conditions (0.2-0.4)
    "Overcast": 0.30,
    
    // Light precipitation (0.2-0.3)
    "Drizzle": 0.28,
    "Light Rain": 0.26,
    "Chance Light Rain": 0.32,
    "Light Snow": 0.24,
    "Flurries": 0.27,
    
    // Moderate precipitation (0.1-0.2)
    "Moderate Rain": 0.18,
    "Snow": 0.16,
    "Rain": 0.15,
    "Freezing Rain": 0.14,
    "Wintry Mix": 0.13,
    "Sleet": 0.12,
    
    // Heavy precipitation (0-0.1)
    "Heavy Rain": 0.08,
    "Heavy Snow": 0.06,
    "Blizzard": 0.03,
    
    // Severe weather (0-0.05)
    "Thunderstorm": 0.05,
    "Severe Thunderstorm": 0.02,
    "Tornado": 0.01,
    "Hurricane": 0.01,
    "Tropical Storm": 0.02
  };

  // Try to find exact matches in our map
  if (conditionMap[condition]) {
    return conditionMap[condition];
  }
  
  // If no exact match, search through the conditions for partial matches
  const lowerCondition = condition.toLowerCase();
  for (const [key, value] of Object.entries(conditionMap)) {
    if (lowerCondition.includes(key.toLowerCase())) {
      return value;
    }
  }

  // Default to middle value if condition not found
  return 0.5;
}

// Map time of day to value between 0-1 (0 = midnight, 0.5 = noon, 1 = just before midnight)
export function getTimeOfDayValue(): number {
  const hour = new Date().getHours();
  return hour / 24;
}

// Function to normalize weather values to range 0-1
export function normalizeWeatherValues(weatherData: WeatherData) {
  // More nuanced normalization of values to range 0-1
  const temperatureValue = Math.max(0, Math.min(1, (weatherData.temperature - (-20)) / 120)); // Assuming range -20°F to 100°F
  const humidityValue = weatherData.humidity / 100;
  const windSpeedValue = Math.min(Math.pow(weatherData.windSpeed / 50, 0.7), 1); // Better curve for wind speeds
  const conditionValue = mapConditionToValue(weatherData.condition);
  const timeValue = getTimeOfDayValue();

  return {
    temperature: temperatureValue,
    humidity: humidityValue,
    wind: windSpeedValue,
    sky: conditionValue,
    time: timeValue
  };
}

// Function to determine if weather has changed significantly - extremely sensitive to small changes
export function hasWeatherChangedSignificantly(
  oldData: WeatherData | null, 
  newData: WeatherData
): boolean {
  if (!oldData) return true;
  
  // Check if location has changed
  if (oldData.location !== newData.location) return true;
  
  // Any change at all should generate a new word, so no time threshold
  
  // Extremely sensitive thresholds for weather changes - any measurable difference matters
  const tempDiff = Math.abs(newData.temperature - oldData.temperature);
  if (tempDiff >= 1) return true; // Just 1 degree temperature change
  
  const humidityDiff = Math.abs(newData.humidity - oldData.humidity);
  if (humidityDiff >= 1) return true; // Just 1% humidity change
  
  const windDiff = Math.abs(newData.windSpeed - oldData.windSpeed);
  if (windDiff >= 1) return true; // Just 1 mph wind speed change
  
  const conditionChanged = newData.condition !== oldData.condition;
  if (conditionChanged) return true;
  
  // If none of the above conditions are met, weather hasn't changed significantly
  return false;
}
