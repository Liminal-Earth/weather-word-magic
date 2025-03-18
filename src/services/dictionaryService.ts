
// Dictionary service responsible for loading and managing the word dictionary

// Store the dictionary of words
let wordDictionary: string[] = [];

// Function to initialize the dictionary with many words
export async function initializeDictionary(): Promise<string[]> {
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
    return wordDictionary;
  } catch (error) {
    console.error("Error initializing dictionary:", error);
    // Fallback to a smaller set of interesting words if fetch fails
    wordDictionary = getFallbackDictionary();
    console.log(`Using fallback dictionary with ${wordDictionary.length} words`);
    return wordDictionary;
  }
}

// Get the current dictionary or initialize if empty
export function getDictionary(): string[] {
  if (wordDictionary.length === 0) {
    // Start loading the dictionary immediately if it's not loaded yet
    initializeDictionary();
    return getFallbackDictionary();
  }
  return wordDictionary;
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
}

// Start loading the dictionary immediately
initializeDictionary();
