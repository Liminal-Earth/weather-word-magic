
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
 * Fetch the definition directly from Dictionary.com through a CORS proxy
 * This uses web scraping as Dictionary.com doesn't have a public API
 * 
 * IMPORTANT: This should ONLY be called when a user explicitly requests a definition
 */
export async function fetchWordDefinition(word: string): Promise<string | null> {
  try {
    console.log(`Fetching definition for "${word}" from Dictionary.com...`);
    
    // Use a CORS proxy to avoid cross-origin issues
    // We'll use the allorigins.win service which is free and reliable for this purpose
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.dictionary.com/browse/${encodeURIComponent(word)}`)}`;
    
    // Fetch from Dictionary.com with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    console.log(`Sending request through proxy: ${proxyUrl}`);
    const response = await fetch(proxyUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.log(`No definition found for "${word}" (HTTP ${response.status})`);
      // Only use reliable words as a last resort if they happen to match
      const reliableMatch = reliableWords.find(w => w.word.toLowerCase() === word.toLowerCase());
      return reliableMatch?.definition || null;
    }
    
    const html = await response.text();
    console.log(`Received HTML response for "${word}" (${html.length} bytes), parsing definition...`);
    
    // Extract a small portion of HTML for debugging
    const sampleHtml = html.substring(0, 300) + "...";
    console.log(`Sample HTML: ${sampleHtml}`);
    
    // Try multiple regex patterns to find definitions
    // Pattern 1: Look for one-click-content spans (primary pattern)
    let definitionRegex = /<span class="one-click-content[^"]*">([^<]+)<\/span>/;
    let match = html.match(definitionRegex);
    
    if (match && match[1]) {
      const definition = match[1].trim();
      console.log(`Definition found for "${word}": ${definition}`);
      return definition;
    }
    
    // Pattern 2: Try looking for the definition value with data-testid
    definitionRegex = /<span[^>]*data-testid="[^"]*def-value[^"]*"[^>]*>([^<]+)<\/span>/;
    match = html.match(definitionRegex);
    
    if (match && match[1]) {
      const definition = match[1].trim();
      console.log(`Definition found (alt method 1) for "${word}": ${definition}`);
      return definition;
    }
    
    // Pattern 3: Look for .e1q3nk1v1 class which is commonly used for definitions
    definitionRegex = /<span[^>]*class="[^"]*e1q3nk1v1[^"]*"[^>]*>([^<]+)<\/span>/;
    match = html.match(definitionRegex);
    
    if (match && match[1]) {
      const definition = match[1].trim();
      console.log(`Definition found (alt method 2) for "${word}": ${definition}`);
      return definition;
    }
    
    // Pattern 4: Most generic approach - looking for definition sections
    definitionRegex = /<div[^>]*class="[^"]*definition[^"]*"[^>]*>(.*?)<\/div>/;
    match = html.match(definitionRegex);
    
    if (match && match[1]) {
      // Clean up HTML tags from the definition
      const definition = match[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      console.log(`Definition found (alt method 3) for "${word}": ${definition}`);
      return definition;
    }
    
    // Pattern 5: Try to match any "meaning" section
    definitionRegex = /<div[^>]*class="[^"]*meaning[^"]*"[^>]*>(.*?)<\/div>/;
    match = html.match(definitionRegex);
    
    if (match && match[1]) {
      // Clean up HTML tags from the definition
      const definition = match[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      console.log(`Definition found (alt method 4) for "${word}": ${definition}`);
      return definition;
    }
    
    // If extraction fails but page loaded, check for the word in the title
    if (html.includes(`>${word}<`) || html.toLowerCase().includes(`>${word.toLowerCase()}<`)) {
      console.log(`Word "${word}" found on page but couldn't extract definition`);
      return `This word exists in Dictionary.com but we couldn't extract the definition due to page structure changes.`;
    }
    
    console.log(`No definition patterns matched for "${word}"`);
    
    // As a last resort, use reliable words if they match
    const reliableMatch = reliableWords.find(w => w.word.toLowerCase() === word.toLowerCase());
    if (reliableMatch) {
      console.log(`Using reliable fallback definition for "${word}"`);
      return reliableMatch.definition;
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching definition for '${word}':`, error);
    
    // For network errors, try the reliable words as a last resort
    const reliableMatch = reliableWords.find(w => w.word.toLowerCase() === word.toLowerCase());
    if (reliableMatch) {
      console.log(`Using reliable fallback definition after error for "${word}"`);
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
