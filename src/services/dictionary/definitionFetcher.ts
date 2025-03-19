
/**
 * Dictionary.com definition fetcher
 * Fetches and extracts definitions from Dictionary.com
 */

import { 
  extractMetaDescription, 
  extractFromMeaningSection, 
  extractFromDefinitionElements, 
  extractFromParagraphs, 
  extractFallbackDefinition 
} from './extractors';
import { findReliableWordDefinition } from './reliableWords';

/**
 * Fetch the definition directly from Dictionary.com through a CORS proxy
 * This uses web scraping as Dictionary.com doesn't have a public API
 * 
 * IMPORTANT: This should ONLY be called when a user explicitly requests a definition
 */
export async function fetchDictionaryDefinition(word: string): Promise<string | null> {
  try {
    console.log(`Fetching definition for "${word}" from Dictionary.com...`);
    
    // Use a CORS proxy to avoid cross-origin issues
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
      return findReliableWordDefinition(word);
    }
    
    const html = await response.text();
    console.log(`Received HTML response for "${word}" (${html.length} bytes), parsing definition...`);
    
    // Output a section of the HTML for debugging
    const excerptStart = html.indexOf('<section class="css-');
    if (excerptStart > 0) {
      const excerpt = html.substring(excerptStart, excerptStart + 300);
      console.log(`HTML excerpt: ${excerpt}`);
    }
    
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
    
    // If all extraction methods fail but we know the word exists (page loaded)
    if (html.includes(`>${word}<`) || html.toLowerCase().includes(`>${word.toLowerCase()}<`)) {
      console.log(`Word "${word}" found on page but couldn't extract definition`);
      return `This word exists in Dictionary.com but we couldn't extract its definition.`;
    }
    
    console.log(`No definition patterns matched for "${word}"`);
    
    // As a last resort, use reliable words if they match
    const reliableDefinition = findReliableWordDefinition(word);
    if (reliableDefinition) {
      console.log(`Using reliable fallback definition for "${word}"`);
      return reliableDefinition;
    }
    
    return null;
  } catch (error) {
    console.error(`Error fetching definition for '${word}':`, error);
    
    // For network errors, try the reliable words as a last resort
    const reliableDefinition = findReliableWordDefinition(word);
    if (reliableDefinition) {
      console.log(`Using reliable fallback definition after error for "${word}"`);
      return reliableDefinition;
    }
    
    return null;
  }
}
