
import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import LocationInput from "@/components/LocationInput";
import WeatherWord from "@/components/WeatherWord";
import WeatherDetails from "@/components/WeatherDetails";
import Footer from "@/components/Footer";
import { 
  WeatherData, 
  getWeatherByZipcode, 
  getWeatherByGeolocation, 
  getBackgroundClass,
  hasApiKey,
  saveApiKey
} from "@/services/weatherService";
import { generateWeatherWord } from "@/services/wordMappingService";
import { initializeDictionary } from "@/services/dictionaryService";
import { CloudSun, KeyRound } from "lucide-react";

const Index = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherWord, setWeatherWord] = useState<string>("");
  const [factorContributions, setFactorContributions] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>("");
  const [showApiKeyInput, setShowApiKeyInput] = useState<boolean>(!hasApiKey());
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
    if (!hasApiKey()) {
      setShowApiKeyInput(true);
      toast({
        title: "API Key Required",
        description: "Please enter your OpenWeatherMap API key first",
        variant: "destructive"
      });
      return;
    }

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

  // Handle API key submission
  const handleApiKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKey.trim()) {
      saveApiKey(apiKey.trim());
      setShowApiKeyInput(false);
      toast({
        title: "Success",
        description: "API key saved successfully. You can now fetch weather data.",
      });
    }
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
              Weather Word Magic
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Discover the unique word that describes your local weather conditions
          </p>
        </header>
        
        <main className="flex-1 flex flex-col items-center justify-center gap-8 w-full max-w-2xl mx-auto">
          {showApiKeyInput ? (
            <div className="w-full max-w-md bg-white/80 backdrop-blur-sm p-6 rounded-lg shadow">
              <form onSubmit={handleApiKeySubmit} className="space-y-4">
                <div className="flex flex-col gap-2">
                  <h2 className="flex items-center gap-2 text-xl font-semibold">
                    <KeyRound className="h-5 w-5" />
                    OpenWeatherMap API Key
                  </h2>
                  <Alert>
                    <AlertDescription>
                      You need a free API key from OpenWeatherMap. 
                      <a 
                        href="https://home.openweathermap.org/users/sign_up" 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-blue-600 hover:underline ml-1"
                      >
                        Sign up here
                      </a> 
                      and then get your key from the API keys section.
                    </AlertDescription>
                  </Alert>
                </div>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Enter your API key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit">Save</Button>
                </div>
              </form>
            </div>
          ) : (
            <>
              <LocationInput 
                onLocationSubmit={handleZipcodeSubmit}
                onGeolocation={handleGeolocation}
                isLoading={loading}
              />
              
              <div className="text-right w-full">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowApiKeyInput(true)}
                  className="text-xs"
                >
                  Change API Key
                </Button>
              </div>
              
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
            </>
          )}
        </main>
      </div>
      
      <Footer />
    </div>
  );
};

export default Index;
