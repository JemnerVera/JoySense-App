import React from 'react';
import {
  getAvailableYears,
  getWeeksInYear,
  isWeekInFuture,
  formatWeekRange,
  getIsoWeekDateRange,
} from '../utils/weekYearUtils';

interface WeatherWeekYearSlicerProps {
  fundos: Array<{ id: string; name: string }>;
  selectedFundoId: string | null;
  onFundoChange: (fundoId: string | null) => void;
  availableMetrics: Array<{ name: string; label: string }>;
  selectedMetricName: string | null;
  onMetricChange: (metricName: string | null) => void;
  selectedYear: number;
  selectedWeek: number;
  onYearChange: (year: number) => void;
  onWeekChange: (week: number) => void;
}

export const WeatherWeekYearSlicer: React.FC<WeatherWeekYearSlicerProps> = ({
  fundos,
  selectedFundoId,
  onFundoChange,
  availableMetrics,
  selectedMetricName,
  onMetricChange,
  selectedYear,
  selectedWeek,
  onYearChange,
  onWeekChange,
}) => {
  const availableYears = getAvailableYears();
  const weeksInYear = getWeeksInYear(selectedYear);
  const weeks = Array.from({ length: weeksInYear }, (_, i) => i + 1);

  const handleYearChange = (year: number) => {
    onYearChange(year);
    onWeekChange(1); // Reset a semana 1 al cambiar año
  };

  const { startDate, endDate } = getIsoWeekDateRange(selectedYear, selectedWeek);
  const dateRangeFormatted = formatWeekRange(startDate, endDate);

  return (
    <div className="w-56 bg-white dark:bg-neutral-800 border-r border-gray-200 dark:border-neutral-700 p-4 h-full overflow-y-auto">
      {/* Fundo */}
      <div className="mb-6">
        <label className="text-base font-bold text-blue-500 font-mono mb-2 whitespace-nowrap uppercase block">
          Fundo
        </label>
        <select
          value={selectedFundoId || ''}
          onChange={(e) => onFundoChange(e.target.value || null)}
          className="w-full px-3 py-2 rounded-md text-sm bg-white dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
        >
          <option value="">Seleccionar Fundo</option>
          {fundos.map((fundo) => (
            <option key={fundo.id} value={fundo.id}>
              {fundo.name}
            </option>
          ))}
        </select>
      </div>

      {/* Métrica */}
      <div className="mb-6">
        <label className="text-base font-bold text-blue-500 font-mono mb-2 whitespace-nowrap uppercase block">
          Métrica
        </label>
        <select
          value={selectedMetricName || ''}
          onChange={(e) => onMetricChange(e.target.value || null)}
          disabled={availableMetrics.length === 0}
          className="w-full px-3 py-2 rounded-md text-sm bg-white dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value="">Seleccionar Métrica</option>
          {availableMetrics.map((metric) => (
            <option key={metric.name} value={metric.name}>
              {metric.label}
            </option>
          ))}
        </select>
      </div>

      {/* Año */}
      <div className="mb-6">
        <label className="text-base font-bold text-blue-500 font-mono mb-2 whitespace-nowrap uppercase block">
          Año
        </label>
        <div className="grid grid-cols-1 gap-2">
          {availableYears.map((year) => (
            <button
              key={year}
              onClick={() => handleYearChange(year)}
              className={`px-3 py-2 rounded-md text-sm font-mono font-medium transition-colors ${
                selectedYear === year
                  ? 'bg-cyan-600 text-white'
                  : 'bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-neutral-600 hover:bg-gray-100 dark:hover:bg-neutral-600'
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      {/* Semana */}
      <div>
        <label className="text-base font-bold text-blue-500 font-mono mb-2 whitespace-nowrap uppercase block">
          Semana
        </label>
        <div className="grid grid-cols-4 gap-1 max-h-64 overflow-y-auto">
          {weeks.map((week) => {
            const isFuture = isWeekInFuture(selectedYear, week);
            const isSelected = selectedWeek === week;

            return (
              <button
                key={week}
                onClick={() => !isFuture && onWeekChange(week)}
                disabled={isFuture}
                className={`px-2 py-1 rounded text-xs font-mono font-medium transition-colors ${
                  isSelected
                    ? 'bg-cyan-600 text-white'
                    : isFuture
                      ? 'bg-white dark:bg-neutral-700 text-gray-400 dark:text-gray-600 border border-gray-300 dark:border-neutral-600 cursor-not-allowed opacity-50'
                      : 'bg-white dark:bg-neutral-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-neutral-600 hover:bg-gray-100 dark:hover:bg-neutral-600 cursor-pointer'
                }`}
              >
                S{week}
              </button>
            );
          })}
        </div>
      </div>

      {/* Rango de fechas */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-neutral-700">
        <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">
          {dateRangeFormatted}
        </p>
      </div>
    </div>
  );
};
