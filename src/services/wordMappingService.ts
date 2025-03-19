
import { WeatherData } from "./weatherService";
import { getDictionary } from "./dictionaryService";
import { 
  factorWeights, 
  mapConditionToValue, 
  getTimeOfDayValue, 
  normalizeWeatherValues
} from "./weatherMappingUtils";
import { getReliableWordsList } from "./definitionService";

/**
 * Generate a word based on weather parameters.
 * Each unique combination of weather values will ALWAYS generate the same word.
 */
export function generateWeatherWord(weatherData: WeatherData): { 
  word: string, 
  factorContributions: Record<string, number> 
} {
  // Get the dictionary of words
  const wordDictionary = getDictionary();
  
  if (!weatherData || wordDictionary.length === 0) {
    // If no dictionary is available yet, use our reliable words list
    const reliableWords = getReliableWordsList();
    const hashValue = hashWeatherData(weatherData);
    const index = Math.abs(hashValue) % reliableWords.length;
    
    const result = { 
      word: reliableWords[index], 
      factorContributions: { temperature: 0.30, humidity: 0.20, wind: 0.25, sky: 0.20, time: 0.05 } 
    };
    
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
    time: rawFactors.time * factorWeights.timeOfDay
  };

  // Calculate total contribution
  const totalContribution = Object.values(weightedFactors).reduce((sum, val) => sum + Math.abs(val), 0);
  
  // Calculate factor contributions as percentages
  const factorContributions = Object.entries(weightedFactors).reduce((obj, [key, value]) => {
    obj[key] = totalContribution > 0 ? Math.round((Math.abs(value) / totalContribution) * 100) / 100 : 0;
    return obj;
  }, {} as Record<string, number>);

  // Create a deterministic hash value from the weather data
  const hashValue = hashWeatherData(weatherData);
  
  // Use the hash to determine the word index
  // We use absolute value and modulo to ensure we stay within array bounds
  const index = Math.abs(hashValue) % wordDictionary.length;
  
  return { 
    word: wordDictionary[index],
    factorContributions
  };
}

/**
 * Creates a numeric hash from weather data that will be consistent
 * for the same weather conditions
 */
function hashWeatherData(weatherData: WeatherData): number {
  if (!weatherData) return 0;
  
  // Round values to reasonable precision to ensure consistency
  const temp = Math.round(weatherData.temperature);
  const humidity = Math.round(weatherData.humidity);
  const wind = Math.round(weatherData.windSpeed);
  const condition = mapConditionToValue(weatherData.condition);
  
  // Include time of day in the hash calculation
  const timeOfDay = Math.round(getTimeOfDayValue() * 100);
  
  // Create a deterministic hash using the djb2 algorithm
  let hash = 5381;
  
  // Include each weather factor in the hash
  hash = ((hash << 5) + hash) + temp;
  hash = ((hash << 5) + hash) + humidity;
  hash = ((hash << 5) + hash) + wind;
  hash = ((hash << 5) + hash) + Math.round(condition * 100);
  hash = ((hash << 5) + hash) + timeOfDay; // Add time to the hash calculation
  
  return hash;
}
