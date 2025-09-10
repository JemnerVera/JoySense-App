import React, { useState, useRef, useEffect } from 'react';
import { useDashboardControls } from '../../hooks/useDashboardControls';
import { useDashboardData } from '../../hooks/useDashboardData';
import OverlayDropdown from '../PushDropdown';

interface DashboardControlsAdvancedProps {
  onFiltersChange?: (filters: {
    metricaId: number | null;
    nodoIds: number[];
    tipoIds: number[];
  }) => void;
}

export const DashboardControlsAdvanced: React.FC<DashboardControlsAdvancedProps> = ({
  onFiltersChange
}) => {
  const { state, actions, hasBaseFilters } = useDashboardControls();
  const { metricas, nodos, tipos } = useDashboardData();

  const [isMetricaDropdownOpen, setIsMetricaDropdownOpen] = useState(false);
  const [isNodosDropdownOpen, setIsNodosDropdownOpen] = useState(false);
  const [isTiposDropdownOpen, setIsTiposDropdownOpen] = useState(false);

  const metricaDropdownRef = useRef<HTMLDivElement>(null);
  const nodosDropdownRef = useRef<HTMLDivElement>(null);
  const tiposDropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdowns cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (metricaDropdownRef.current && !metricaDropdownRef.current.contains(event.target as Node)) {
        setIsMetricaDropdownOpen(false);
      }
      if (nodosDropdownRef.current && !nodosDropdownRef.current.contains(event.target as Node)) {
        setIsNodosDropdownOpen(false);
      }
      if (tiposDropdownRef.current && !tiposDropdownRef.current.contains(event.target as Node)) {
        setIsTiposDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Notificar cambios de filtros
  useEffect(() => {
    if (onFiltersChange) {
      onFiltersChange({
        metricaId: state.selectedMetrica,
        nodoIds: state.selectedNodos,
        tipoIds: state.selectedTipos
      });
    }
  }, [state.selectedMetrica, state.selectedNodos, state.selectedTipos, onFiltersChange]);

  const toggleMetricaDropdown = () => {
    setIsMetricaDropdownOpen(!isMetricaDropdownOpen);
    setIsNodosDropdownOpen(false);
    setIsTiposDropdownOpen(false);
  };

  const toggleNodosDropdown = () => {
    setIsNodosDropdownOpen(!isNodosDropdownOpen);
    setIsMetricaDropdownOpen(false);
    setIsTiposDropdownOpen(false);
  };

  const toggleTiposDropdown = () => {
    setIsTiposDropdownOpen(!isTiposDropdownOpen);
    setIsMetricaDropdownOpen(false);
    setIsNodosDropdownOpen(false);
  };

  const handleMetricaSelect = (metrica: any) => {
    actions.setSelectedMetrica(metrica.metricaid);
    setIsMetricaDropdownOpen(false);
  };

  const handleNodoToggle = (nodo: any) => {
    actions.toggleNodo(nodo.nodoid);
  };

  const handleTipoToggle = (tipo: any) => {
    actions.toggleTipo(tipo.tipoid);
  };

  const selectedMetrica = metricas.find((m: any) => m.metricaid === state.selectedMetrica);
  const selectedNodosCount = state.selectedNodos.length;
  const selectedTiposCount = state.selectedTipos.length;

  if (!hasBaseFilters) {
    return (
      <div className="flex items-center space-x-3">
        <div className="text-sm text-gray-400">
          Completa los filtros globales para ver controles del Dashboard
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-3">
      {/* Dropdown de Métrica */}
      <div className="relative" ref={metricaDropdownRef}>
        <OverlayDropdown
          isOpen={isMetricaDropdownOpen}
          onToggle={toggleMetricaDropdown}
          title="Métrica"
          icon="📊"
          selectedValue={selectedMetrica?.metrica}
          placeholder="Seleccionar Métrica"
          className="w-full"
          buttonClassName="px-4 py-2 min-w-[150px] max-w-[200px] bg-gradient-to-r from-blue-700 to-blue-800 hover:from-blue-800 hover:to-blue-900 text-white rounded-lg font-medium text-sm flex items-center space-x-2 header-button depth-effect dashboard-filter transition-all duration-300 transform hover:scale-105"
          dropdownClassName="w-80 mt-2 rounded-lg dropdown-menu glass-effect"
        >
          {metricas.length > 0 ? (
            metricas.map((metrica: any) => (
              <button
                key={metrica.metricaid}
                onClick={() => handleMetricaSelect(metrica)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  state.selectedMetrica === metrica.metricaid
                    ? 'bg-blue-600 text-white' 
                    : 'text-white hover:bg-gray-700'
                }`}
              >
                {metrica.metrica}
              </button>
            ))
          ) : (
            <p className="text-gray-400 text-sm">No hay métricas disponibles</p>
          )}
        </OverlayDropdown>
      </div>

      {/* Dropdown de Nodos */}
      <div className="relative" ref={nodosDropdownRef}>
        <button
          onClick={toggleNodosDropdown}
          className="px-4 py-2 min-w-[120px] max-w-[200px] bg-gradient-to-r from-green-700 to-green-800 hover:from-green-800 hover:to-green-900 text-white rounded-lg font-medium text-sm flex items-center space-x-2 header-button depth-effect dashboard-filter transition-all duration-300 transform hover:scale-105"
        >
          <span>🔗</span>
          <span className="truncate">
            Nodos {selectedNodosCount > 0 ? `(${selectedNodosCount})` : ''}
          </span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isNodosDropdownOpen && (
          <div className="absolute left-0 mt-2 w-80 rounded-lg z-50 dropdown-menu glass-effect">
            <div className="p-4">
              <h3 className="text-white text-sm font-medium mb-3">🔗 Nodos</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {nodos.length > 0 ? (
                  nodos.map((nodo: any) => (
                    <label
                      key={nodo.nodoid}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={state.selectedNodos.includes(nodo.nodoid)}
                        onChange={() => handleNodoToggle(nodo)}
                        className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-white text-sm">{nodo.nodo}</span>
                    </label>
                  ))
                ) : (
                  <p className="text-gray-400 text-sm">No hay nodos disponibles</p>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-600">
                <button
                  onClick={() => {
                    if (state.selectedNodos.length === nodos.length) {
                      actions.clearFilters();
                    } else {
                      nodos.forEach((nodo: any) => {
                        if (!state.selectedNodos.includes(nodo.nodoid)) {
                          actions.toggleNodo(nodo.nodoid);
                        }
                      });
                    }
                  }}
                  className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                >
                  {state.selectedNodos.length === nodos.length ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dropdown de Tipos */}
      <div className="relative" ref={tiposDropdownRef}>
        <button
          onClick={toggleTiposDropdown}
          className="px-4 py-2 min-w-[120px] max-w-[200px] bg-gradient-to-r from-purple-700 to-purple-800 hover:from-purple-800 hover:to-purple-900 text-white rounded-lg font-medium text-sm flex items-center space-x-2 header-button depth-effect dashboard-filter transition-all duration-300 transform hover:scale-105"
        >
          <span>📈</span>
          <span className="truncate">
            Tipos {selectedTiposCount > 0 ? `(${selectedTiposCount})` : ''}
          </span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isTiposDropdownOpen && (
          <div className="absolute left-0 mt-2 w-80 rounded-lg z-50 dropdown-menu glass-effect">
            <div className="p-4">
              <h3 className="text-white text-sm font-medium mb-3">📈 Tipos</h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {tipos.length > 0 ? (
                  tipos.map((tipo: any) => (
                    <label
                      key={tipo.tipoid}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={state.selectedTipos.includes(tipo.tipoid)}
                        onChange={() => handleTipoToggle(tipo)}
                        className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                      />
                      <span className="text-white text-sm">{tipo.tipo}</span>
                    </label>
                  ))
                ) : (
                  <p className="text-gray-400 text-sm">No hay tipos disponibles</p>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-600">
                <button
                  onClick={() => {
                    if (state.selectedTipos.length === tipos.length) {
                      actions.clearFilters();
                    } else {
                      tipos.forEach((tipo: any) => {
                        if (!state.selectedTipos.includes(tipo.tipoid)) {
                          actions.toggleTipo(tipo.tipoid);
                        }
                      });
                    }
                  }}
                  className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                >
                  {state.selectedTipos.length === tipos.length ? 'Deseleccionar Todo' : 'Seleccionar Todo'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Botón de Reset */}
      {(state.selectedMetrica || state.selectedNodos.length > 0 || state.selectedTipos.length > 0) && (
        <div className="flex items-center space-x-4">
          <div className="w-px h-8 bg-gray-600"></div>
          <button
            onClick={actions.resetFilters}
            className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-medium text-sm flex items-center space-x-2 header-button depth-effect dashboard-filter"
          >
            <span>🔄</span>
            <span>Reset</span>
          </button>
          <div className="w-px h-8 bg-gray-600"></div>
        </div>
      )}
    </div>
  );
};
