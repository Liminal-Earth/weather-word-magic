
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { MapPin, Locate } from "lucide-react";

interface LocationInputProps {
  onLocationSubmit: (zipcode: string) => void;
  onGeolocation: (lat: number, lon: number) => void;
  isLoading: boolean;
}

const LocationInput = ({ onLocationSubmit, onGeolocation, isLoading }: LocationInputProps) => {
  const [zipcode, setZipcode] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (zipcode.trim().length !== 5 || !/^\d+$/.test(zipcode)) {
      toast({
        title: "Invalid Zipcode",
        description: "Please enter a valid 5-digit US zipcode",
        variant: "destructive",
      });
      return;
    }
    onLocationSubmit(zipcode);
  };

  const handleGeolocation = () => {
    if (navigator.geolocation) {
      toast({
        title: "Locating you",
        description: "Requesting your current location...",
      });
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          onGeolocation(latitude, longitude);
        },
        (error) => {
          let message = "Unable to retrieve your location";
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              message = "Location permission denied. Please allow location access";
              break;
            case error.POSITION_UNAVAILABLE:
              message = "Location information is unavailable";
              break;
            case error.TIMEOUT:
              message = "Location request timed out";
              break;
          }
          
          toast({
            title: "Geolocation Error",
            description: message,
            variant: "destructive",
          });
        }
      );
    } else {
      toast({
        title: "Geolocation Not Supported",
        description: "Your browser doesn't support geolocation. Please enter your zipcode.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="flex space-x-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            type="text"
            value={zipcode}
            onChange={(e) => setZipcode(e.target.value)}
            placeholder="Enter your US zipcode"
            className="pl-9"
            disabled={isLoading}
          />
        </div>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Loading..." : "Get Weather Word"}
        </Button>
      </form>
      
      <div className="text-center mt-3">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleGeolocation}
          disabled={isLoading}
          className="text-sm flex items-center gap-1"
        >
          <Locate className="h-3.5 w-3.5" />
          Use my current location
        </Button>
      </div>
    </div>
  );
};

export default LocationInput;
