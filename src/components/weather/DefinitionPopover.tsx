
import { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Info, Loader2 } from "lucide-react";
import { fetchWordDefinition } from "@/services/dictionaryService";

interface DefinitionPopoverProps {
  word: string;
}

const DefinitionPopover = ({ word }: DefinitionPopoverProps) => {
  const [definition, setDefinition] = useState<string | null>(null);
  const [loadingDefinition, setLoadingDefinition] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFetchDefinition = async () => {
    if (loadingDefinition) return;
    
    setLoadingDefinition(true);
    setErrorMessage(null);
    setDefinition(null);
    
    try {
      console.log("Requesting definition for word:", word);
      
      const result = await fetchWordDefinition(word);
      console.log("Definition result:", result);
      
      if (result) {
        setDefinition(result);
      } else {
        setErrorMessage("No definition found for this word.");
      }
    } catch (error) {
      console.error("Error fetching definition:", error);
      setErrorMessage("Could not fetch the definition at this time.");
    } finally {
      setLoadingDefinition(false);
    }
  };
  
  // Fetch definition when popover opens
  const handlePopoverOpenChange = (open: boolean) => {
    setPopoverOpen(open);
    if (open && !definition && !loadingDefinition) {
      handleFetchDefinition();
    }
  };

  return (
    <Popover open={popoverOpen} onOpenChange={handlePopoverOpenChange}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full mt-1 h-8 w-8" 
          aria-label="Show definition"
        >
          {loadingDefinition ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Info className="h-4 w-4" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 text-left">
        <div className="space-y-2">
          <h3 className="font-medium">{word}</h3>
          {loadingDefinition ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Loading definition...</span>
            </div>
          ) : errorMessage ? (
            <p className="text-sm text-gray-600">{errorMessage}</p>
          ) : definition ? (
            <p className="text-sm text-gray-600">{definition}</p>
          ) : (
            <p className="text-sm text-gray-600">
              No definition found. This might be a rare or specialized word.
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DefinitionPopover;
