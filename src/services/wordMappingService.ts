
import { WeatherData } from "./weatherService";

// Create a large dictionary of words - we'll use English words with more varied vocabulary
// Instead of manually listing 10,000+ words, we'll use a function to dynamically load words
let wordDictionary: string[] = [];

// Function to initialize the dictionary with many words
async function initializeDictionary() {
  try {
    // Fetch a large dictionary of English words from a public API
    const response = await fetch(
      "https://raw.githubusercontent.com/dwyl/english-words/master/words_dictionary.json"
    );
    
    if (!response.ok) {
      throw new Error("Failed to fetch dictionary");
    }
    
    const data = await response.json();
    
    // Convert the object keys to an array of words
    wordDictionary = Object.keys(data)
      // Filter out very short words
      .filter(word => word.length > 3 && word.length < 12)
      // Filter out words that are likely not suitable (proper nouns, abbreviations, etc.)
      .filter(word => /^[a-z]+$/.test(word))
      // Limit to a reasonable number that's still very large
      .slice(0, 15000);
    
    console.log(`Dictionary initialized with ${wordDictionary.length} words`);
  } catch (error) {
    console.error("Error initializing dictionary:", error);
    // Fallback to a smaller set of interesting words if fetch fails
    wordDictionary = [
      // ... A selection of 500 interesting words as fallback
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
      "refreshing", "invigorating", "revitalizing", "rejuvenating", "energizing", "stimulating", "exhilarating", "bracing", "enlivening", "reviving",
      // More diverse words
      "ephemeral", "resonant", "synchronous", "parallel", "abstract", "abundant", "adjacent", "adventurous", "algorithmic", "ambiguous",
      "analog", "anomalous", "anonymous", "anticipatory", "arcane", "astronomical", "atmospheric", "authentic", "autonomous", "auxiliary",
      "balanced", "baroque", "botanical", "buoyant", "calibrated", "capricious", "cardinal", "cathartic", "chromatic", "cinematic",
      "cognitive", "coherent", "collective", "colloquial", "composite", "concentric", "concurrent", "conditional", "conductive", "continuous",
      "convergent", "crystallized", "cumulative", "curious", "cyclical", "defining", "deliberate", "delicate", "diagonal", "diaphanous",
      "diffuse", "digital", "dimensional", "dynamic", "eccentric", "eclectic", "economic", "elemental", "elliptical", "embedded",
      "emergent", "empirical", "enchanted", "encoded", "encompassing", "endemic", "enigmatic", "equidistant", "equinoctial", "ergonomic",
      "evocative", "evolutionary", "exponential", "extraordinary", "faceted", "factorial", "figurative", "finite", "flourishing", "fluctuating",
      "fragmented", "galactic", "geometric", "gradient", "harmonic", "holographic", "horizontal", "hypnotic", "hypothetical", "iconic",
      "identical", "idiomatic", "illuminated", "illusory", "immersive", "implicit", "improvisational", "incidental", "indicative", "indigenous",
      "inductive", "inevitable", "infinite", "innovative", "integral", "interactive", "interdependent", "intuitive", "inventive", "recursive",
      "kaleidoscopic", "kinetic", "layered", "lexical", "liminal", "linguistic", "logical", "magnetic", "manifold", "meditative",
      "melodious", "metaphoric", "microscopic", "modular", "molecular", "momentary", "monumental", "multilinear", "multiple", "mutational",
      "narrative", "nebular", "networked", "neutral", "nocturnal", "nomadic", "nonlinear", "nostalgic", "nuanced", "numeric",
      "objective", "observant", "ominous", "orbital", "organic", "oscillating", "panoramic", "paradoxical", "parametric", "particular",
      "perceptive", "peripheral", "perpetual", "phenomenal", "philosophical", "photographic", "physical", "planetary", "poetic", "polarized",
      "polygonal", "potential", "prismatic", "procedural", "profound", "progressive", "prolific", "protean", "prototypical", "proximate",
      "quantum", "quixotic", "quotidian", "radiant", "reflective", "refractive", "relative", "reminiscent", "reproductive", "revelatory",
      "rhythmic", "seasonal", "sequential", "significant", "simultaneous", "singular", "solstice", "synchronic", "synthetic", "systematic",
      "telescopic", "temporal", "tessellated", "theoretical", "threshold", "transcendent", "transitional", "ultramarine", "unfolding", "unified",
      "universal", "variant", "vector", "verbal", "vertical", "vestigial", "vibrational", "virtual", "visceral", "vortical",
      "wandering", "wavelike", "whimsical", "xenial", "zenith", "zero"
    ];
    console.log(`Using fallback dictionary with ${wordDictionary.length} words`);
  }
}

// Start loading the dictionary immediately
initializeDictionary();

// Factor weights determine how much each weather parameter influences the word selection
const factorWeights = {
  temperature: 0.25,
  humidity: 0.15,
  windSpeed: 0.2,
  condition: 0.25,
  timeOfDay: 0.1,
  pressure: 0.05
};

// Enhanced mapping for weather conditions with much more granularity
function mapConditionToValue(condition: string): number {
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
function getTimeOfDayValue(): number {
  const hour = new Date().getHours();
  return hour / 24;
}

// Generate a word based on weather parameters with much finer granularity
export function generateWeatherWord(weatherData: WeatherData): { word: string, factorContributions: Record<string, number> } {
  if (!weatherData || wordDictionary.length === 0) {
    return { word: "enigmatic", factorContributions: {} };
  }

  // More nuanced normalization of values to range 0-1
  const temperatureValue = Math.max(0, Math.min(1, (weatherData.temperature - (-20)) / 120)); // Assuming range -20°F to 100°F
  const humidityValue = weatherData.humidity / 100;
  const windSpeedValue = Math.min(Math.pow(weatherData.windSpeed / 50, 0.7), 1); // Better curve for wind speeds
  const conditionValue = mapConditionToValue(weatherData.condition);
  const timeValue = getTimeOfDayValue();
  const pressureValue = Math.max(0, Math.min(1, (weatherData.pressure - 970) / 60)); // Normalize pressure ~970-1030 hPa

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
