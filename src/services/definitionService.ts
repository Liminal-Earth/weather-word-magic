
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

    // First, check if we're on a "no exact match found" page
    if (html.includes("No exact matches found for") || html.includes("No results found for")) {
      console.log(`Dictionary.com has no exact match for "${word}"`);
      
      // Return fallback if available
      const reliableMatch = reliableWords.find(w => w.word.toLowerCase() === word.toLowerCase());
      return reliableMatch?.definition || null;
    }
    
    // Modern Dictionary.com patterns (2023-2024)
    
    // Find the meaning section
    const meaningSection = html.match(/<section[^>]*class="[^"]*css-[^"]*"[^>]*>[\s\S]*?<\/section>/g);
    if (meaningSection && meaningSection[0]) {
      console.log("Found meaning section, extracting definition...");
      
      // Look for definition inside the meaning section
      // Pattern 1: Direct definition spans
      let defMatch = meaningSection[0].match(/<span[^>]*class="[^"]*one-click-content[^"]*"[^>]*>([\s\S]*?)<\/span>/);
      
      if (defMatch && defMatch[1]) {
        const definition = defMatch[1].trim().replace(/\s+/g, ' ');
        console.log(`Definition found (method 1): ${definition}`);
        return definition;
      }
      
      // Pattern 2: Definition value spans
      defMatch = meaningSection[0].match(/<span[^>]*data-testid="[^"]*def-value[^"]*"[^>]*>([\s\S]*?)<\/span>/);
      
      if (defMatch && defMatch[1]) {
        const definition = defMatch[1].trim().replace(/\s+/g, ' ');
        console.log(`Definition found (method 2): ${definition}`);
        return definition;
      }
      
      // Pattern 3: Luna definition spans (newer format)
      defMatch = meaningSection[0].match(/<span[^>]*data-luna-word[^>]*>([\s\S]*?)<\/span>/);
      
      if (defMatch && defMatch[1]) {
        const definition = defMatch[1].trim().replace(/\s+/g, ' ');
        console.log(`Definition found (method 3): ${definition}`);
        return definition;
      }
      
      // Pattern 4: First paragraph in definition section
      defMatch = meaningSection[0].match(/<p[^>]*>([\s\S]*?)<\/p>/);
      
      if (defMatch && defMatch[1]) {
        const rawDef = defMatch[1];
        const definition = rawDef.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        if (definition.length > 10) {
          console.log(`Definition found (method 4): ${definition}`);
          return definition;
        }
      }
    }
    
    // Pattern 5: Look for definitions in any section with key classnames
    const defSectionMatch = html.match(/<div[^>]*class="[^"]*css-[^"]*"[^>]*data-type="word-definitions?[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    
    if (defSectionMatch && defSectionMatch[1]) {
      console.log("Found definition section by data-type");
      const section = defSectionMatch[1];
      
      const contentMatch = section.match(/<div[^>]*>([\s\S]*?)<\/div>/);
      if (contentMatch && contentMatch[1]) {
        const definition = contentMatch[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        if (definition.length > 10) {
          console.log(`Definition found (method 5): ${definition}`);
          return definition;
        }
      }
    }
    
    // Pattern 6: Last resort - search for any element with a definition role
    const defRoleMatch = html.match(/<[^>]*role="definition"[^>]*>([\s\S]*?)<\/[^>]*>/i);
    
    if (defRoleMatch && defRoleMatch[1]) {
      const definition = defRoleMatch[1].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      if (definition.length > 10) {
        console.log(`Definition found (method 6): ${definition}`);
        return definition;
      }
    }
    
    // Pattern 7: Look for any "description" meta tag (might contain definition)
    const metaDescMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i);
    
    if (metaDescMatch && metaDescMatch[1]) {
      const metaDesc = metaDescMatch[1].trim();
      // Check if meta description contains actual definition and not just site info
      if (metaDesc.length > 20 && !metaDesc.startsWith("Dictionary.com") && !metaDesc.includes("definition of")) {
        console.log(`Definition found (method 7): ${metaDesc}`);
        return metaDesc;
      }
    }
    
    // If extraction fails but page loaded, try to extract any meaningful content
    // that might be a definition
    if (html.includes(`>${word}</`) || html.toLowerCase().includes(`>${word.toLowerCase()}</`)) {
      console.log(`Word "${word}" found on page but couldn't extract definition with standard patterns`);
      
      // Try to extract any sentence with the word first, as it might be a definition
      const sentencesWithWord = [];
      const sentenceRegex = /[^.!?]+[.!?]+/g;
      const lowerHtml = html.toLowerCase();
      const lowerWord = word.toLowerCase();
      
      let sentence;
      while ((sentence = sentenceRegex.exec(lowerHtml)) !== null) {
        if (sentence[0].includes(lowerWord)) {
          const cleanSentence = sentence[0].replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
          if (cleanSentence.length > 15 && cleanSentence.length < 200) {
            sentencesWithWord.push(cleanSentence);
          }
        }
      }
      
      if (sentencesWithWord.length > 0) {
        console.log(`Found ${sentencesWithWord.length} sentences with the word, using first as definition`);
        return sentencesWithWord[0];
      }
      
      return `This word exists in Dictionary.com but we couldn't extract its definition due to page structure changes.`;
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
