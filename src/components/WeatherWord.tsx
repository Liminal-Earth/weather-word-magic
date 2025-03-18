
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { WeatherData } from "@/services/weatherService";

interface WeatherWordProps {
  word: string;
  weatherData: WeatherData | null;
}

const WeatherWord = ({ word, weatherData }: WeatherWordProps) => {
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
            <p className="font-serif text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-gray-800 mb-2">
              {word}
            </p>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Based on conditions in {weatherData.location}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeatherWord;
