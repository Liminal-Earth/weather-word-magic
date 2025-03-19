
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
    console.log(`Starting definition fetch for "${word}"...`);
    
    // First check if it's in our reliable words list
    const reliableMatch = reliableWords.find(w => w.word.toLowerCase() === word.toLowerCase());
    if (reliableMatch) {
      console.log(`Found reliable definition for "${word}"`);
      return reliableMatch.definition;
    }
    
    // Use a CORS proxy to avoid cross-origin issues
    // Using allorigins.win which is a public CORS proxy service
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.dictionary.com/browse/${encodeURIComponent(word)}`)}`;
    
    console.log(`Sending request through proxy: ${proxyUrl}`);
    
    // Fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(proxyUrl, { signal: controller.signal });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.log(`Failed to fetch from Dictionary.com for "${word}" (HTTP ${response.status})`);
      return "No definition available for this word.";
    }
    
    // Get the HTML content
    const html = await response.text();
    console.log(`Received HTML for "${word}" (${html.length} bytes)`);
    
    // Check if we're on a "no results" page
    if (html.includes("No results found") || html.includes("No exact matches found")) {
      console.log(`Dictionary.com has no results for "${word}"`);
      return "No definition found for this word.";
    }
    
    // Extract a short section for debugging
    const sample = html.substring(0, 200).replace(/\n/g, ' ');
    console.log(`HTML sample: ${sample}...`);
    
    // **************************************************************************
    // MULTIPLE DEFINITION EXTRACTION METHODS - trying various patterns to be robust
    // **************************************************************************
    
    // APPROACH 1: Meta description often contains the definition
    const metaDescription = extractMetaDescription(html);
    if (metaDescription) {
      console.log(`Definition found via meta: ${metaDescription}`);
      return metaDescription;
    }
    
    // APPROACH 2: Extract definition from meaning section
    const meaningDefinition = extractFromMeaningSection(html);
    if (meaningDefinition) {
      console.log(`Definition found via meaning section: ${meaningDefinition}`);
      return meaningDefinition;
    }
    
    // APPROACH 3: Look for specific definition elements
    const specificDefinition = extractFromDefinitionElements(html);
    if (specificDefinition) {
      console.log(`Definition found via specific elements: ${specificDefinition}`);
      return specificDefinition;
    }
    
    // APPROACH 4: Look for paragraphs that might contain definitions
    const paragraphDefinition = extractFromParagraphs(html, word);
    if (paragraphDefinition) {
      console.log(`Definition found via paragraphs: ${paragraphDefinition}`);
      return paragraphDefinition;
    }
    
    // APPROACH 5: Fallback - try to extract any reasonable text
    const fallbackDefinition = extractFallbackDefinition(html, word);
    if (fallbackDefinition) {
      console.log(`Definition found via fallback: ${fallbackDefinition}`);
      return fallbackDefinition;
    }
    
    console.log(`All extraction methods failed for "${word}"`);
    return "We found this word in Dictionary.com but couldn't extract its definition.";
    
  } catch (error) {
    console.error(`Error fetching definition for '${word}':`, error);
    return "An error occurred while fetching the definition.";
  }
}

// Helper function to extract meta description
function extractMetaDescription(html: string): string | null {
  // Meta descriptions often contain a concise definition
  const metaMatch = html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"[^>]*>/i);
  if (metaMatch && metaMatch[1]) {
    const meta = metaMatch[1].trim();
    
    // Ignore meta descriptions that are just about Dictionary.com
    if (meta.length > 20 && 
        !meta.startsWith("Dictionary.com") && 
        !meta.includes("the world's favorite") &&
        !meta.includes("definition at Dictionary.com")) {
      return meta;
    }
  }
  return null;
}

// Helper function to extract from meaning sections
function extractFromMeaningSection(html: string): string | null {
  // Method 1: Try to find definition in a section with meaning class
  const sectionMatch = html.match(/<section[^>]*class="[^"]*css-[^"]*"[^>]*>([\s\S]*?)<\/section>/g);
  if (sectionMatch) {
    for (const section of sectionMatch) {
      // Look for definition spans inside the section
      const defMatch = section.match(/<span[^>]*class="[^"]*one-click-content[^"]*"[^>]*>([\s\S]*?)<\/span>/);
      if (defMatch && defMatch[1]) {
        const definition = cleanHtml(defMatch[1]);
        if (isValidDefinition(definition)) {
          return definition;
        }
      }
      
      // Try an alternative pattern for definitions
      const alt1Match = section.match(/<span[^>]*data-testid="[^"]*def-value[^"]*"[^>]*>([\s\S]*?)<\/span>/);
      if (alt1Match && alt1Match[1]) {
        const definition = cleanHtml(alt1Match[1]);
        if (isValidDefinition(definition)) {
          return definition;
        }
      }
      
      // Try another pattern that's been observed in Dictionary.com
      const alt2Match = section.match(/<p[^>]*class="[^"]*css-[^"]*"[^>]*>([\s\S]*?)<\/p>/);
      if (alt2Match && alt2Match[1]) {
        const definition = cleanHtml(alt2Match[1]);
        if (isValidDefinition(definition)) {
          return definition;
        }
      }
    }
  }
  return null;
}

// Helper function to extract from specific definition elements
function extractFromDefinitionElements(html: string): string | null {
  // Method 1: Data attributes for definitions
  const dataDefMatch = html.match(/<div[^>]*data-type="word-definitions?"[^>]*>([\s\S]*?)<\/div>/i);
  if (dataDefMatch && dataDefMatch[1]) {
    const cleaned = cleanHtml(dataDefMatch[1]);
    if (isValidDefinition(cleaned)) {
      return cleaned;
    }
  }
  
  // Method 2: Role attributes for definitions
  const roleMatch = html.match(/<[^>]*role="definition"[^>]*>([\s\S]*?)<\/[^>]*>/i);
  if (roleMatch && roleMatch[1]) {
    const cleaned = cleanHtml(roleMatch[1]);
    if (isValidDefinition(cleaned)) {
      return cleaned;
    }
  }
  
  // Method 3: Luna word attributes (seen in newer Dictionary.com layouts)
  const lunaMatch = html.match(/<span[^>]*data-luna-word[^>]*>([\s\S]*?)<\/span>/);
  if (lunaMatch && lunaMatch[1]) {
    const cleaned = cleanHtml(lunaMatch[1]);
    if (isValidDefinition(cleaned)) {
      return cleaned;
    }
  }
  
  return null;
}

// Helper function to extract from paragraphs
function extractFromParagraphs(html: string, word: string): string | null {
  // Look for paragraphs that might contain definitions
  const paragraphMatches = html.match(/<p[^>]*>([\s\S]*?)<\/p>/g);
  if (paragraphMatches) {
    const cleanedParagraphs = paragraphMatches.map(p => {
      // Extract text content and clean it
      const textMatch = p.match(/<p[^>]*>([\s\S]*?)<\/p>/);
      return textMatch ? cleanHtml(textMatch[1]) : '';
    }).filter(p => isValidDefinition(p));
    
    // Try to find paragraphs that mention the word itself
    const relevantParagraphs = cleanedParagraphs.filter(p => 
      p.toLowerCase().includes(word.toLowerCase()));
    
    if (relevantParagraphs.length > 0) {
      return relevantParagraphs[0];
    }
    
    // If no paragraphs mention the word, use the first reasonable paragraph
    if (cleanedParagraphs.length > 0) {
      return cleanedParagraphs[0];
    }
  }
  return null;
}

// Helper function for fallback extraction
function extractFallbackDefinition(html: string, word: string): string | null {
  // Look for any text that might be a definition
  const sentences = extractSentences(html);
  
  // Filter sentences that might be definitions
  const possibleDefinitions = sentences.filter(s => 
    // Reasonable length for a definition
    s.length > 15 && s.length < 300 &&
    // Not something that's probably navigation text
    !s.includes('Dictionary.com') &&
    !s.includes('Sign up') &&
    !s.includes('Log in') &&
    // Not a heading about parts of speech
    !/^(noun|verb|adjective|adverb)[.:]?$/i.test(s)
  );
  
  // First try sentences containing the word
  const withWord = possibleDefinitions.filter(s => 
    s.toLowerCase().includes(word.toLowerCase()));
  
  if (withWord.length > 0) {
    return withWord[0];
  }
  
  // If no good sentences with the word, use the first decent one
  if (possibleDefinitions.length > 0) {
    return possibleDefinitions[0];
  }
  
  return null;
}

// Helper function to extract sentences from HTML
function extractSentences(html: string): string[] {
  // Strip HTML tags to get only text
  const textOnly = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  
  // Split into sentences
  const sentenceRegex = /[^.!?]+[.!?]+/g;
  const sentences: string[] = [];
  
  let match;
  while ((match = sentenceRegex.exec(textOnly)) !== null) {
    const sentence = match[0].trim();
    if (sentence.length > 10) { // Skip very short fragments
      sentences.push(sentence);
    }
  }
  
  return sentences;
}

// Helper function to clean HTML content
function cleanHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ') // Remove HTML tags
    .replace(/&[^;]+;/g, ' ') // Remove HTML entities
    .replace(/\s+/g, ' ')     // Normalize whitespace
    .trim();
}

// Helper function to validate a potential definition
function isValidDefinition(text: string): boolean {
  return text.length > 10 && // Reasonable minimum length
         text.length < 500 && // Not too long
         !/^(noun|verb|adjective|adverb)[.:]?$/i.test(text) && // Not just a part of speech
         !text.includes('Dictionary.com') && // Not site info
         !text.includes('Sign up') && // Not UI text
         !text.includes('Log in'); // Not UI text
}

/**
 * Get a list of words that are guaranteed to have definitions - used only as fallback
 */
export function getReliableWordsList(): string[] {
  return reliableWords.map(item => item.word);
}
