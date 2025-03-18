
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

// Generate a word based on weather parameters with much finer granularity
export function generateWeatherWord(weatherData: WeatherData): { 
  word: string, 
  factorContributions: Record<string, number> 
} {
  // Get the dictionary of words (now with verified definitions)
  const wordDictionary = getDictionary();
  
  if (!weatherData || wordDictionary.length === 0) {
    // If no dictionary is available yet, use our reliable words list
    const reliableWords = getReliableWordsList();
    const randomIndex = Math.floor(Math.random() * reliableWords.length);
    return { 
      word: reliableWords[randomIndex], 
      factorContributions: { temperature: 0.2, humidity: 0.2, wind: 0.2, sky: 0.2, time: 0.1, pressure: 0.1 } 
    };
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
  
  return { 
    word: wordDictionary[finalIndex] || getReliableWordsList()[0],
    factorContributions
  };
}

// We no longer need to export hasWeatherChangedSignificantly since we're not using it anymore
