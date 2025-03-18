
import { WeatherData } from "./weatherService";
import { getDictionary } from "./dictionaryService";
import { 
  factorWeights, 
  mapConditionToValue, 
  getTimeOfDayValue, 
  normalizeWeatherValues,
  hasWeatherChangedSignificantly
} from "./weatherMappingUtils";

// Generate a word based on weather parameters with much finer granularity
export function generateWeatherWord(weatherData: WeatherData): { 
  word: string, 
  factorContributions: Record<string, number> 
} {
  // Get the dictionary of words
  const wordDictionary = getDictionary();
  
  if (!weatherData || wordDictionary.length === 0) {
    return { word: "enigmatic", factorContributions: {} };
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
  
  // We'll use a more sophisticated algorithm to select a word
  // Instead of just selecting by index, we'll use the normalized score to select
  // words from different regions of the dictionary, with some randomness
  
  // First, determine a base index
  const baseIndex = Math.floor(normalizedScore * (wordDictionary.length - 1));
  
  // Add some controlled randomness - select from a range near the base index
  // The range is narrower for extreme values (very high or very low scores)
  // and wider for middle range scores
  const variabilityFactor = 1 - Math.abs(normalizedScore - 0.5) * 2; // 0 at extremes, 1 in middle
  const range = Math.floor(wordDictionary.length * 0.1 * variabilityFactor); // Max 10% of dictionary size
  
  // Generate a random offset within our range
  const offset = Math.floor(Math.random() * (range * 2 + 1)) - range;
  
  // Calculate final index with bounds checking
  let finalIndex = baseIndex + offset;
  finalIndex = Math.max(0, Math.min(wordDictionary.length - 1, finalIndex));
  
  return { 
    word: wordDictionary[finalIndex] || "enigmatic",
    factorContributions
  };
}

// Re-export the hasWeatherChangedSignificantly function
export { hasWeatherChangedSignificantly };
