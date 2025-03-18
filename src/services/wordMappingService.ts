
import { WeatherData } from "./weatherService";
import { getDictionary } from "./dictionaryService";
import { 
  factorWeights, 
  mapConditionToValue, 
  getTimeOfDayValue, 
  normalizeWeatherValues,
  hasWeatherChangedSignificantly
} from "./weatherMappingUtils";
import { getReliableWordsList } from "./definitionService";

// Cache the last word result to avoid unnecessary regeneration and API calls
let lastWeatherData: WeatherData | null = null;
let lastWordResult: { word: string, factorContributions: Record<string, number> } | null = null;

// Generate a word based on weather parameters with much finer granularity
export function generateWeatherWord(weatherData: WeatherData): { 
  word: string, 
  factorContributions: Record<string, number> 
} {
  // Check if weather data is the same as the last request
  if (lastWeatherData && lastWordResult && 
      !hasWeatherChangedSignificantly(lastWeatherData, weatherData)) {
    console.log("Using cached word result - weather hasn't changed significantly");
    return lastWordResult;
  }
  
  // Get the dictionary of words (now with verified definitions)
  const wordDictionary = getDictionary();
  
  if (!weatherData || wordDictionary.length === 0) {
    // If no dictionary is available yet, use our reliable words list
    const reliableWords = getReliableWordsList();
    const result = { word: reliableWords[0], factorContributions: {} };
    lastWeatherData = { ...weatherData };
    lastWordResult = result;
    return result;
  }

  // Get normalized weather values (0-1 scale)
  const rawFactors = normalizeWeatherValues(weatherData);

  // Calculate weighted factor values
  const weightedFactors = {
    temperature: rawFactors.temperature * factorWeights.temperature,
    humidity: rawFactors.humidity * factorWeights.humidity,
    wind: rawFactors.wind * factorWeights.windSpeed,
    sky: rawFactors.sky * factorWeights.condition,
    time: rawFactors.time * factorWeights.timeOfDay,
    pressure: rawFactors.pressure * factorWeights.pressure
  };

  // Calculate total contribution (should be a positive value)
  const totalContribution = Object.values(weightedFactors).reduce((sum, val) => sum + Math.abs(val), 0);
  
  // Calculate factor contributions as percentages (always positive values)
  const factorContributions = Object.entries(weightedFactors).reduce((obj, [key, value]) => {
    // Ensure we're using absolute values and proper percentages
    obj[key] = totalContribution > 0 ? Math.round((Math.abs(value) / totalContribution) * 100) / 100 : 0;
    return obj;
  }, {} as Record<string, number>);

  // Calculate a composite score for word selection (always between 0 and 1)
  const compositeScore = Object.values(weightedFactors).reduce((sum, val) => sum + val, 0) / 
                        Object.values(factorWeights).reduce((sum, val) => sum + val, 0);
  
  // Ensure the composite score is between 0 and 1
  const normalizedScore = Math.max(0, Math.min(1, compositeScore));
  
  // Use the normalized score to directly select a word from the dictionary
  // This makes the selection deterministic based on weather conditions
  const index = Math.floor(normalizedScore * (wordDictionary.length - 1));
  const finalIndex = Math.max(0, Math.min(wordDictionary.length - 1, index));
  
  const result = { 
    word: wordDictionary[finalIndex] || getReliableWordsList()[0],
    factorContributions
  };
  
  // Cache the result and weather data (make a copy to avoid reference issues)
  lastWeatherData = { ...weatherData };
  lastWordResult = { ...result };
  
  return result;
}

// Re-export the hasWeatherChangedSignificantly function
export { hasWeatherChangedSignificantly };
