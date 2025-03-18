import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { WeatherData } from "@/services/weatherService";
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { fetchWordDefinition } from "@/services/definitionService";
import { Info, Loader2 } from "lucide-react";

interface WeatherWordProps {
  word: string;
  weatherData: WeatherData | null;
  factorContributions?: Record<string, number>;
}

const WeatherWord = ({ word, weatherData, factorContributions }: WeatherWordProps) => {
  const [fadeIn, setFadeIn] = useState(false);
  const [definition, setDefinition] = useState<string | null>(null);
  const [loadingDefinition, setLoadingDefinition] = useState(false);
  
  useEffect(() => {
    setFadeIn(false);
    setDefinition(null);
    const timer = setTimeout(() => {
      setFadeIn(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [word]);
  
  const handleFetchDefinition = async () => {
    if (definition !== null) return;
    
    setLoadingDefinition(true);
    try {
      const result = await fetchWordDefinition(word);
      setDefinition(result);
    } catch (error) {
      console.error("Error fetching definition:", error);
      setDefinition(null);
    } finally {
      setLoadingDefinition(false);
    }
  };
  
  if (!weatherData) return null;

  const chartData = factorContributions ? Object.entries(factorContributions).map(([name, value]) => ({
    name: getFactorDisplayName(name),
    value: Math.round(value * 100)
  })).sort((a, b) => b.value - a.value) : [];
  
  return (
    <Card className="w-full max-w-lg mx-auto backdrop-blur-sm bg-white/80 shadow-lg border-0 overflow-hidden transition-all duration-500">
      <CardContent className="p-6 sm:p-8">
        <div className="text-center">
          <h2 className="text-2xl font-medium text-gray-500 mb-1">Your Weather Word is</h2>
          <div 
            className={`mt-2 transition-all duration-700 transform ${
              fadeIn ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <p className="font-serif text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-gray-800 mb-2">
                {word}
              </p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    onClick={handleFetchDefinition} 
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
                    {definition ? (
                      <p className="text-sm text-gray-600">{definition}</p>
                    ) : loadingDefinition ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Loading definition...</span>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600">
                        No definition found. This might be a rare or specialized word.
                      </p>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Based on conditions in {weatherData.location}
          </p>

          <div className="mt-4 mb-6 px-4 py-3 bg-indigo-50 rounded-lg text-sm text-indigo-700 max-w-md mx-auto">
            <p>
              Your weather word is divined through a mystical algorithm that senses the atmosphere's mood. 
              Temperature, wind, humidity, and celestial conditions are weighed and balanced to reveal 
              the word that best captures this exact moment in your local weather.
            </p>
          </div>

          {factorContributions && chartData.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Word Influence Factors:</h3>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                    <XAxis dataKey="name" fontSize={11} tickMargin={5} />
                    <Tooltip 
                      formatter={(value) => [`${value}%`, 'Influence']}
                      contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
                    />
                    <Bar 
                      dataKey="value" 
                      fill="#82ca9d" 
                      radius={[4, 4, 0, 0]} 
                      name="Influence" 
                      label={{ position: 'top', fontSize: 11, fill: '#666', formatter: (value) => `${value}%` }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-gray-500 bg-gray-50 p-3 rounded-md">
                <h4 className="col-span-2 font-medium text-gray-600 mb-1">Weather Conditions:</h4>
                <div className="flex justify-between">
                  <span>Temperature:</span>
                  <span className="font-medium">{weatherData.temperature}°F</span>
                </div>
                <div className="flex justify-between">
                  <span>Humidity:</span>
                  <span className="font-medium">{weatherData.humidity}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Wind:</span>
                  <span className="font-medium">{weatherData.windSpeed} mph</span>
                </div>
                <div className="flex justify-between">
                  <span>Sky:</span>
                  <span className="font-medium">{weatherData.condition}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pressure:</span>
                  <span className="font-medium">{weatherData.pressure || 'N/A'} hPa</span>
                </div>
                <div className="flex justify-between">
                  <span>Time:</span>
                  <span className="font-medium">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

function getFactorDisplayName(key: string): string {
  const nameMap: Record<string, string> = {
    temperature: "Temperature",
    humidity: "Humidity",
    wind: "Wind",
    sky: "Sky Condition",
    time: "Time of Day",
    pressure: "Pressure"
  };
  
  return nameMap[key] || key;
}

export default WeatherWord;
