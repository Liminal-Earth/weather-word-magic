
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { WeatherData } from "@/services/weatherService";
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from "recharts";

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

  // Format the data for the chart
  const chartData = factorContributions ? Object.entries(factorContributions).map(([name, value]) => ({
    name,
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
            <p className="font-serif text-5xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-gray-800 mb-2">
              {word}
            </p>
          </div>
          <p className="text-sm text-gray-500 mt-4">
            Based on conditions in {weatherData.location}
          </p>

          {factorContributions && chartData.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Word Influence Factors:</h3>
              <div className="h-[120px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis dataKey="name" />
                    <Tooltip 
                      formatter={(value) => [`${value}%`, 'Influence']}
                      contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)' }}
                    />
                    <Bar dataKey="value" fill="#82ca9d" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2 text-xs text-gray-500">
                {chartData.map(item => (
                  <div key={item.name} className="flex justify-between">
                    <span>{item.name}:</span>
                    <span className="font-medium">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default WeatherWord;
