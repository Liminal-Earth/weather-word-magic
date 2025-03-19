
// Verified words service for managing words with confirmed definitions
import { getReliableWordsList } from '../definitionService';
import { getDictionary } from './dictionaryLoader';

// Array of words with verified definitions
let verifiedWordDictionary: string[] = [];
// Flag to prevent multiple concurrent word verifications
let isVerifyingWords = false;

/**
 * Verify words by fetching their definitions
 * Only called when explicitly needed
 */
export async function verifyWordsWithDefinitions(count: number = 20): Promise<string[]> {
  // If already verifying or we have enough verified words, don't start
  if (isVerifyingWords || verifiedWordDictionary.length > 100) {
    return verifiedWordDictionary;
  }
  
  isVerifyingWords = true;
  console.log("Starting to verify words with definitions...");
  
  // Import the definition service
  const { fetchWordDefinition } = await import("../definitionService");
  
  // Process words in smaller batches to avoid overwhelming the API
  const batchSize = 3;
  let processedCount = 0;
  
  // Create a copy of the dictionary to work with - use a smaller sample for verification
  const wordsToVerify = [...getDictionary()].slice(0, 150); // Limit to 150 for practical reasons
  
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
    const { getFallbackDictionary } = await import('./fallbackDictionary');
    verifiedWordDictionary = [...verifiedWordDictionary, ...getFallbackDictionary()];
    console.log(`Using fallback dictionary to supplement. Now have ${verifiedWordDictionary.length} words.`);
  }
  
  isVerifyingWords = false;
  return verifiedWordDictionary;
}

/**
 * Initialize the verified words list with reliable words
 */
export function initializeVerifiedWords(): void {
  if (verifiedWordDictionary.length === 0) {
    verifiedWordDictionary = getReliableWordsList();
  }
}
