
// This file manages loading and accessing the dictionary of words
// The dictionary is loaded asynchronously and then made available globally

import { getReliableWordsList } from "../definitionService";

// Initialize with empty array
let dictionary: string[] = [];

/**
 * Initialize the dictionary by fetching words from a source or using fallback
 */
export async function initializeDictionary(): Promise<void> {
  try {
    // Try to fetch dictionary from a word list
    const response = await fetch('https://raw.githubusercontent.com/dariusk/corpora/master/data/words/common.json');
    
    if (!response.ok) {
      throw new Error('Failed to fetch dictionary');
    }
    
    const data = await response.json();
    
    // Extract words from the response (expected format: { "commonWords": ["word1", "word2", ...] })
    let words: string[] = data.commonWords || [];
    
    // Filter words to only include those with 4+ characters and remove any special characters
    words = words.filter((word: string) => 
      word.length >= 4 && 
      /^[a-zA-Z]+$/.test(word) && 
      !word.includes("'")
    );
    
    // Shuffle the array to ensure diverse selection
    dictionary = shuffleArray(words);
    
    console.info(`Dictionary initialized with ${dictionary.length} words`);
  } catch (error) {
    console.error('Error initializing dictionary:', error);
    // Fallback to our reliable words list if fetch fails
    dictionary = shuffleArray(getReliableWordsList());
    console.info(`Using fallback dictionary with ${dictionary.length} words`);
  }
}

/**
 * Shuffle array using Fisher-Yates algorithm 
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get the current dictionary
 */
export function getDictionary(): string[] {
  return dictionary;
}
