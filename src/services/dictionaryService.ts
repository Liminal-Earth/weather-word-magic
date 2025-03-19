
// Dictionary service - main exports
// Acts as a facade for the refactored dictionary modules

import { getDictionary, initializeDictionary } from './dictionary/dictionaryLoader';
import { verifyWordsWithDefinitions, initializeVerifiedWords } from './dictionary/verifiedWords';

// Initialize verified words on load
initializeVerifiedWords();

// Re-export the main functions to maintain backward compatibility
export {
  getDictionary,
  initializeDictionary,
  verifyWordsWithDefinitions
};
