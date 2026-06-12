import React, { useState, useRef, useEffect } from 'react';
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

  const [isFundoDropdownOpen, setIsFundoDropdownOpen] = useState(false);
  const [fundoSearchTerm, setFundoSearchTerm] = useState('');
  const [isMericaDropdownOpen, setIsMetricaDropdownOpen] = useState(false);
  const [metricSearchTerm, setMetricSearchTerm] = useState('');
  const fundoDropdownRef = useRef<HTMLDivElement>(null);
  const metricDropdownRef = useRef<HTMLDivElement>(null);
  const [fundoDropdownPosition, setFundoDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const [metricDropdownPosition, setMetricDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);

  const filteredFundos = fundos.filter((f) =>
    f.name.toLowerCase().includes(fundoSearchTerm.toLowerCase())
  );

  const filteredMetrics = availableMetrics.filter((m) =>
    m.label.toLowerCase().includes(metricSearchTerm.toLowerCase())
  );

  const selectedFundo = fundos.find((f) => f.id === selectedFundoId);
  const selectedMetric = availableMetrics.find((m) => m.name === selectedMetricName);

  useEffect(() => {
    if (fundoDropdownRef.current && isFundoDropdownOpen) {
      const rect = fundoDropdownRef.current.getBoundingClientRect();
      setFundoDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [isFundoDropdownOpen]);

  useEffect(() => {
    if (metricDropdownRef.current && isMericaDropdownOpen) {
      const rect = metricDropdownRef.current.getBoundingClientRect();
      setMetricDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  }, [isMericaDropdownOpen]);

  const handleYearChange = (year: number) => {
    onYearChange(year);
    onWeekChange(1); // Reset a semana 1 al cambiar año
  };

  const { startDate, endDate } = getIsoWeekDateRange(selectedYear, selectedWeek);
  const dateRangeFormatted = formatWeekRange(startDate, endDate);

  return (
    <div className="w-56 bg-gray-800 dark:bg-neutral-800 border-r border-gray-700 dark:border-neutral-700 p-4 h-full overflow-y-auto weather-scrollbar">
      {/* Fundo Dropdown */}
      <div className="mb-6">
        <label className="text-base font-bold text-white font-mono mb-2 whitespace-nowrap uppercase block">
          Fundo
        </label>
        <div className="relative" ref={fundoDropdownRef}>
          <button
            onClick={() => setIsFundoDropdownOpen(!isFundoDropdownOpen)}
            className="h-10 min-w-full px-3 bg-gray-700 dark:bg-neutral-700 border border-gray-600 dark:border-neutral-600 rounded text-gray-200 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm flex items-center justify-between"
          >
            <span className={selectedFundo ? 'text-gray-200 dark:text-white' : 'text-gray-400 dark:text-neutral-400'}>
              {selectedFundo?.name || 'Selecciona'}
            </span>
            <svg className={`w-4 h-4 transition-transform ${isFundoDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isFundoDropdownOpen && fundoDropdownPosition && (
            <div
              className="fixed z-[9999] bg-gray-700 dark:bg-neutral-800 border border-gray-600 dark:border-neutral-700 rounded-lg shadow-lg max-h-48 overflow-hidden"
              style={{
                top: `${fundoDropdownPosition.top}px`,
                left: `${fundoDropdownPosition.left}px`,
                width: `${fundoDropdownPosition.width}px`
              }}
            >
              <div className="p-2 border-b border-gray-600 dark:border-neutral-700">
                <input
                  type="text"
                  value={fundoSearchTerm}
                  onChange={(e) => setFundoSearchTerm(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full px-2 py-1 bg-gray-600 dark:bg-neutral-700 border border-gray-500 dark:border-neutral-600 rounded text-gray-200 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="max-h-40 overflow-y-auto weather-scrollbar">
                {filteredFundos.length > 0 ? (
                  filteredFundos.map((fundo) => (
                    <button
                      key={fundo.id}
                      onClick={() => {
                        onFundoChange(fundo.id);
                        setIsFundoDropdownOpen(false);
                        setFundoSearchTerm('');
                      }}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors font-mono ${
                        selectedFundoId === fundo.id
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-200 dark:text-gray-300 hover:bg-gray-600 dark:hover:bg-neutral-700'
                      }`}
                    >
                      {fundo.name}
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-400 dark:text-neutral-400 font-mono">
                    No se encontraron resultados
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Métrica Dropdown */}
      <div className="mb-6">
        <label className="text-base font-bold text-white font-mono mb-2 whitespace-nowrap uppercase block">
          Métrica
        </label>
        <div className="relative" ref={metricDropdownRef}>
          <button
            onClick={() => setIsMetricaDropdownOpen(!isMericaDropdownOpen)}
            disabled={availableMetrics.length === 0}
            className="h-10 min-w-full px-3 bg-gray-700 dark:bg-neutral-700 border border-gray-600 dark:border-neutral-600 rounded text-gray-200 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className={selectedMetric ? 'text-gray-200 dark:text-white' : 'text-gray-400 dark:text-neutral-400'}>
              {selectedMetric?.label || 'Selecciona'}
            </span>
            <svg className={`w-4 h-4 transition-transform ${isMericaDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isMericaDropdownOpen && metricDropdownPosition && availableMetrics.length > 0 && (
            <div
              className="fixed z-[9999] bg-gray-700 dark:bg-neutral-800 border border-gray-600 dark:border-neutral-700 rounded-lg shadow-lg max-h-48 overflow-hidden"
              style={{
                top: `${metricDropdownPosition.top}px`,
                left: `${metricDropdownPosition.left}px`,
                width: `${metricDropdownPosition.width}px`
              }}
            >
              <div className="p-2 border-b border-gray-600 dark:border-neutral-700">
                <input
                  type="text"
                  value={metricSearchTerm}
                  onChange={(e) => setMetricSearchTerm(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full px-2 py-1 bg-gray-600 dark:bg-neutral-700 border border-gray-500 dark:border-neutral-600 rounded text-gray-200 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="max-h-40 overflow-y-auto weather-scrollbar">
                {filteredMetrics.length > 0 ? (
                  filteredMetrics.map((metric) => (
                    <button
                      key={metric.name}
                      onClick={() => {
                        onMetricChange(metric.name);
                        setIsMetricaDropdownOpen(false);
                        setMetricSearchTerm('');
                      }}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors font-mono ${
                        selectedMetricName === metric.name
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-200 dark:text-gray-300 hover:bg-gray-600 dark:hover:bg-neutral-700'
                      }`}
                    >
                      {metric.label}
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-400 dark:text-neutral-400 font-mono">
                    No se encontraron resultados
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Año */}
      <div className="mb-6">
        <label className="text-base font-bold text-white font-mono mb-2 whitespace-nowrap uppercase block">
          Año
        </label>
        <div className="grid grid-cols-1 gap-2">
          {availableYears.map((year) => (
            <button
              key={year}
              onClick={() => handleYearChange(year)}
              className={`px-3 py-2 rounded-md text-sm font-mono font-medium transition-colors ${
                selectedYear === year
                  ? 'bg-gray-600 dark:bg-gray-700 text-white'
                  : 'bg-gray-700 dark:bg-neutral-700 text-gray-200 dark:text-gray-300 border border-gray-600 dark:border-neutral-600 hover:bg-gray-600 dark:hover:bg-neutral-600'
              }`}
            >
              {year}
            </button>
          ))}
        </div>
      </div>

      {/* Semana */}
      <div>
        <label className="text-base font-bold text-white font-mono mb-2 whitespace-nowrap uppercase block">
          Semana
        </label>
        <div className="grid grid-cols-4 gap-1 max-h-64 overflow-y-auto weather-scrollbar">
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
                    ? 'bg-gray-600 dark:bg-gray-700 text-white'
                    : isFuture
                      ? 'bg-gray-700 dark:bg-neutral-700 text-gray-500 dark:text-gray-600 border border-gray-600 dark:border-neutral-600 cursor-not-allowed opacity-50'
                      : 'bg-gray-700 dark:bg-neutral-700 text-gray-200 dark:text-gray-300 border border-gray-600 dark:border-neutral-600 hover:bg-gray-600 dark:hover:bg-neutral-600 cursor-pointer'
                }`}
              >
                S{week}
              </button>
            );
          })}
        </div>
      </div>

      {/* Rango de fechas */}
      <div className="mt-6 pt-4 border-t border-gray-700 dark:border-neutral-700">
        <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">
          {dateRangeFormatted}
        </p>
      </div>
    </div>
  );
};
