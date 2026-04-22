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

const getCurrentPosition = (sunrise: string, sunset: string): number => {
  if (!sunrise || !sunset) return 50;
  try {
    const now = new Date();
    const start = new Date(sunrise);
    const end = new Date(sunset);
    
    if (now < start) return 0;
    if (now > end) return 100;
    
    const totalMs = end.getTime() - start.getTime();
    const elapsedMs = now.getTime() - start.getTime();
    return (elapsedMs / totalMs) * 100;
  } catch {
    return 50;
  }
};

export const SunTimesTile: React.FC<SunTimesTileProps> = ({ sunrise, sunset }) => {
  const sunriseTime = formatTime(sunrise);
  const sunsetTime = formatTime(sunset);
  const position = getCurrentPosition(sunrise, sunset);
  
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

  const sunColor = '#f59e0b';
  const sunGlow = '#fcd34d';
  const dayArcColor = sunColor;
  const nightArcColor = '#1e3a5f';

  return (
    <div className="weather-tile">
      <div className="weather-tile-header">Sol</div>
      
      <div className="relative flex justify-center items-center h-16 mb-2">
        <svg viewBox="0 0 200 80" className="w-full h-full">
          <defs>
            <linearGradient id="sunGlow" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={sunGlow} stopOpacity="1" />
              <stop offset="100%" stopColor={sunColor} stopOpacity="0.3" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          
          <path
            d="M 20,70 Q 100,0 180,70"
            fill="none"
            stroke={dayArcColor}
            strokeWidth="3"
            strokeLinecap="round"
          />
          
          <path
            d="M 20,70 Q 100,0 180,70"
            fill="none"
            stroke="url(#sunGlow)"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.3"
          />
          
          <circle
            cx={20}
            cy={70}
            r="6"
            fill={sunrise ? '#f59e0b' : '#6b7280'}
          />
          <circle
            cx={180}
            cy={70}
            r="6"
            fill={sunset ? '#f97316' : '#6b7280'}
          />
          
          <circle
            cx={100 + (position - 50) * 0.8}
            cy={70 - Math.sin((position / 100) * Math.PI) * 60}
            r="10"
            fill="url(#sunGlow)"
            filter="url(#glow)"
          />
          <circle
            cx={100 + (position - 50) * 0.8}
            cy={70 - Math.sin((position / 100) * Math.PI) * 60}
            r="6"
            fill={sunColor}
          />
          <circle
            cx={100 + (position - 50) * 0.8 - 2}
            cy={70 - Math.sin((position / 100) * Math.PI) * 60 - 2}
            r="2"
            fill="#fef3c7"
          />
          
          <text x="20" y="85" textAnchor="middle" fontSize="8" fill="#6b7280" fontFamily="monospace">
            {sunriseTime}
          </text>
          <text x="180" y="85" textAnchor="middle" fontSize="8" fill="#6b7280" fontFamily="monospace">
            {sunsetTime}
          </text>
        </svg>
      </div>

      <div className="flex justify-between text-xs font-mono px-1 mb-2">
        <span className="text-yellow-600">🌅 {sunriseTime}</span>
        <span className="text-gray-500">{getDayDuration()}</span>
        <span className="text-orange-600">{sunsetTime} 🌙</span>
      </div>

      <div className="pt-2 border-t border-gray-300 dark:border-gray-600">
        <div className="flex justify-between items-center">
          <div className="text-center flex-1">
            <div className="text-xs font-mono text-gray-500">Amanecer</div>
            <div className="text-sm font-mono text-yellow-600 font-semibold">{sunriseTime}</div>
          </div>
          <div className="text-center flex-1">
            <div className="text-xs font-mono text-gray-500">Duración</div>
            <div className="text-sm font-mono text-gray-700 dark:text-gray-300 font-semibold">{getDayDuration()}</div>
          </div>
          <div className="text-center flex-1">
            <div className="text-xs font-mono text-gray-500">Atardecer</div>
            <div className="text-sm font-mono text-orange-600 font-semibold">{sunsetTime}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SunTimesTile;