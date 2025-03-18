
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import LocationInput from "@/components/LocationInput";
import WeatherWord from "@/components/WeatherWord";
import WeatherDetails from "@/components/WeatherDetails";
import Footer from "@/components/Footer";
import { WeatherData, getWeatherByZipcode, getWeatherByGeolocation, getBackgroundClass } from "@/services/weatherService";
import { generateWeatherWord, hasWeatherChangedSignificantly } from "@/services/wordMappingService";
import { CloudSun } from "lucide-react";

const POLL_INTERVAL = 10 * 60 * 1000; // 10 minutes in milliseconds

const Index = () => {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [weatherWord, setWeatherWord] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [lastLocation, setLastLocation] = useState<{type: "zip" | "geo", value: string | {lat: number, lon: number}} | null>(null);
  const { toast } = useToast();

  const fetchWeatherData = useCallback(async () => {
    if (!lastLocation) return;
    
    setLoading(true);
    try {
      let newWeatherData: WeatherData | null = null;
      
      if (lastLocation.type === "zip") {
        newWeatherData = await getWeatherByZipcode(lastLocation.value as string);
      } else if (lastLocation.type === "geo") {
        const { lat, lon } = lastLocation.value as { lat: number, lon: number };
        newWeatherData = await getWeatherByGeolocation(lat, lon);
      }
      
      if (newWeatherData) {
        // Check if weather has changed significantly
        if (!weatherData || hasWeatherChangedSignificantly(weatherData, newWeatherData)) {
          setWeatherData(newWeatherData);
          const word = generateWeatherWord(newWeatherData);
          setWeatherWord(word);
          
          if (weatherData) {
            toast({
              title: "Weather Update",
              description: `Your weather word has changed to "${word}"`,
            });
          }
        } else {
          setWeatherData(newWeatherData); // Update timestamps but don't change the word
        }
      }
    } catch (error) {
      console.error("Error fetching weather:", error);
    } finally {
      setLoading(false);
    }
  }, [lastLocation, weatherData, toast]);

  // Handle zipcode submission
  const handleZipcodeSubmit = (zipcode: string) => {
    setLastLocation({ type: "zip", value: zipcode });
  };

  // Handle geolocation
  const handleGeolocation = (lat: number, lon: number) => {
    setLastLocation({ type: "geo", value: { lat, lon } });
  };

  // Initial fetch and setup polling
  useEffect(() => {
    if (lastLocation) {
      fetchWeatherData();
      
      // Set up polling interval
      const intervalId = setInterval(fetchWeatherData, POLL_INTERVAL);
      
      return () => clearInterval(intervalId);
    }
  }, [lastLocation, fetchWeatherData]);

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
