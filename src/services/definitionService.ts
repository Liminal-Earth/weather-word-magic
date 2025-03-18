
/**
 * Service for fetching word definitions from a public dictionary API
 */

// Cache to store definitions we've already fetched
const definitionCache: Record<string, string | null> = {};

/**
 * Fetch the definition of a word from a free public dictionary API
 * Uses Free Dictionary API: https://dictionaryapi.dev/
 */
export async function fetchWordDefinition(word: string): Promise<string | null> {
  // Check if we already have this definition cached
  if (definitionCache[word] !== undefined) {
    return definitionCache[word];
  }

  try {
    // Fetch from Free Dictionary API
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        // Word not found in dictionary
        definitionCache[word] = null;
        return null;
      }
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (Array.isArray(data) && data.length > 0) {
      // Extract the first definition
      const firstEntry = data[0];
      if (firstEntry.meanings && firstEntry.meanings.length > 0) {
        const firstMeaning = firstEntry.meanings[0];
        if (firstMeaning.definitions && firstMeaning.definitions.length > 0) {
          const definition = firstMeaning.definitions[0].definition;
          // Cache the definition for future requests
          definitionCache[word] = definition;
          return definition;
        }
      }
    }
    
    // If we couldn't find a good definition format, cache as null
    definitionCache[word] = null;
    return null;
  } catch (error) {
    console.error(`Error fetching definition for '${word}':`, error);
    // Don't cache errors - we might want to retry later
    return null;
  }
}
