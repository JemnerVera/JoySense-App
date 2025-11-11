import React, { useState, useEffect, useMemo } from 'react';
import { JoySenseService } from '../../services/backend-api';
import { useLanguage } from '../../contexts/LanguageContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';

interface UmbralesPorLoteProps {}

interface LoteUmbralData {
  ubicacionid: number;
  ubicacion: string;
  umbralesPorTipo: { [tipoid: number]: { minimo: number; maximo: number; umbral: string; criticidadid: number } };
  umbralCount: number;
}

const UmbralesPorLote: React.FC<UmbralesPorLoteProps> = () => {
  const { t } = useLanguage();
  const [metricas, setMetricas] = useState<any[]>([]);
  const [fundos, setFundos] = useState<any[]>([]);
  const [ubicaciones, setUbicaciones] = useState<any[]>([]);
  const [tipos, setTipos] = useState<any[]>([]);
  const [criticidades, setCriticidades] = useState<any[]>([]);
  const [selectedFundos, setSelectedFundos] = useState<number[]>([]);
  const [selectedMetrica, setSelectedMetrica] = useState<number | null>(null);
  const [orden, setOrden] = useState<'asc' | 'desc'>('desc');
  const [lotesData, setLotesData] = useState<LoteUmbralData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFundoDropdownOpen, setIsFundoDropdownOpen] = useState(false);
  const [isMetricaDropdownOpen, setIsMetricaDropdownOpen] = useState(false);
  const [selectedLote, setSelectedLote] = useState<LoteUmbralData | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [detalleExpanded, setDetalleExpanded] = useState(false);

  // Cargar datos iniciales
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [metricasData, fundosData, tiposData, criticidadesData] = await Promise.all([
          JoySenseService.getMetricas(),
          JoySenseService.getFundos(),
          JoySenseService.getTipos(),
          JoySenseService.getTableData('criticidad', 1000)
        ]);
        
        setMetricas(metricasData || []);
        setFundos(fundosData || []);
        setTipos(tiposData || []);
        setCriticidades(criticidadesData || []);
      } catch (err: any) {
        console.error('Error cargando datos iniciales:', err);
        setError('Error al cargar métricas y fundos');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Cargar ubicaciones cuando se seleccionan fundos
  useEffect(() => {
    const loadUbicaciones = async () => {
      if (selectedFundos.length === 0) {
        setUbicaciones([]);
        return;
      }

      try {
        const ubicacionesData = await JoySenseService.getTableData('ubicacion', 1000);
        const ubicacionesFiltradas = ubicacionesData.filter((u: any) => selectedFundos.includes(u.fundoid));
        setUbicaciones(ubicacionesFiltradas);
      } catch (err: any) {
        console.error('Error cargando ubicaciones:', err);
        setUbicaciones([]);
      }
    };

    loadUbicaciones();
  }, [selectedFundos]);

  // Calcular umbrales por lote
  const calcularUmbralesPorLote = async () => {
    if (selectedFundos.length === 0 || !selectedMetrica) {
      setLotesData([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Obtener umbrales por lote
      const umbrales = await JoySenseService.getUmbralesPorLote({
        fundoIds: selectedFundos,
        metricaId: selectedMetrica
      });

      // Agrupar por ubicación
      const loteMap = new Map<number, { 
        ubicacion: string; 
        umbralesPorTipo: { [tipoid: number]: { minimo: number; maximo: number; umbral: string; criticidadid: number } };
        umbralCount: number;
      }>();

      umbrales.forEach((umbral: any) => {
        const ubicacionId = umbral.ubicacionid;
        const tipoid = umbral.tipoid;

        if (!ubicacionId || !tipoid) {
          return;
        }

        if (!loteMap.has(ubicacionId)) {
          const ubicacion = ubicaciones.find(u => u.ubicacionid === ubicacionId);
          loteMap.set(ubicacionId, {
            ubicacion: ubicacion?.ubicacion || `Ubicación ${ubicacionId}`,
            umbralesPorTipo: {},
            umbralCount: 0
          });
        }

        const lote = loteMap.get(ubicacionId)!;
        lote.umbralCount = Math.max(lote.umbralCount, umbral.umbralCount || 0);
        lote.umbralesPorTipo[tipoid] = {
          minimo: umbral.minimo,
          maximo: umbral.maximo,
          umbral: umbral.umbral,
          criticidadid: umbral.criticidadid
        };
      });

      // Crear array de datos
      const lotesArray: LoteUmbralData[] = Array.from(loteMap.entries()).map(([ubicacionid, data]) => {
        return {
          ubicacionid,
          ubicacion: data.ubicacion,
          umbralesPorTipo: data.umbralesPorTipo,
          umbralCount: data.umbralCount
        };
      });

      // Ordenar según el orden seleccionado (usar promedio de mínimos para ordenar)
      lotesArray.sort((a, b) => {
        const minimosA = Object.values(a.umbralesPorTipo).map(u => u.minimo);
        const minimosB = Object.values(b.umbralesPorTipo).map(u => u.minimo);
        const promedioMinA = minimosA.length > 0 ? minimosA.reduce((sum, val) => sum + val, 0) / minimosA.length : 0;
        const promedioMinB = minimosB.length > 0 ? minimosB.reduce((sum, val) => sum + val, 0) / minimosB.length : 0;
        
        if (orden === 'desc') {
          return promedioMinB - promedioMinA;
        } else {
          return promedioMinA - promedioMinB;
        }
      });

      setLotesData(lotesArray);
    } catch (err: any) {
      console.error('Error calculando umbrales por lote:', err);
      setError('Error al calcular umbrales por lote');
      setLotesData([]);
    } finally {
      setLoading(false);
    }
  };

  // Recalcular cuando cambian los filtros
  useEffect(() => {
    if (selectedFundos.length > 0) {
      calcularUmbralesPorLote();
    } else {
      setLotesData([]);
    }
  }, [selectedMetrica, orden, selectedFundos, ubicaciones]);

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
  const handleRowClick = (lote: LoteUmbralData) => {
    setSelectedLote(lote);
    setShowModal(true);
  };

  // Cerrar modal
  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedLote(null);
    setDetalleExpanded(false);
  };

  return (
    <div className="p-6 bg-gray-50 dark:bg-black min-h-screen">
      <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg p-6">
        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
                <div
                  className={`absolute top-0.5 left-0.5 w-[calc(50%-0.125rem)] h-8 bg-green-500 rounded-md transition-all duration-300 ease-in-out ${
                    orden === 'asc' ? 'translate-x-full' : 'translate-x-0'
                  }`}
                />
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
                    UMBRAL MIN
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-900 dark:text-white font-mono tracking-wider border-b border-gray-300 dark:border-neutral-600">
                    UMBRAL MAX
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-bold text-gray-900 dark:text-white font-mono tracking-wider border-b border-gray-300 dark:border-neutral-600">
                    N° UMBRALES
                  </th>
                </tr>
              </thead>
              <tbody>
                {lotesData.length > 0 ? (
                  lotesData.map((lote) => {
                    // Calcular promedios de mínimos y máximos
                    const minimos = Object.values(lote.umbralesPorTipo).map(u => u.minimo);
                    const maximos = Object.values(lote.umbralesPorTipo).map(u => u.maximo);
                    const promedioMin = minimos.length > 0 
                      ? minimos.reduce((sum, val) => sum + val, 0) / minimos.length 
                      : null;
                    const promedioMax = maximos.length > 0 
                      ? maximos.reduce((sum, val) => sum + val, 0) / maximos.length 
                      : null;

                    // Preparar detalle por tipo para el tooltip (promedios por tipo)
                    const detallePorTipo = Object.entries(lote.umbralesPorTipo)
                      .map(([tipoid, data]) => {
                        const tipo = tipos.find(t => t.tipoid === Number(tipoid));
                        return {
                          tipoNombre: tipo?.tipo || `Tipo ${tipoid}`,
                          minimo: data.minimo,
                          maximo: data.maximo
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
                          {promedioMin !== null ? (
                            <>
                              <span className="cursor-help">{promedioMin.toFixed(2)}</span>
                              {/* Tooltip - Posicionado al costado derecho */}
                              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 w-64 bg-gray-900 dark:bg-neutral-800 text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none p-3">
                                <div className="font-bold mb-2 text-green-400 font-mono border-b border-gray-700 pb-1">
                                  PROMEDIO MIN POR TIPO
                                </div>
                                <div className="space-y-1">
                                  {detallePorTipo.map((detalle, idx) => (
                                    <div key={idx} className="flex justify-between items-center font-mono">
                                      <span className="text-gray-300">{detalle.tipoNombre}:</span>
                                      <span className="font-bold text-white ml-2">{detalle.minimo.toFixed(2)}</span>
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
                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-mono font-bold relative group">
                          {promedioMax !== null ? (
                            <>
                              <span className="cursor-help">{promedioMax.toFixed(2)}</span>
                              {/* Tooltip - Posicionado al costado derecho */}
                              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 w-64 bg-gray-900 dark:bg-neutral-800 text-white text-xs rounded-lg shadow-xl z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none p-3">
                                <div className="font-bold mb-2 text-green-400 font-mono border-b border-gray-700 pb-1">
                                  PROMEDIO MAX POR TIPO
                                </div>
                                <div className="space-y-1">
                                  {detallePorTipo.map((detalle, idx) => (
                                    <div key={idx} className="flex justify-between items-center font-mono">
                                      <span className="text-gray-300">{detalle.tipoNombre}:</span>
                                      <span className="font-bold text-white ml-2">{detalle.maximo.toFixed(2)}</span>
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
                          {lote.umbralCount}
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

      {/* Modal con gráfico de intervalos */}
      {showModal && selectedLote && (() => {
        // Preparar datos del gráfico: un intervalo por cada tipo de sensor
        const chartData = Object.entries(selectedLote.umbralesPorTipo)
          .map(([tipoid, data]) => {
            const tipo = tipos.find(t => t.tipoid === Number(tipoid));
            return {
              tipo: tipo?.tipo || `Tipo ${tipoid}`,
              min: data.minimo,
              max: data.maximo,
              rango: data.maximo - data.minimo
            };
          })
          .sort((a, b) => a.tipo.localeCompare(b.tipo));

        // Preparar detalle por tipo para mostrar en el modal
        const detallePorTipo = Object.entries(selectedLote.umbralesPorTipo)
          .map(([tipoid, data]) => {
            const tipo = tipos.find(t => t.tipoid === Number(tipoid));
            const criticidad = criticidades.find(c => c.criticidadid === data.criticidadid);
            return {
              tipoNombre: tipo?.tipo || `Tipo ${tipoid}`,
              minimo: data.minimo,
              maximo: data.maximo,
              umbral: data.umbral,
              criticidad: criticidad?.criticidad || 'N/A'
            };
          })
          .sort((a, b) => a.tipoNombre.localeCompare(b.tipoNombre));

        // Colores para diferentes tipos de sensores
        const colors = [
          '#10B981', // verde
          '#3B82F6', // azul
          '#F59E0B', // amarillo
          '#EF4444', // rojo
          '#8B5CF6', // púrpura
          '#EC4899', // rosa
          '#06B6D4', // cyan
          '#84CC16', // lime
        ];

        return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-neutral-900 dark:bg-neutral-900 rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-600 dark:border-gray-600">
                <div>
                  <h2 className="text-xl font-bold text-white dark:text-white font-mono tracking-wider">
                    INTERVALOS DE UMBRALES - {selectedLote.ubicacion.toUpperCase()}
                  </h2>
                  <p className="text-sm text-gray-400 dark:text-gray-400 font-mono mt-1">
                    Visualización de rangos de umbrales por tipo de sensor
                  </p>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Contenido */}
              <div className="flex-1 overflow-y-auto p-6">
                {/* Gráfico - Barra horizontal más compacta */}
                {chartData.length > 0 && (
                  <div className="mb-6">
                    <div className="h-64 w-full bg-neutral-800 rounded-lg p-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={chartData}
                          layout="vertical"
                          margin={{ top: 10, right: 30, left: 120, bottom: 10 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke="#4B5563" />
                          <XAxis 
                            type="number" 
                            domain={['auto', 'auto']}
                            stroke="#9CA3AF"
                            style={{ fontSize: '11px' }}
                            tick={{ fill: '#9CA3AF' }}
                          />
                          <YAxis 
                            type="category" 
                            dataKey="tipo" 
                            stroke="#9CA3AF"
                            style={{ fontSize: '11px' }}
                            tick={{ fill: '#9CA3AF' }}
                            width={110}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#1F2937',
                              border: '1px solid #374151',
                              borderRadius: '8px',
                              color: '#F3F4F6',
                              padding: '8px 12px'
                            }}
                            cursor={{ 
                              fill: 'rgba(255, 255, 255, 0.1)',
                              stroke: 'rgba(16, 185, 129, 0.3)',
                              strokeWidth: 1
                            }}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length > 0) {
                                const data = payload[0].payload;
                                return (
                                  <div className="font-mono text-sm">
                                    Rango [{data.min.toFixed(2)} - {data.max.toFixed(2)}]
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Bar dataKey="min" stackId="a" fill="transparent" />
                          <Bar 
                            dataKey="rango" 
                            stackId="a" 
                            fill="#10B981"
                            fillOpacity={0.6}
                            radius={[0, 4, 4, 0]}
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Leyenda con colores por tipo de sensor */}
                    <div className="mt-4">
                      <div className="text-xs text-gray-400 dark:text-gray-400 font-mono mb-2 text-center">
                        Intervalos por Tipo de Sensor:
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-300 dark:text-gray-300 font-mono">
                        {chartData.map((entry, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div 
                              className="w-4 h-4 rounded" 
                              style={{ backgroundColor: colors[index % colors.length], opacity: 0.8 }}
                            ></div>
                            <span>{entry.tipo}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Detalle por tipo - Colapsable */}
                <div className="bg-neutral-800 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setDetalleExpanded(!detalleExpanded)}
                    className="w-full flex justify-between items-center p-4 hover:bg-neutral-700 transition-colors"
                  >
                    <h3 className="text-lg font-bold text-green-400 font-mono tracking-wider">
                      DETALLE POR TIPO DE SENSOR
                    </h3>
                    <svg
                      className={`w-5 h-5 text-green-400 transition-transform ${detalleExpanded ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {detalleExpanded && (
                    <div className="p-4 border-t border-gray-700">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {detallePorTipo.map((detalle, idx) => {
                          const tipoIndex = chartData.findIndex(d => d.tipo === detalle.tipoNombre);
                          const tipoColor = tipoIndex >= 0 ? colors[tipoIndex % colors.length] : '#10B981';
                          return (
                            <div key={idx} className="bg-neutral-900 rounded-lg p-4 border border-gray-700">
                              <div className="flex items-center gap-2 font-bold text-white mb-3 font-mono">
                                <div 
                                  className="w-3 h-3 rounded" 
                                  style={{ backgroundColor: tipoColor, opacity: 0.8 }}
                                ></div>
                                <span className="text-green-400">{detalle.tipoNombre}</span>
                              </div>
                              <div className="space-y-2 text-sm font-mono">
                                <div className="flex justify-between text-gray-300">
                                  <span>Mínimo:</span>
                                  <span className="text-white font-bold">{detalle.minimo.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-300">
                                  <span>Máximo:</span>
                                  <span className="text-white font-bold">{detalle.maximo.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-gray-300">
                                  <span>Umbral:</span>
                                  <span className="text-white font-bold">{detalle.umbral}</span>
                                </div>
                                <div className="flex justify-between text-gray-300">
                                  <span>Criticidad:</span>
                                  <span className="text-white font-bold">{detalle.criticidad}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {detallePorTipo.length === 0 && (
                        <div className="text-gray-400 font-mono text-center py-8">
                          Sin datos disponibles
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default UmbralesPorLote;

