
import { WeatherData } from "./weatherService";

// This is a simplified version - in a real app, we'd use a much larger dictionary
const wordDictionary = [
  "serenity", "zephyr", "cascade", "luminous", "verdant", "ethereal", "radiance", "tranquil", "whisper", "gentle",
  "tempest", "torrent", "deluge", "cyclone", "maelstrom", "turbulent", "tumultuous", "typhoon", "whirlwind", "blizzard",
  "crystalline", "glacial", "pristine", "powdery", "frosty", "icicle", "shimmering", "blanket", "alpine", "crisp",
  "azure", "cerulean", "sapphire", "expansive", "boundless", "infinite", "celestial", "cosmic", "heavenly", "zenith",
  "misty", "nebulous", "obscured", "veiled", "foggy", "shrouded", "enigmatic", "mysterious", "ghostly", "spectral",
  "scorching", "blazing", "searing", "sweltering", "torrid", "arid", "parched", "blistering", "fiery", "intense",
  "balmy", "tepid", "mild", "pleasant", "comfortable", "genial", "benign", "favorable", "idyllic", "perfect",
  "biting", "bitter", "brisk", "chilling", "nippy", "piercing", "raw", "frigid", "arctic", "gelid",
  "damp", "dewy", "moist", "muggy", "humid", "clammy", "sticky", "sultry", "steamy", "tropical",
  "gusty", "blustery", "drafty", "squally", "whistling", "howling", "roaring", "rushing", "swirling", "eddying",
  "amber", "golden", "resplendent", "brilliant", "dazzling", "glittering", "shining", "glowing", "vibrant", "vivid",
  "somber", "gloomy", "mournful", "melancholy", "dreary", "dismal", "bleak", "depressing", "oppressive", "foreboding",
  "refreshing", "invigorating", "revitalizing", "rejuvenating", "energizing", "stimulating", "exhilarating", "bracing", "enlivening", "reviving"
];

// Factor weights determine how much each weather parameter influences the word selection
const factorWeights = {
  temperature: 0.25,
  humidity: 0.15,
  windSpeed: 0.2,
  condition: 0.25,
  timeOfDay: 0.1,
  pressure: 0.05
};

// Map weather conditions to values between 0-1
function mapConditionToValue(condition: string): number {
  const conditionMap: Record<string, number> = {
    "Clear": 0.9,
    "Sunny": 0.95,
    "Clouds": 0.5,
    "Scattered Clouds": 0.6,
    "Broken Clouds": 0.4,
    "Overcast": 0.3,
    "Mist": 0.45,
    "Fog": 0.2,
    "Rain": 0.1,
    "Light Rain": 0.25,
    "Moderate Rain": 0.15,
    "Heavy Rain": 0.05,
    "Thunderstorm": 0.01,
    "Snow": 0.3,
    "Light Snow": 0.4,
    "Heavy Snow": 0.1,
    "Drizzle": 0.35,
    "Haze": 0.55,
    "Partly Cloudy": 0.7,
    "Mostly Cloudy": 0.4,
    "Mostly Clear": 0.8,
    "Partly Sunny": 0.75,
    "Mostly Sunny": 0.85,
    "Fair": 0.8,
    "Few Clouds": 0.7
  };

  // Try to match the condition text with our map
  for (const [key, value] of Object.entries(conditionMap)) {
    if (condition.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  // Default to middle value if condition not found
  return 0.5;
}

// Map time of day to value between 0-1 (0 = midnight, 0.5 = noon, 1 = just before midnight)
function getTimeOfDayValue(): number {
  const hour = new Date().getHours();
  return hour / 24;
}

// Generate a word based on weather parameters
export function generateWeatherWord(weatherData: WeatherData): { word: string, factorContributions: Record<string, number> } {
  if (!weatherData) return { word: "unknown", factorContributions: {} };

  // Normalize values to range 0-1
  const temperatureValue = (weatherData.temperature - 0) / 100; // Assuming range 0-100°F
  const humidityValue = weatherData.humidity / 100;
  const windSpeedValue = Math.min(weatherData.windSpeed / 30, 1); // Normalize wind 0-30 mph
  const conditionValue = mapConditionToValue(weatherData.condition);
  const timeValue = getTimeOfDayValue();
  const pressureValue = (weatherData.pressure - 970) / 60; // Normalize pressure ~970-1030 hPa

  // Raw factor values (normalized between 0-1)
  const rawFactors = {
    temperature: temperatureValue,
    humidity: humidityValue,
    wind: windSpeedValue,
    sky: conditionValue,
    time: timeValue,
    pressure: pressureValue
  };

  // Calculate weighted factor values
  const weightedFactors = {
    temperature: temperatureValue * factorWeights.temperature,
    humidity: humidityValue * factorWeights.humidity,
    wind: windSpeedValue * factorWeights.windSpeed,
    sky: conditionValue * factorWeights.condition,
    time: timeValue * factorWeights.timeOfDay,
    pressure: pressureValue * factorWeights.pressure
  };

  // Calculate factor contributions as a percentage of the total
  const totalWeight = Object.values(weightedFactors).reduce((sum, val) => sum + val, 0);
  const factorContributions = Object.entries(weightedFactors).reduce((obj, [key, value]) => {
    obj[key] = value / totalWeight;
    return obj;
  }, {} as Record<string, number>);

  // Calculate a composite score
  const compositeScore = totalWeight;

  // Use the composite score to select a word from the dictionary
  const index = Math.floor(compositeScore * (wordDictionary.length - 1));
  return { 
    word: wordDictionary[index] || "enigmatic",
    factorContributions
  };
}

// Function to determine if weather has changed significantly
export function hasWeatherChangedSignificantly(
  oldData: WeatherData | null, 
  newData: WeatherData
): boolean {
  if (!oldData) return true;

  // Define thresholds for significant changes
  const tempThreshold = 3; // 3°F change
  const humidityThreshold = 10; // 10% change
  const windThreshold = 5; // 5 mph change
  const timeThreshold = 3600; // 1 hour (in seconds)

  // Check if any parameter exceeds threshold
  return (
    Math.abs(oldData.temperature - newData.temperature) > tempThreshold ||
    Math.abs(oldData.humidity - newData.humidity) > humidityThreshold ||
    Math.abs(oldData.windSpeed - newData.windSpeed) > windThreshold ||
    oldData.condition !== newData.condition ||
    (newData.timestamp - oldData.timestamp) > timeThreshold
  );
}
