
// DictionaryLoader service responsible for loading the dictionary from external sources
import { getReliableWordsList } from '../definitionService';
import { getFallbackDictionary } from './fallbackDictionary';

// Store the dictionary of words
let wordDictionary: string[] = [];
// Track if we've already initialized the dictionary
let isDictionaryInitialized = false;
// Flag to track if initialization has been requested
let initializationRequested = false;

/**
 * Initialize the dictionary with many words from an external source
 */
export async function initializeDictionary(): Promise<string[]> {
  // If already initialized or in progress, don't start again
  if (isDictionaryInitialized || initializationRequested) {
    return wordDictionary.length > 0 ? wordDictionary : getReliableWordsList();
  }
  
  // Mark that initialization has been requested to prevent duplicate calls
  initializationRequested = true;
  
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
    
    return wordDictionary;
  } catch (error) {
    console.error("Error initializing dictionary:", error);
    // Fallback to a smaller set of interesting words if fetch fails
    wordDictionary = getFallbackDictionary();
    console.log(`Using fallback dictionary with ${wordDictionary.length} words`);
    
    // We're done initializing, even though it was with fallback data
    isDictionaryInitialized = true;
    
    return wordDictionary;
  }
}

/**
 * Get the current dictionary or initialize if empty
 */
export function getDictionary(): string[] {
  // Use the full dictionary of words when available
  if (wordDictionary.length > 0) {
    return wordDictionary;
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
  
  // Fallback to reliable words if no dictionary yet
  return getReliableWordsList();
}

// Start loading the dictionary but with a significant delay to avoid immediate API calls
setTimeout(() => {
  // We'll initialize when the user first interacts with the app
  // This will be triggered when they request weather data
}, 5000);
