import React from 'react';

interface SunTimesTileProps {
  sunrise: string;
  sunset: string;
}

const formatTime = (isoString: string): string => {
  if (!isoString) return '--:--';
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false });
  } catch {
    return isoString.slice(11, 16);
  }
};

export const SunTimesTile: React.FC<SunTimesTileProps> = ({ sunrise, sunset }) => {
  const sunriseTime = formatTime(sunrise);
  const sunsetTime = formatTime(sunset);
  
  const getDayDuration = (): string => {
    if (!sunrise || !sunset) return '--:--';
    try {
      const start = new Date(sunrise);
      const end = new Date(sunset);
      const diffMs = end.getTime() - start.getTime();
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    } catch {
      return '--:--';
    }
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-900 rounded-lg border border-gray-300 dark:border-gray-600 p-3">
      <div className="text-xs font-mono text-gray-600 dark:text-gray-400 mb-2 text-center uppercase">
        Sol
      </div>
      
      <div className="flex justify-center mb-3">
        <svg viewBox="0 0 100 50" className="w-16 h-8">
          <path
            d="M10,45 Q30,5 50,25 Q70,45 90,15"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle cx="90" cy="15" r="8" fill="#f59e0b" />
        </svg>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-xs font-mono text-gray-500">🌅 Amanecer</span>
          <span className="text-lg font-bold font-mono text-yellow-600">{sunriseTime}</span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-xs font-mono text-gray-500">🌙 Anocher</span>
          <span className="text-lg font-bold font-mono text-orange-600">{sunsetTime}</span>
        </div>
        
        <div className="border-t border-gray-300 dark:border-gray-600 pt-2 mt-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-mono text-gray-500">Día</span>
            <span className="text-sm font-mono text-gray-700 dark:text-gray-300">{getDayDuration()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SunTimesTile;