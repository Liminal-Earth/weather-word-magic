
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Info, ExternalLink } from "lucide-react";

interface DefinitionPopoverProps {
  word: string;
}

const DefinitionPopover = ({ word }: DefinitionPopoverProps) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  
  const handleSearch = () => {
    const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(word)}+meaning`;
    window.open(searchUrl, '_blank');
    setPopoverOpen(false);
  };

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full mt-1 h-8 w-8" 
          aria-label="Show definition"
        >
          <Info className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 text-left">
        <div className="space-y-4">
          <div>
            <h3 className="font-medium">{word}</h3>
            <p className="text-sm text-gray-600 mt-1">
              Look up the meaning of this word online:
            </p>
          </div>
          
          <Button 
            onClick={handleSearch} 
            className="w-full justify-between"
            variant="outline"
          >
            Search on DuckDuckGo
            <ExternalLink className="h-4 w-4" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default DefinitionPopover;
