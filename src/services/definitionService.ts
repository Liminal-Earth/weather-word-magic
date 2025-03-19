
/**
 * Service for fetching word definitions directly from Dictionary.com
 * This is a facade that delegates to specialized modules
 */

import { fetchDictionaryDefinition } from './dictionary/definitionFetcher';
import { getReliableWordsList, findReliableWordDefinition } from './dictionary/reliableWords';

/**
 * Fetch the definition directly from Dictionary.com through a CORS proxy
 * This uses web scraping as Dictionary.com doesn't have a public API
 * 
 * IMPORTANT: This should ONLY be called when a user explicitly requests a definition
 */
export async function fetchWordDefinition(word: string): Promise<string | null> {
  try {
    console.log(`Starting definition fetch for "${word}"...`);
    
    // First check if it's in our reliable words list - quick and reliable
    const reliableDefinition = findReliableWordDefinition(word);
    if (reliableDefinition) {
      console.log(`Found reliable definition for "${word}"`);
      return reliableDefinition;
    }
    
    // Not in reliable words, fetch from Dictionary.com
    return await fetchDictionaryDefinition(word);
    
  } catch (error) {
    console.error(`Error in fetchWordDefinition for '${word}':`, error);
    return "An error occurred while fetching the definition.";
  }
}

/**
 * Get a list of words that are guaranteed to have definitions - used only as fallback
 */
export { getReliableWordsList };
