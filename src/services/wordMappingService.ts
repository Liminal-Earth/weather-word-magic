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
  
  // Get the dictionary of words (use the full dictionary, not just verified words)
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

  // ENHANCED: Create a unique weather fingerprint that captures the exact values
  // Each decimal place matters to create maximum variety
  const uniqueWeatherFingerprint = 
    (weatherData.temperature * 100) + 
    (weatherData.humidity * 10) + 
    (weatherData.windSpeed);
  
  // Create a pseudo-random value from the unique fingerprint
  const hashValue = Math.sin(uniqueWeatherFingerprint) * 10000;
  const randomOffset = (hashValue - Math.floor(hashValue));
  
  // Calculate composite score with enhanced sensitivity
  const compositeScore = (
    (Object.values(weightedFactors).reduce((sum, val) => sum + val, 0) / 
    Object.values(factorWeights).reduce((sum, val) => sum + val, 0))
  );
  
  // Add location as a factor - use the string length for variation
  const locationVariation = (weatherData.location.length % 10) / 100;
  
  // Add timestamp variation to ensure refreshes give different results
  const timeVariation = (Date.now() % 10000) / 10000 * 0.1;
  
  // Combine everything to create a final score with high variability
  let finalScore = (compositeScore * 0.5) + (randomOffset * 0.3) + locationVariation + timeVariation;
  
  // Ensure we get different indexes for different locations even with similar weather
  finalScore = (finalScore + (locationVariation * 5)) % 1;
  
  // Normalize to ensure we stay within 0-1 range
  const normalizedFinalScore = Math.max(0, Math.min(0.999, finalScore));
  
  // Use the sensitive final score to select a word
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
