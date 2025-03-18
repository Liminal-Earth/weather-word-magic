
import { Card, CardContent } from "@/components/ui/card";
import { WeatherData, getWeatherIconUrl } from "@/services/weatherService";
import { Thermometer, Droplets, Wind, Clock } from "lucide-react";

interface WeatherDetailsProps {
  weatherData: WeatherData;
}

const WeatherDetails = ({ weatherData }: WeatherDetailsProps) => {
  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <Card className="w-full max-w-lg mx-auto backdrop-blur-sm bg-white/80 shadow-md border-0">
      <CardContent className="p-4">
        <div className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src={getWeatherIconUrl(weatherData.icon)} 
              alt={weatherData.condition} 
              className="w-16 h-16"
            />
            <div>
              <h3 className="text-xl font-semibold">{weatherData.temperature}°F</h3>
              <p className="text-sm text-gray-500">{weatherData.condition}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            <div className="flex items-center gap-2">
              <Thermometer className="h-4 w-4 text-gray-500" />
              <span className="text-sm">Feels like {weatherData.feelsLike}°F</span>
            </div>
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-gray-500" />
              <span className="text-sm">Humidity {weatherData.humidity}%</span>
            </div>
            <div className="flex items-center gap-2">
              <Wind className="h-4 w-4 text-gray-500" />
              <span className="text-sm">Wind {weatherData.windSpeed} mph</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm">Updated {formatTime(weatherData.timestamp)}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WeatherDetails;
