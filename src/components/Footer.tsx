
import { Github } from "lucide-react";

const Footer = () => {
  return (
    <footer className="w-full py-4 text-center text-gray-500 text-sm mt-auto">
      <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
        <p>Weather Word &copy; {new Date().getFullYear()}</p>
        <span className="hidden sm:inline">•</span>
        <p>Weather data from <a href="https://open-meteo.com/" className="hover:underline" target="_blank" rel="noreferrer">Open-Meteo</a></p>
        <span className="hidden sm:inline">•</span>
        <p>Definitions from <a href="https://dictionaryapi.dev/" className="hover:underline" target="_blank" rel="noreferrer">Dictionary API</a></p>
        <span className="hidden sm:inline">•</span>
        <a 
          href="https://github.com/Liminal-Earth/weather-word-magic" 
          target="_blank" 
          rel="noreferrer"
          className="flex items-center gap-1 hover:underline"
        >
          <Github className="h-3.5 w-3.5" />
          <span>View on GitHub</span>
        </a>
      </div>
    </footer>
  );
};

export default Footer;
