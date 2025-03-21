
import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import LocationInput from "@/components/LocationInput";
import WeatherWord from "@/components/WeatherWord";
import WeatherDetails from "@/components/WeatherDetails";
import Footer from "@/components/Footer";
import { 
  WeatherData, 
  getWeatherByZipcode, 
  getWeatherByGeolocation, 
  getBackgroundClass
} from "@/services/weatherService";
import { generateWeatherWord } from "@/services/wordMappingService";
import { initializeDictionary } from "@/services/dictionaryService";
import { CloudSun } from "lucide-react";

const Index = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherWord, setWeatherWord] = useState<string>("");
  const [factorContributions, setFactorContributions] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const { toast } = useToast();

  // Initialize dictionary when component mounts, but only once user interacts
  useEffect(() => {
    const handleUserInteraction = () => {
      // Initialize dictionary on first user interaction
      initializeDictionary();
      // Remove event listeners after first interaction
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
    
    // Add event listeners for user interaction
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('keydown', handleUserInteraction);
    
    // Clean up event listeners if component unmounts
    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, []);

  const fetchWeatherData = useCallback(async (
    locationType: "zip" | "geo", 
    locationValue: string | {lat: number, lon: number}
  ) => {
    setLoading(true);
    try {
      let newWeatherData: WeatherData | null = null;
      
      if (locationType === "zip") {
        newWeatherData = await getWeatherByZipcode(locationValue as string);
      } else if (locationType === "geo") {
        const { lat, lon } = locationValue as { lat: number, lon: number };
        newWeatherData = await getWeatherByGeolocation(lat, lon);
      }
      
      if (newWeatherData) {
        setWeatherData(newWeatherData);
        const result = generateWeatherWord(newWeatherData);
        setWeatherWord(result.word);
        setFactorContributions(result.factorContributions);
        
        if (weatherData) {
          toast({
            title: "Weather Updated",
            description: `Your weather word is now "${result.word}"`,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching weather:", error);
      toast({
        title: "Error",
        description: "Failed to fetch weather data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [weatherData, toast]);

  // Handle zipcode submission
  const handleZipcodeSubmit = (zipcode: string) => {
    fetchWeatherData("zip", zipcode);
  };

  // Handle geolocation
  const handleGeolocation = (lat: number, lon: number) => {
    fetchWeatherData("geo", { lat, lon });
  };

  // Determine background class based on weather condition
  const backgroundClass = weatherData 
    ? getBackgroundClass(weatherData.condition) 
    : "bg-gradient-sky";

  return (
    <div className={`min-h-screen flex flex-col ${backgroundClass} transition-colors duration-1000`}>
      <div className="container px-4 py-8 flex-1 flex flex-col">
        <header className="text-center mb-8">
          <div className="flex justify-center items-center gap-2 mb-2">
            <CloudSun className="h-8 w-8 text-sky-dark" />
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-gray-800">
              Weather Word
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Discover the unique word that describes your local weather conditions
          </p>
        </header>
        
        <main className="flex-1 flex flex-col items-center justify-center gap-8 w-full max-w-2xl mx-auto">
          <LocationInput 
            onLocationSubmit={handleZipcodeSubmit}
            onGeolocation={handleGeolocation}
            isLoading={loading}
          />
          
          {weatherData && (
            <>
              <WeatherWord 
                word={weatherWord} 
                weatherData={weatherData}
                factorContributions={factorContributions} 
              />
              
              <WeatherDetails weatherData={weatherData} />
            </>
          )}
          
          {!weatherData && !loading && (
            <div className="text-center p-8 rounded-lg backdrop-blur-sm bg-white/30">
              <p className="text-gray-700">
                Enter your zipcode or use your current location to discover your weather word
              </p>
            </div>
          )}
          
          {loading && !weatherData && (
            <div className="text-center p-8">
              <p className="text-gray-700 animate-pulse">Loading your weather data...</p>
            </div>
          )}
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

export default Index;
