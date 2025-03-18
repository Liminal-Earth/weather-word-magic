
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

// Previous weather data to avoid regenerating words for similar conditions
let lastWeatherData: WeatherData | null = null;
let lastGeneratedWord: { word: string, factorContributions: Record<string, number> } | null = null;

// Generate a word based on weather parameters with increased sensitivity to small changes
export function generateWeatherWord(weatherData: WeatherData): { 
  word: string, 
  factorContributions: Record<string, number> 
} {
  // If we have a previously generated word and the weather hasn't changed significantly, return the same word
  if (lastWeatherData && lastGeneratedWord && !hasWeatherChangedSignificantly(lastWeatherData, weatherData)) {
    return lastGeneratedWord;
  }
  
  // Get the dictionary of words (now with verified definitions)
  const wordDictionary = getDictionary();
  
  if (!weatherData || wordDictionary.length === 0) {
    // If no dictionary is available yet, use our reliable words list
    const reliableWords = getReliableWordsList();
    const randomIndex = Math.floor(Math.random() * reliableWords.length);
    const result = { 
      word: reliableWords[randomIndex], 
      factorContributions: { temperature: 0.2, humidity: 0.2, wind: 0.2, sky: 0.2, time: 0.1, pressure: 0.1 } 
    };
    
    // Store for future reference
    lastWeatherData = weatherData;
    lastGeneratedWord = result;
    
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

  // Add a random seed based on the exact weather values to introduce more variety
  // This will cause small differences in weather to potentially yield different words
  const randomSeed = 
    (weatherData.temperature * 0.01) + 
    (weatherData.humidity * 0.005) + 
    (weatherData.windSpeed * 0.02) + 
    (weatherData.timestamp % 100) * 0.001;
  
  // Calculate a composite score for word selection
  const compositeScore = (
    (Object.values(weightedFactors).reduce((sum, val) => sum + val, 0) / 
    Object.values(factorWeights).reduce((sum, val) => sum + val, 0))
    + (randomSeed * 0.15)  // Add randomness factor (15% weight)
  );
  
  // Ensure the composite score is between 0 and 1
  const normalizedScore = Math.max(0, Math.min(1, compositeScore));
  
  // Add jitter to increase sensitivity to small weather changes
  // Use exact temperature, humidity and wind values to create tiny variations
  const jitterFactor = 
    ((weatherData.temperature % 1) * 0.03) + 
    ((weatherData.humidity % 1) * 0.02) + 
    ((weatherData.windSpeed % 1) * 0.02);
  
  const finalScore = Math.max(0, Math.min(1, normalizedScore + jitterFactor));
  
  // Use the final score to select a word from the dictionary
  const index = Math.floor(finalScore * (wordDictionary.length - 1));
  const finalIndex = Math.max(0, Math.min(wordDictionary.length - 1, index));
  
  const result = { 
    word: wordDictionary[finalIndex] || getReliableWordsList()[0],
    factorContributions
  };
  
  // Store for future reference
  lastWeatherData = weatherData;
  lastGeneratedWord = result;
  
  return result;
}
