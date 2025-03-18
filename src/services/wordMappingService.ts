
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

// Generate a word based on weather parameters with extreme sensitivity to changes
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
      // Pressure removed from contributions
      factorContributions: { temperature: 0.30, humidity: 0.20, wind: 0.25, sky: 0.20, time: 0.05 } 
    };
    
    // Store for future reference
    lastWeatherData = weatherData;
    lastGeneratedWord = result;
    
    return result;
  }

  // Get normalized weather values (0-1 scale) - pressure removed
  const rawFactors = normalizeWeatherValues(weatherData);

  // Calculate weighted factor values - pressure removed
  const weightedFactors = {
    temperature: rawFactors.temperature * factorWeights.temperature,
    humidity: rawFactors.humidity * factorWeights.humidity,
    wind: rawFactors.wind * factorWeights.windSpeed,
    sky: rawFactors.sky * factorWeights.condition,
    time: rawFactors.time * factorWeights.timeOfDay
  };

  // Calculate total contribution (should be a positive value)
  const totalContribution = Object.values(weightedFactors).reduce((sum, val) => sum + Math.abs(val), 0);
  
  // Calculate factor contributions as percentages (always positive values)
  const factorContributions = Object.entries(weightedFactors).reduce((obj, [key, value]) => {
    // Ensure we're using absolute values and proper percentages
    obj[key] = totalContribution > 0 ? Math.round((Math.abs(value) / totalContribution) * 100) / 100 : 0;
    return obj;
  }, {} as Record<string, number>);

  // Enhanced randomization to make every degree, percentage and mph matter
  // Use fractional parts of each weather metric to generate variety
  const uniqueWeatherFingerprint = 
    (weatherData.temperature) + 
    (weatherData.humidity * 0.01) + 
    (weatherData.windSpeed * 0.1);
  
  // Create a pseudo-random value from the unique fingerprint
  const hashValue = Math.sin(uniqueWeatherFingerprint) * 10000;
  const randomOffset = (hashValue - Math.floor(hashValue)) * 0.2; // 0-0.2 range
  
  // Calculate composite score plus high-sensitivity randomization
  const compositeScore = (
    (Object.values(weightedFactors).reduce((sum, val) => sum + val, 0) / 
    Object.values(factorWeights).reduce((sum, val) => sum + val, 0))
  );
  
  // Make sure small changes have big impacts on word selection
  // Use modulo of exact values to create a unique signature
  const microVariations = 
    ((weatherData.temperature % 1) * 0.07) + 
    ((weatherData.humidity % 1) * 0.05) + 
    ((weatherData.windSpeed % 1) * 0.05);
  
  // Add timestamp variation to ensure refreshes give different results
  const timeVariation = ((Date.now() % 10000) / 10000) * 0.05;
  
  // Combine everything to create a final score
  const finalScore = compositeScore + randomOffset + microVariations + timeVariation;
  
  // Normalize to ensure we stay within 0-1 range
  const normalizedFinalScore = Math.max(0, Math.min(0.999, finalScore));
  
  // Use the highly sensitive final score to select a word
  const index = Math.floor(normalizedFinalScore * wordDictionary.length);
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
