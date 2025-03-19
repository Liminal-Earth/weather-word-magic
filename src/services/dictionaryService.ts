
// Dictionary service - main exports
// Acts as a facade for the refactored dictionary modules

import { getDictionary, initializeDictionary } from './dictionary/dictionaryLoader';
import { fetchWordDefinition, getReliableWordsList } from './definitionService';

// Re-export the main functions to maintain backward compatibility
export {
  getDictionary,
  initializeDictionary,
  fetchWordDefinition
};
