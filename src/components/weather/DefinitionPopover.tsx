
import { useState, useEffect, useCallback } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Info, ExternalLink, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

// Types for the Dictionary API response
interface DictionaryApiResponse {
  word: string;
  phonetic?: string;
  phonetics: {
    text?: string;
    audio?: string;
  }[];
  origin?: string;
  meanings: {
    partOfSpeech: string;
    definitions: {
      definition: string;
      example?: string;
      synonyms: string[];
      antonyms: string[];
    }[];
  }[];
}

interface DefinitionPopoverProps {
  word: string;
}

const DefinitionPopover = ({ word }: DefinitionPopoverProps) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [definition, setDefinition] = useState<DictionaryApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fetchDefinition = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("No definition found for this word.");
        }
        throw new Error("Failed to fetch definition.");
      }
      
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        setDefinition(data[0]);
      } else {
        throw new Error("Unexpected API response format.");
      }
    } catch (err) {
      console.error("Error fetching definition:", err);
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [word]);
  
  // Reset definition when word changes
  useEffect(() => {
    if (word) {
      setDefinition(null);
      setError(null);
      
      // If popover is already open, fetch the new definition
      if (popoverOpen) {
        fetchDefinition();
      }
    }
  }, [word, popoverOpen, fetchDefinition]);
  
  const handleOpenChange = async (open: boolean) => {
    setPopoverOpen(open);
    
    // Only fetch when opening the popover and we don't already have a definition
    if (open && !definition && !isLoading) {
      fetchDefinition();
    }
  };

  const handleSearch = () => {
    const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(word)}+meaning`;
    window.open(searchUrl, '_blank');
    setPopoverOpen(false);
  };

  return (
    <Popover open={popoverOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full mt-1 h-8 w-8" 
          aria-label="Show definition"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Info className="h-4 w-4" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 text-left p-0 flex flex-col">
        <div className="p-4 border-b shrink-0">
          <h3 className="font-medium">{word}</h3>
          {definition?.phonetic && (
            <p className="text-sm text-gray-500 mt-1">{definition.phonetic}</p>
          )}
        </div>
        
        <ScrollArea className="flex-grow overflow-auto" style={{ maxHeight: "300px" }}>
          <div className="p-4 space-y-4">
            {isLoading && (
              <div className="flex items-center gap-2 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading definition...</span>
              </div>
            )}
            
            {error && (
              <div className="space-y-2">
                <p className="text-sm text-red-500">{error}</p>
                <Button 
                  onClick={handleSearch} 
                  className="w-full justify-between"
                  variant="outline"
                  size="sm"
                >
                  Search on DuckDuckGo instead
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            {definition && !isLoading && (
              <div className="space-y-4">
                {definition.meanings.map((meaning, index) => (
                  <div key={index} className="space-y-2">
                    <h4 className="text-sm font-medium text-indigo-600">{meaning.partOfSpeech}</h4>
                    <ul className="space-y-2">
                      {meaning.definitions.slice(0, 2).map((def, idx) => (
                        <li key={idx} className="text-sm">
                          <p>{def.definition}</p>
                          {def.example && (
                            <p className="text-xs text-gray-500 mt-1 italic">"{def.example}"</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
                
                <Button 
                  onClick={handleSearch} 
                  className="w-full justify-between mt-2"
                  variant="outline"
                  size="sm"
                >
                  Search more on DuckDuckGo
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default DefinitionPopover;
