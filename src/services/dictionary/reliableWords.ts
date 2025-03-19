
/**
 * Reliable words with known definitions for fallback use
 */

export interface ReliableWord {
  word: string;
  definition: string;
}

/**
 * List of reliable words with known definitions to use as fallback 
 * only when API fails
 */
export const reliableWords: ReliableWord[] = [
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
 * Get a list of words that are guaranteed to have definitions - used only as fallback
 */
export function getReliableWordsList(): string[] {
  return reliableWords.map(item => item.word);
}

/**
 * Find a reliable word definition by word
 */
export function findReliableWordDefinition(word: string): string | null {
  const found = reliableWords.find(w => w.word.toLowerCase() === word.toLowerCase());
  return found?.definition || null;
}
