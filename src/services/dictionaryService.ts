// Dictionary service responsible for loading and managing the word dictionary
import { getReliableWordsList } from './definitionService';

// Store the dictionary of words
let wordDictionary: string[] = [];
// Array of words with verified definitions
let verifiedWordDictionary: string[] = [];
// Track if we've already initialized the dictionary
let isDictionaryInitialized = false;
// Flag to track if initialization has been requested
let initializationRequested = false;
// Flag to prevent multiple concurrent word verifications
let isVerifyingWords = false;

// Function to initialize the dictionary with many words
export async function initializeDictionary(): Promise<string[]> {
  // If already initialized or in progress, don't start again
  if (isDictionaryInitialized || initializationRequested) {
    return verifiedWordDictionary.length > 0 ? verifiedWordDictionary : getReliableWordsList();
  }
  
  // Mark that initialization has been requested to prevent duplicate calls
  initializationRequested = true;
  
  // Start with our reliable words to ensure we always have some good options
  verifiedWordDictionary = getReliableWordsList();
  
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
      // Shuffle the array using Fisher-Yates algorithm to ensure diversity
      .sort(() => Math.random() - 0.5)
      // Limit to a reasonable number that's still very large
      .slice(0, 15000);
    
    console.log(`Dictionary initialized with ${wordDictionary.length} words`);
    
    // Set the initialized flag
    isDictionaryInitialized = true;
    
    // We'll use just the reliable words list initially
    // We will NOT automatically verify words - this will only happen when explicitly requested
    
    return wordDictionary;
  } catch (error) {
    console.error("Error initializing dictionary:", error);
    // Fallback to a smaller set of interesting words if fetch fails
    wordDictionary = getFallbackDictionary();
    console.log(`Using fallback dictionary with ${wordDictionary.length} words`);
    
    // Fallback dictionary already has verified words
    verifiedWordDictionary = [...getReliableWordsList(), ...wordDictionary];
    
    // We're done initializing, even though it was with fallback data
    isDictionaryInitialized = true;
    
    return wordDictionary;
  }
}

// Function to verify words with definitions - ONLY called when explicitly needed
export async function verifyWordsWithDefinitions(count: number = 20): Promise<string[]> {
  // If already verifying or we have enough verified words, don't start
  if (isVerifyingWords || verifiedWordDictionary.length > 100) {
    return verifiedWordDictionary;
  }
  
  isVerifyingWords = true;
  console.log("Starting to verify words with definitions...");
  
  // Import the definition service
  const { fetchWordDefinition } = await import("./definitionService");
  
  // Process words in smaller batches to avoid overwhelming the API
  const batchSize = 3;
  let processedCount = 0;
  
  // Create a copy of the dictionary to work with - use a smaller sample for verification
  const wordsToVerify = [...wordDictionary].slice(0, 150); // Limit to 150 for practical reasons
  
  for (let i = 0; i < wordsToVerify.length; i += batchSize) {
    if (verifiedWordDictionary.length >= count) {
      // We have enough verified words, stop processing
      break;
    }
    
    const batch = wordsToVerify.slice(i, i + batchSize);
    
    // Process each batch in sequence to be more gentle on the API
    for (const word of batch) {
      try {
        const definition = await fetchWordDefinition(word);
        if (definition) {
          verifiedWordDictionary.push(word);
        }
      } catch (error) {
        // Skip words that cause errors
        console.error(`Error verifying word "${word}":`, error);
      }
      
      // Substantial delay between requests to avoid API rate limits
      await new Promise(resolve => setTimeout(resolve, 2000)); // Increased delay to 2 seconds
    }
    
    processedCount += batch.length;
    console.log(`Verified ${processedCount}/${wordsToVerify.length} words. Found ${verifiedWordDictionary.length} with definitions.`);
  }
  
  console.log(`Word verification complete. ${verifiedWordDictionary.length} words have definitions.`);
  
  // If we couldn't verify many words, use the fallback dictionary
  if (verifiedWordDictionary.length < 20) {
    verifiedWordDictionary = [...verifiedWordDictionary, ...getFallbackDictionary()];
    console.log(`Using fallback dictionary to supplement. Now have ${verifiedWordDictionary.length} words.`);
  }
  
  isVerifyingWords = false;
  return verifiedWordDictionary;
}

// Get the current dictionary or initialize if empty
export function getDictionary(): string[] {
  // Always use verified words when available
  if (verifiedWordDictionary.length > 0) {
    return verifiedWordDictionary;
  }
  
  // If not initialized yet, start initialization process but return reliable words
  if (!isDictionaryInitialized && !initializationRequested) {
    // Schedule initialization with a delay to avoid immediate execution
    setTimeout(() => {
      if (!initializationRequested) {
        initializeDictionary();
      }
    }, 3000);
  }
  
  // Fallback to reliable words if no verified words yet
  return getReliableWordsList();
}

// Fallback dictionary with a selection of interesting words
function getFallbackDictionary(): string[] {
  return [
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
}

// Start loading the dictionary but with a significant delay to avoid immediate API calls
// Only do this if the app is likely to need weather words soon
setTimeout(() => {
  // We'll initialize when the user first interacts with the app
  // This will be triggered when they request weather data
}, 5000);
