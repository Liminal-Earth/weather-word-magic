
import { WeatherData } from "@/services/weatherService";

interface WeatherFactorsProps {
  weatherData: WeatherData;
}

const WeatherFactors = ({ weatherData }: WeatherFactorsProps) => {
  return (
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
        <span>Time:</span>
        <span className="font-medium">{new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
      </div>
    </div>
  );
};

export default WeatherFactors;
