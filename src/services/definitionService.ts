
/**
 * Service for fetching word definitions directly from Dictionary.com
 */

// List of reliable words with known definitions to use as fallback only when API fails
const reliableWords = [
  { word: "serenity", definition: "The state of being calm, peaceful, and untroubled." },
  { word: "luminous", definition: "Full of or shedding light; bright or shining." },
  { word: "cascade", definition: "A small waterfall, typically one of several that fall in stages." },
  { word: "tranquil", definition: "Free from disturbance; calm." },
  { word: "ethereal", definition: "Extremely delicate and light in a way that seems too perfect for this world." },
  { word: "tempest", definition: "A violent windy storm." },
  { word: "pristine", definition: "In its original condition; unspoiled." },
  { word: "azure", definition: "Bright blue in color like a cloudless sky." },
  { word: "celestial", definition: "Positioned in or relating to the sky, or outer space as observed in astronomy." },
  { word: "enigmatic", definition: "Difficult to interpret or understand; mysterious." }
];

/**
 * Fetch the definition directly from Dictionary.com
 * This uses web scraping as Dictionary.com doesn't have a public API
 * 
 * IMPORTANT: This should ONLY be called when a user explicitly requests a definition
 */
export async function fetchWordDefinition(word: string): Promise<string | null> {
  try {
    console.log(`Fetching definition for "${word}" from Dictionary.com...`);
    
    // First, check if it's in our reliable words list (only as last resort)
    const reliableMatch = reliableWords.find(w => w.word.toLowerCase() === word.toLowerCase());
    
    // Fetch from Dictionary.com with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    const response = await fetch(
      `https://www.dictionary.com/browse/${encodeURIComponent(word)}`,
      { signal: controller.signal }
    );
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.log(`No definition found for "${word}" on Dictionary.com`);
      return reliableMatch?.definition || null;
    }
    
    const html = await response.text();
    
    // Extract the definition using regex pattern matching
    // Looking for the primary definition in Dictionary.com's HTML structure
    const definitionRegex = /<span class="one-click-content css-nnyc96 e1q3nk1v1">([^<]+)<\/span>/;
    const match = html.match(definitionRegex);
    
    if (match && match[1]) {
      const definition = match[1].trim();
      console.log(`Definition found for "${word}": ${definition}`);
      return definition;
    }
    
    // Try alternate pattern if the first one fails
    const altRegex = /<div class="css-10n32it e1hk9ate0">([^<]+)<\/div>/;
    const altMatch = html.match(altRegex);
    
    if (altMatch && altMatch[1]) {
      const definition = altMatch[1].trim();
      console.log(`Definition found (alt method) for "${word}": ${definition}`);
      return definition;
    }
    
    // If extraction fails but page loaded, return a generic message
    if (html.includes(`>${word}<`)) {
      return `This word exists in Dictionary.com but we couldn't extract the definition.`;
    }
    
    // If all else fails, use reliable words as fallback
    if (reliableMatch) {
      return reliableMatch.definition;
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching definition for '${word}':`, error);
    
    // For network errors, check if we have reliable words that match
    const reliableMatch = reliableWords.find(w => w.word.toLowerCase() === word.toLowerCase());
    if (reliableMatch) {
      return reliableMatch.definition;
    }
    
    return null;
  }
}

/**
 * Get a list of words that are guaranteed to have definitions - used only as fallback
 */
export function getReliableWordsList(): string[] {
  return reliableWords.map(item => item.word);
}
