
/**
 * Extraction methods for Dictionary.com definitions
 * Contains various strategies for extracting definitions from HTML
 */

/**
 * Extract definition from meta description tag
 */
export function extractMetaDescription(html: string): string | null {
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

/**
 * Extract definition from meaning sections
 */
export function extractFromMeaningSection(html: string): string | null {
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

/**
 * Extract from specific definition elements
 */
export function extractFromDefinitionElements(html: string): string | null {
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

/**
 * Extract from paragraphs
 */
export function extractFromParagraphs(html: string, word: string): string | null {
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

/**
 * Fallback extraction method
 */
export function extractFallbackDefinition(html: string, word: string): string | null {
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

/**
 * Extract sentences from HTML
 */
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

/**
 * Clean HTML content
 */
export function cleanHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ') // Remove HTML tags
    .replace(/&[^;]+;/g, ' ') // Remove HTML entities
    .replace(/\s+/g, ' ')     // Normalize whitespace
    .trim();
}

/**
 * Validate a potential definition
 */
export function isValidDefinition(text: string): boolean {
  return text.length > 10 && // Reasonable minimum length
         text.length < 500 && // Not too long
         !/^(noun|verb|adjective|adverb)[.:]?$/i.test(text) && // Not just a part of speech
         !text.includes('Dictionary.com') && // Not site info
         !text.includes('Sign up') && // Not UI text
         !text.includes('Log in'); // Not UI text
}
