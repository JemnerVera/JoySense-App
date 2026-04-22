import React from 'react';

interface WeatherMetricCardProps {
  label: string;
  value: number | null;
  unit: string;
  icon?: string;
  variant?: 'primary' | 'secondary';
  trend?: 'up' | 'down' | 'stable';
}

export const WeatherMetricCard: React.FC<WeatherMetricCardProps> = ({
  label,
  value,
  unit,
  icon,
  variant = 'primary',
  trend,
}) => {
  const isPrimary = variant === 'primary';
  const hasValue = value !== null;

  const getValueColor = () => {
    if (!hasValue) return 'text-gray-400';
    
    if (label.includes('Temperatura')) {
      if (value > 30) return 'text-red-600';
      if (value < 15) return 'text-blue-600';
      return 'text-green-600';
    }
    if (label.includes('Humedad')) {
      if (value > 80) return 'text-blue-600';
      if (value < 40) return 'text-orange-600';
      return 'text-green-600';
    }
    return 'text-gray-900';
  };

  const getTrendIcon = () => {
    if (trend === 'up') return '↑';
    if (trend === 'down') return '↓';
    return '';
  };

  return (
    <div className={`p-4 rounded-lg border ${
      isPrimary 
        ? 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600' 
        : 'bg-gray-200 dark:bg-gray-700 border-gray-400 dark:border-gray-500'
    }`}>
      <div className="flex items-center gap-2 mb-2">
        {icon && <span className="text-lg">{icon}</span>}
        <span className="text-sm text-gray-600 dark:text-gray-300 font-mono">{label}</span>
      </div>
      
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-bold font-mono ${getValueColor()}`}>
          {hasValue ? value.toFixed(1) : '--'}
        </span>
        <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">{unit}</span>
        {trend && (
          <span className={`ml-1 ${
            trend === 'up' ? 'text-green-500' : 
            trend === 'down' ? 'text-red-500' : 'text-gray-400'
          }`}>
            {getTrendIcon()}
          </span>
        )}
      </div>
    </div>
  );
};