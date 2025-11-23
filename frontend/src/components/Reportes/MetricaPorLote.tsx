import React, { useState, useEffect } from 'react';
import { JoySenseService } from '../../services/backend-api';
import { useLanguage } from '../../contexts/LanguageContext';
import MetricaPorLoteModal from './MetricaPorLoteModal';

interface MetricaPorLoteProps {}

interface LoteMetricaData {
  ubicacionid: number;
  ubicacion: string;
  valoresPorTipo: { [tipoid: number]: { valor: number; fecha: string } };
  medicionCount: number;
}

const MetricaPorLote: React.FC<MetricaPorLoteProps> = () => {
  const { t } = useLanguage();
  const [metricas, setMetricas] = useState<any[]>([]);
  const [fundos, setFundos] = useState<any[]>([]);
  const [ubicaciones, setUbicaciones] = useState<any[]>([]);
  const [localizaciones, setLocalizaciones] = useState<any[]>([]);
  const [tipos, setTipos] = useState<any[]>([]);
  const [selectedFundos, setSelectedFundos] = useState<number[]>([]);
  const [selectedMetrica, setSelectedMetrica] = useState<number | null>(null);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [orden, setOrden] = useState<'asc' | 'desc'>('desc');
  const [lotesData, setLotesData] = useState<LoteMetricaData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedLote, setSelectedLote] = useState<LoteMetricaData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [isDateRangeOpen, setIsDateRangeOpen] = useState(false);
  const [isFundoDropdownOpen, setIsFundoDropdownOpen] = useState(false);
  const [isMetricaDropdownOpen, setIsMetricaDropdownOpen] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [metricasData, fundosData, localizacionesData, tiposData] = await Promise.all([
          JoySenseService.getMetricas(),
          JoySenseService.getFundos(),
          JoySenseService.getTableData('localizacion', 1000),
          JoySenseService.getTipos()
        ]);
        
        setMetricas(metricasData || []);
        setFundos(fundosData || []);
        setLocalizaciones(localizacionesData || []);
        setTipos(tiposData || []);
        
        // Establecer fecha por defecto (últimos 30 días)
        const today = new Date();
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        
        setEndDate(today.toISOString().split('T')[0]);
        setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
      } catch (err: any) {
        console.error('Error cargando datos iniciales:', err);
        setError('Error al cargar métricas y fundos');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Cargar ubicaciones cuando se seleccionan fundos (solo las que tienen localizaciones)
  useEffect(() => {
    const loadUbicaciones = async () => {
      if (selectedFundos.length === 0) {
        setUbicaciones([]);
        return;
      }

      try {
        const ubicacionesData = await JoySenseService.getTableData('ubicacion', 1000);
        const ubicacionesFiltradas = ubicacionesData.filter((u: any) => selectedFundos.includes(u.fundoid));
        
        // Filtrar solo ubicaciones que tienen localizaciones asociadas
        const ubicacionesConLocalizacion = ubicacionesFiltradas.filter((u: any) => {
          return localizaciones.some((loc: any) => loc.ubicacionid === u.ubicacionid);
        });
        
        setUbicaciones(ubicacionesConLocalizacion);
      } catch (err: any) {
        console.error('Error cargando ubicaciones:', err);
        setUbicaciones([]);
      }
    };

    loadUbicaciones();
  }, [selectedFundos, localizaciones]);

  // Calcular valores de métrica por lote
  const calcularMetricaPorLote = async () => {
    if (!selectedMetrica || !startDate || !endDate || selectedFundos.length === 0) {
      setLotesData([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Obtener ubicaciones de los fundos seleccionados
      const ubicacionesFundos = ubicaciones.filter(u => selectedFundos.includes(u.fundoid));
      const ubicacionIds = ubicacionesFundos.map(u => u.ubicacionid);

      if (ubicacionIds.length === 0) {
        setLotesData([]);
        return;
      }

      // Usar endpoint optimizado para obtener solo las últimas mediciones por lote
      const ultimasMediciones = await JoySenseService.getUltimasMedicionesPorLote({
        fundoIds: selectedFundos,
        metricaId: selectedMetrica,
        startDate: `${startDate} 00:00:00`,
        endDate: `${endDate} 23:59:59`
      });

      // Obtener tipos únicos en los datos
      const tiposUnicos = Array.from(new Set(ultimasMediciones.map((m: any) => m.tipoid).filter(Boolean)));

      // Agrupar por ubicación
      const loteMap = new Map<number, { 
        ubicacion: string; 
        valoresPorTipo: { [tipoid: number]: { valor: number; fecha: string } };
        medicionCount: number;
      }>();

      ultimasMediciones.forEach((medicion: any) => {
        const ubicacionId = medicion.ubicacionid;
        const tipoid = medicion.tipoid;
        const valor = medicion.valor;
        const fecha = medicion.fecha;
        const medicionCount = medicion.medicionCount || 0;

        if (!ubicacionId || !tipoid || valor == null || isNaN(valor) || !fecha) {
          return;
        }

        if (!loteMap.has(ubicacionId)) {
          const ubicacion = ubicaciones.find(u => u.ubicacionid === ubicacionId);
          loteMap.set(ubicacionId, {
            ubicacion: ubicacion?.ubicacion || `Ubicación ${ubicacionId}`,
            valoresPorTipo: {},
            medicionCount: 0
          });
        }

        const lote = loteMap.get(ubicacionId)!;
        lote.medicionCount = Math.max(lote.medicionCount, medicionCount);
        lote.valoresPorTipo[tipoid] = {
          valor: parseFloat(valor),
          fecha: fecha
        };
      });

      // Crear array de datos con valores por tipo
      const lotesArray: LoteMetricaData[] = Array.from(loteMap.entries()).map(([ubicacionid, data]) => {
        return {
          ubicacionid,
          ubicacion: data.ubicacion,
          valoresPorTipo: data.valoresPorTipo,
          medicionCount: data.medicionCount
        };
      });

      // Ordenar según el orden seleccionado (usar el primer tipo disponible para ordenar)
      if (tiposUnicos.length > 0) {
        const primerTipo = tiposUnicos[0];
        lotesArray.sort((a, b) => {
          const valorA = a.valoresPorTipo[primerTipo]?.valor || 0;
          const valorB = b.valoresPorTipo[primerTipo]?.valor || 0;
          if (orden === 'desc') {
            return valorB - valorA;
          } else {
            return valorA - valorB;
          }
        });
      }

      setLotesData(lotesArray);
    } catch (err: any) {
      console.error('Error calculando métrica por lote:', err);
      setError('Error al calcular métrica por lote');
      setLotesData([]);
    } finally {
      setLoading(false);
    }
  };

  // Recalcular cuando cambian los filtros
  useEffect(() => {
    if (selectedMetrica && startDate && endDate && selectedFundos.length > 0) {
      calcularMetricaPorLote();
    } else {
      setLotesData([]);
    }
  }, [selectedMetrica, startDate, endDate, orden, selectedFundos, ubicaciones]);

  // Manejar selección de fundos
  const handleFundoToggle = (fundoId: number) => {
    setSelectedFundos(prev => {
      if (prev.includes(fundoId)) {
        return prev.filter(id => id !== fundoId);
      } else {
        return [...prev, fundoId];
      }
    });
  };

  // Manejar "Seleccionar todos"
  const handleSelectAllFundos = () => {
    if (selectedFundos.length === fundos.length) {
      setSelectedFundos([]);
    } else {
      setSelectedFundos(fundos.map(f => f.fundoid));
    }
  };

  // Manejar click en fila de tabla
  const handleRowClick = (lote: LoteMetricaData) => {
    setSelectedLote(lote);
    setShowModal(true);
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedLote(null);
  };

  // Formatear rango de fechas para display (formato corto: 11/10 - 10/11)
  const formatDateRange = () => {
    if (!startDate || !endDate) return 'Seleccionar intervalo';
    const start = new Date(startDate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
    const end = new Date(endDate).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
    return `${start} - ${end}`;
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-black min-h-screen">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-6">
        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {/* Combobox Fundo - Selección Múltiple */}
          <div className="relative">
            <label className="block text-sm font-medium text-green-500 mb-2 font-mono tracking-wider">
              FUNDO
            </label>
            <button
              type="button"
              onClick={() => {
                setIsFundoDropdownOpen(!isFundoDropdownOpen);
                setIsMetricaDropdownOpen(false);
                setIsDateRangeOpen(false);
              }}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 dark:text-white font-mono text-left flex items-center justify-between hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
            >
              <span>
                {selectedFundos.length === 0
                  ? 'Seleccionar fundo'
                  : selectedFundos.length === 1
                  ? fundos.find(f => f.fundoid === selectedFundos[0])?.fundo || 'Seleccionar fundo'
                  : `${selectedFundos.length} fundos seleccionados`}
              </span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isFundoDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto dashboard-scrollbar">
                {/* Opción "Seleccionar todos" */}
                <button
                  onClick={handleSelectAllFundos}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors font-mono border-b border-gray-200 dark:border-neutral-600 ${
                    selectedFundos.length === fundos.length
                      ? 'bg-green-500 text-white'
                      : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {selectedFundos.length === fundos.length ? '✓ Seleccionar todos' : 'Seleccionar todos'}
                </button>
                {fundos.map((fundo) => (
                  <button
                    key={fundo.fundoid}
                    onClick={() => handleFundoToggle(fundo.fundoid)}
                    className={`w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors font-mono flex items-center gap-2 ${
                      selectedFundos.includes(fundo.fundoid)
                        ? 'bg-green-500 text-white'
                        : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    <span className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                      selectedFundos.includes(fundo.fundoid)
                        ? 'border-white bg-white'
                        : 'border-gray-400 dark:border-gray-500'
                    }`}>
                      {selectedFundos.includes(fundo.fundoid) && (
                        <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </span>
                    {fundo.fundo}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Combobox Métrica */}
          <div className="relative">
            <label className="block text-sm font-medium text-green-500 mb-2 font-mono tracking-wider">
              MÉTRICA
            </label>
            <button
              type="button"
              onClick={() => {
                setIsMetricaDropdownOpen(!isMetricaDropdownOpen);
                setIsFundoDropdownOpen(false);
                setIsDateRangeOpen(false);
              }}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 dark:text-white font-mono text-left flex items-center justify-between hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
            >
              <span>{selectedMetrica ? metricas.find(m => m.metricaid === selectedMetrica)?.metrica || 'Seleccionar métrica' : 'Seleccionar métrica'}</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {isMetricaDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto dashboard-scrollbar">
                {metricas.map((metrica) => (
                  <button
                    key={metrica.metricaid}
                    onClick={() => {
                      setSelectedMetrica(metrica.metricaid);
                      setIsMetricaDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors font-mono ${
                      selectedMetrica === metrica.metricaid
                        ? 'bg-green-500 text-white'
                        : 'text-gray-900 dark:text-white'
                    }`}
                  >
                    {metrica.metrica}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Combobox Intervalo de Fechas */}
          <div className="relative">
            <label className="block text-sm font-medium text-green-500 mb-2 font-mono tracking-wider">
              INTERVALO DE FECHAS
            </label>
            <button
              type="button"
              onClick={() => {
                setIsDateRangeOpen(!isDateRangeOpen);
                setIsFundoDropdownOpen(false);
                setIsMetricaDropdownOpen(false);
              }}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 dark:text-white font-mono text-left flex items-center justify-between hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
            >
              <span>{formatDateRange()}</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            {isDateRangeOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg shadow-lg z-50 p-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-neutral-300 mb-1 font-mono tracking-wider">
                      FECHA INICIO
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-100 dark:bg-neutral-800 text-gray-800 dark:text-white rounded-lg border border-gray-300 dark:border-neutral-600 focus:border-green-500 focus:outline-none text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-neutral-300 mb-1 font-mono tracking-wider">
                      FECHA FIN
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-100 dark:bg-neutral-800 text-gray-800 dark:text-white rounded-lg border border-gray-300 dark:border-neutral-600 focus:border-green-500 focus:outline-none text-sm font-mono"
                    />
                  </div>
                  <div className="flex justify-center">
                    <button
                      onClick={() => setIsDateRangeOpen(false)}
                      className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded font-mono text-xs tracking-wider transition-colors"
                    >
                      APLICAR
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Orden - Toggle Switch */}
          <div>
            <label className="block text-sm font-medium text-green-500 mb-2 font-mono tracking-wider">
              ORDEN
            </label>
            <div className="relative w-full max-w-[120px]">
              <button
                type="button"
                onClick={() => setOrden(orden === 'desc' ? 'asc' : 'desc')}
                className="relative w-full h-9 bg-gray-200 dark:bg-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
              >
                {/* Slider */}
                <div
                  className={`absolute top-0.5 left-0.5 w-[calc(50%-0.125rem)] h-8 bg-green-500 rounded-md transition-all duration-300 ease-in-out ${
                    orden === 'asc' ? 'translate-x-full' : 'translate-x-0'
                  }`}
                />
                {/* Labels */}
                <div className="relative flex h-full items-center justify-around font-mono text-xs font-bold px-1">
                  <span className={`z-10 transition-colors duration-300 ${
                    orden === 'desc' ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    Desc
                  </span>
                  <span className={`z-10 transition-colors duration-300 ${
                    orden === 'asc' ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    Asc
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-4 bg-red-900 border border-red-600 rounded-md">
            <p className="text-sm text-red-300 font-mono">{error}</p>
          </div>
        )}

        {/* Tabla de Resultados */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
              <p className="text-gray-600 dark:text-gray-400 font-mono">Cargando datos...</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-200 dark:bg-neutral-700">
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-900 dark:text-white font-mono tracking-wider border-b border-gray-300 dark:border-neutral-600">
                    LOTE
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-900 dark:text-white font-mono tracking-wider border-b border-gray-300 dark:border-neutral-600">
                    VALOR DE MÉTRICA
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-900 dark:text-white font-mono tracking-wider border-b border-gray-300 dark:border-neutral-600">
                    MEDICIONES
                  </th>
                </tr>
              </thead>
              <tbody>
                {lotesData.length > 0 ? (
                  lotesData.map((lote) => {
                    // Calcular promedio de todos los valores por tipo
                    const valores = Object.values(lote.valoresPorTipo).map(v => v.valor);
                    const promedio = valores.length > 0 
                      ? valores.reduce((sum, val) => sum + val, 0) / valores.length 
                      : null;

                    // Preparar detalle por tipo para el tooltip
                    const detallePorTipo = Object.entries(lote.valoresPorTipo)
                      .map(([tipoid, data]) => {
                        const tipo = tipos.find(t => t.tipoid === Number(tipoid));
                        return {
                          tipoNombre: tipo?.tipo || `Tipo ${tipoid}`,
                          valor: data.valor,
                          fecha: data.fecha
                        };
                      })
                      .sort((a, b) => a.tipoNombre.localeCompare(b.tipoNombre));

                    return (
                      <tr
                        key={lote.ubicacionid}
                        onClick={() => handleRowClick(lote)}
                        className="cursor-pointer hover:bg-gray-100 dark:hover:bg-neutral-700 transition-colors border-b border-gray-200 dark:border-neutral-600"
                      >
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-mono">
                          {lote.ubicacion}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-mono font-bold relative group">
                          {promedio !== null ? (
                            <>
                              <span className="cursor-help">{promedio.toFixed(2)}</span>
                              {/* Tooltip - Posicionado al costado derecho */}
                              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 w-64 bg-gray-900 dark:bg-neutral-800 text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none p-3">
                                <div className="font-bold mb-2 text-green-400 font-mono border-b border-gray-700 pb-1">
                                  DETALLE POR TIPO DE SENSOR
                                </div>
                                <div className="space-y-1">
                                  {detallePorTipo.map((detalle, idx) => (
                                    <div key={idx} className="flex justify-between items-center font-mono">
                                      <span className="text-gray-300">{detalle.tipoNombre}:</span>
                                      <span className="font-bold text-white ml-2">{detalle.valor.toFixed(2)}</span>
                                    </div>
                                  ))}
                                </div>
                                {detallePorTipo.length === 0 && (
                                  <div className="text-gray-400 font-mono text-center py-1">
                                    Sin datos
                                  </div>
                                )}
                              </div>
                            </>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 font-mono">
                          {lote.medicionCount}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr className="border-b border-gray-200 dark:border-neutral-600">
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-500 font-mono text-center">
                      -
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-500 font-mono text-center">
                      -
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-500 font-mono text-center">
                      -
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal con gráfico */}
      {showModal && selectedLote && selectedMetrica && (
        <MetricaPorLoteModal
          isOpen={showModal}
          onClose={handleCloseModal}
          ubicacionId={selectedLote.ubicacionid}
          ubicacionNombre={selectedLote.ubicacion}
          metricaId={selectedMetrica}
          metricaNombre={metricas.find(m => m.metricaid === selectedMetrica)?.metrica || 'Métrica'}
          startDate={startDate}
          endDate={endDate}
        />
      )}
    </div>
  );
};

export default MetricaPorLote;
