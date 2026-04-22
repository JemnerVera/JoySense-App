import React from 'react';

interface WeatherCompassProps {
  direction: number | null;
  speed: number | null;
  size?: number;
}

const getDirectionLabel = (degrees: number | null): string => {
  if (degrees === null) return '--';
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round((degrees % 360) / 22.5) % 16;
  return directions[index];
};

const getArrowRotation = (degrees: number | null): string => {
  if (degrees === null) return '0deg';
  return `${degrees}deg`;
};

export const WeatherCompass: React.FC<WeatherCompassProps> = ({
  direction,
  speed,
  size = 100,
}) => {
  const rotation = getArrowRotation(direction);
  const label = getDirectionLabel(direction);
  const displaySpeed = speed !== null ? speed.toFixed(1) : '--';
  const displayDir = direction !== null ? direction.toFixed(0) : '--';

  return (
    <div className="flex flex-col items-center" style={{ width: size }}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          style={{ transform: 'rotate(0deg)' }}
        >
          <circle cx="50" cy="50" r="45" fill="none" stroke="#d1d5db" strokeWidth="2" />
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
            <line
              key={angle}
              x1="50"
              y1="5"
              x2="50"
              y2="15"
              stroke="#9ca3af"
              strokeWidth="1"
              transform={`rotate(${angle} 50 50)`}
            />
          ))}
          <text x="50" y="12" textAnchor="middle" fontSize="6" fill="#6b7280">N</text>
          <text x="88" y="53" textAnchor="middle" fontSize="6" fill="#6b7280">E</text>
          <text x="50" y="93" textAnchor="middle" fontSize="6" fill="#6b7280">S</text>
          <text x="12" y="53" textAnchor="middle" fontSize="6" fill="#6b7280">W</text>
        </svg>
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ transform: `rotate(${rotation})`, transition: 'transform 0.5s ease-out' }}
        >
          <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 40 40">
            <path
              d="M20 2 L35 30 L20 25 L5 30 Z"
              fill="#ef4444"
            />
          </svg>
        </div>
      </div>
      <div className="text-center mt-1">
        <div className="text-lg font-bold font-mono text-gray-800 dark:text-gray-200">
          {displaySpeed} <span className="text-xs">m/s</span>
        </div>
        <div className="text-sm font-mono text-gray-600 dark:text-gray-400">
          {label} ({displayDir}°)
        </div>
      </div>
    </div>
  );
};

export default WeatherCompass;