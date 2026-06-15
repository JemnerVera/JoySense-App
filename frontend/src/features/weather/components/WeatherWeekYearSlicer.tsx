import React, { useState, useRef, useEffect } from 'react';
import { useSidebar } from '../../../contexts/SidebarContext';
import type { WeatherStation } from '../../../hooks/useWeatherData';
import {
  getAvailableYears,
  getWeeksInYear,
  isWeekInFuture,
  formatWeekRange,
  getIsoWeekDateRange,
} from '../utils/weekYearUtils';

interface WeatherWeekYearSlicerProps {
  stations: WeatherStation[];
  selectedStation: WeatherStation | null;
  onStationChange: (station: WeatherStation | null) => void;
  stationsLoading?: boolean;
  availableMetrics: Array<{ name: string; label: string }>;
  selectedMetricName: string | null;
  onMetricChange: (metricName: string | null) => void;
  selectedYear: number;
  selectedWeek: number;
  onYearChange: (year: number) => void;
  onWeekChange: (week: number) => void;
  availableYearsWithData?: number[];
  availableWeeksWithData?: Set<number>;
  availabilityLoading?: boolean;
}

export const WeatherWeekYearSlicer: React.FC<WeatherWeekYearSlicerProps> = ({
  stations,
  selectedStation,
  onStationChange,
  stationsLoading = false,
  availableMetrics,
  selectedMetricName,
  onMetricChange,
  selectedYear,
  selectedWeek,
  onYearChange,
  onWeekChange,
  availableYearsWithData = [],
  availableWeeksWithData,
  availabilityLoading = false,
}) => {
  const { isCollapsed, state } = useSidebar();
  const availableYears = getAvailableYears();
  const weeksInYear = getWeeksInYear(selectedYear);
  const weeks = Array.from({ length: weeksInYear }, (_, i) => i + 1);

  const [isStationDropdownOpen, setIsStationDropdownOpen] = useState(false);
  const [stationSearchTerm, setStationSearchTerm] = useState('');
  const [isMericaDropdownOpen, setIsMetricaDropdownOpen] = useState(false);
  const [metricSearchTerm, setMetricSearchTerm] = useState('');
  const stationDropdownRef = useRef<HTMLDivElement>(null);
  const metricDropdownRef = useRef<HTMLDivElement>(null);
  const [stationDropdownPosition, setStationDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);
  const [metricDropdownPosition, setMetricDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);

  const filteredStations = stations.filter((s) =>
    s.name.toLowerCase().includes(stationSearchTerm.toLowerCase())
  );

  const filteredMetrics = availableMetrics.filter((m) =>
    m.label.toLowerCase().includes(metricSearchTerm.toLowerCase())
  );

  const selectedMetric = availableMetrics.find((m) => m.name === selectedMetricName);

  const formatStationLabel = (station: WeatherStation) =>
    `${station.name}${station.hasHistoric ? ' (+Hist)' : ''}`;

  useEffect(() => {
    if (isStationDropdownOpen && stationDropdownRef.current) {
      let animationFrameId: number;
      let isMounted = true;

      const updatePosition = () => {
        if (!isMounted || !stationDropdownRef.current) return;
        const rect = stationDropdownRef.current.getBoundingClientRect();
        setStationDropdownPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
        });

        if (isMounted) {
          animationFrameId = requestAnimationFrame(updatePosition);
        }
      };

      animationFrameId = requestAnimationFrame(updatePosition);

      return () => {
        isMounted = false;
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
      };
    } else {
      setStationDropdownPosition(null);
    }
  }, [isStationDropdownOpen, isCollapsed, state]);

  useEffect(() => {
    if (isMericaDropdownOpen && metricDropdownRef.current) {
      let animationFrameId: number;
      let isMounted = true;

      const updatePosition = () => {
        if (!isMounted || !metricDropdownRef.current) return;
        const rect = metricDropdownRef.current.getBoundingClientRect();
        setMetricDropdownPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
        });

        if (isMounted) {
          animationFrameId = requestAnimationFrame(updatePosition);
        }
      };

      animationFrameId = requestAnimationFrame(updatePosition);

      return () => {
        isMounted = false;
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId);
        }
      };
    } else {
      setMetricDropdownPosition(null);
    }
  }, [isMericaDropdownOpen, isCollapsed, state]);

  const handleYearChange = (year: number) => {
    onYearChange(year);
    onWeekChange(1);
  };

  const { startDate, endDate } = getIsoWeekDateRange(selectedYear, selectedWeek);
  const dateRangeFormatted = formatWeekRange(startDate, endDate);

  return (
    <div className="w-60 flex-shrink-0 bg-gray-800 dark:bg-neutral-800 border-r border-gray-700 dark:border-neutral-700 p-4 h-full min-h-0 overflow-y-auto overflow-x-hidden weather-scrollbar">
      {/* Estación Dropdown */}
      <div className="mb-6">
        <label className="text-base font-bold text-white font-mono mb-2 whitespace-nowrap uppercase block">
          Estación
        </label>
        <div className="relative" ref={stationDropdownRef}>
          <button
            onClick={() => !stationsLoading && setIsStationDropdownOpen(!isStationDropdownOpen)}
            disabled={stationsLoading || stations.length === 0}
            className="h-10 w-full min-w-0 px-3 bg-gray-700 dark:bg-neutral-700 border border-gray-600 dark:border-neutral-600 rounded text-gray-200 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className={`truncate min-w-0 ${selectedStation ? 'text-gray-200 dark:text-white' : 'text-gray-400 dark:text-neutral-400'}`}>
              {stationsLoading
                ? 'Cargando...'
                : selectedStation
                  ? formatStationLabel(selectedStation)
                  : 'Selecciona'}
            </span>
            <svg className={`w-4 h-4 flex-shrink-0 transition-transform ${isStationDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isStationDropdownOpen && stationDropdownPosition && (
            <div
              className="fixed z-[9999] bg-gray-700 dark:bg-neutral-800 border border-gray-600 dark:border-neutral-700 rounded-lg shadow-lg max-h-48 overflow-hidden"
              style={{
                top: `${stationDropdownPosition.top}px`,
                left: `${stationDropdownPosition.left}px`,
                width: `${stationDropdownPosition.width}px`
              }}
            >
              <div className="p-2 border-b border-gray-600 dark:border-neutral-700">
                <input
                  type="text"
                  value={stationSearchTerm}
                  onChange={(e) => setStationSearchTerm(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full px-2 py-1 bg-gray-600 dark:bg-neutral-700 border border-gray-500 dark:border-neutral-600 rounded text-gray-200 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="max-h-40 overflow-y-auto weather-scrollbar">
                {filteredStations.length > 0 ? (
                  filteredStations.map((station) => (
                    <button
                      key={station.id}
                      onClick={() => {
                        onStationChange(station);
                        setIsStationDropdownOpen(false);
                        setStationSearchTerm('');
                      }}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors font-mono ${
                        selectedStation?.id === station.id
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-200 dark:text-gray-300 hover:bg-gray-600 dark:hover:bg-neutral-700'
                      }`}
                    >
                      {formatStationLabel(station)}
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
            className="h-10 w-full min-w-0 px-3 bg-gray-700 dark:bg-neutral-700 border border-gray-600 dark:border-neutral-600 rounded text-gray-200 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm flex items-center justify-between disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className={`truncate min-w-0 ${selectedMetric ? 'text-gray-200 dark:text-white' : 'text-gray-400 dark:text-neutral-400'}`}>
              {selectedMetric?.label || 'Selecciona'}
            </span>
            <svg className={`w-4 h-4 flex-shrink-0 transition-transform ${isMericaDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
          {availableYears.map((year) => {
            const hasData = availableYearsWithData.length === 0 || availableYearsWithData.includes(year);
            const isDisabled = availabilityLoading || !hasData;

            return (
              <button
                key={year}
                onClick={() => !isDisabled && handleYearChange(year)}
                disabled={isDisabled}
                className={`px-3 py-2 rounded-md text-sm font-mono font-medium transition-colors ${
                  selectedYear === year
                    ? 'bg-gray-600 dark:bg-gray-700 text-white'
                    : isDisabled
                      ? 'bg-gray-700 dark:bg-neutral-700 text-gray-500 dark:text-gray-600 border border-gray-600 dark:border-neutral-600 cursor-not-allowed opacity-50'
                      : 'bg-gray-700 dark:bg-neutral-700 text-gray-200 dark:text-gray-300 border border-gray-600 dark:border-neutral-600 hover:bg-gray-600 dark:hover:bg-neutral-600'
                }`}
              >
                {year}
              </button>
            );
          })}
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
            const hasData = !availableWeeksWithData || availableWeeksWithData.has(week);
            const isSelected = selectedWeek === week;
            const isDisabled = isFuture || availabilityLoading || !hasData;

            return (
              <button
                key={week}
                onClick={() => !isDisabled && onWeekChange(week)}
                disabled={isDisabled}
                className={`px-2 py-1 rounded text-xs font-mono font-medium transition-colors ${
                  isSelected
                    ? 'bg-gray-600 dark:bg-gray-700 text-white'
                    : isDisabled
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
