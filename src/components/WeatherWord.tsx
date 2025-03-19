
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { WeatherData } from "@/services/weatherService";
import DefinitionPopover from "@/components/weather/DefinitionPopover";
import WordInfluenceChart from "@/components/weather/WordInfluenceChart";
import WeatherFactors from "@/components/weather/WeatherFactors";

interface WeatherWordProps {
  word: string;
  weatherData: WeatherData | null;
  factorContributions?: Record<string, number>;
}

const WeatherWord = ({ word, weatherData, factorContributions }: WeatherWordProps) => {
  const [fadeIn, setFadeIn] = useState(false);
  
  useEffect(() => {
    setFadeIn(false);
    const timer = setTimeout(() => {
      setFadeIn(true);
    }, 100);
    
    return () => clearTimeout(timer);
  }, [word]);
  
  if (!weatherData) return null;

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
              <DefinitionPopover word={word} />
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

          {factorContributions && Object.keys(factorContributions).length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Word Influence Factors:</h3>
              <WordInfluenceChart factorContributions={factorContributions} />
              <WeatherFactors weatherData={weatherData} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WeatherWord;
