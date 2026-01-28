import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { flushSync } from 'react-dom';
import { JoySenseService } from '../../services/backend-api';
import SupabaseRPCService from '../../services/supabase-rpc';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { InteractiveLocalizacionMap } from './InteractiveLocalizacionMap';

interface MedicionesDashboardProps {}

// Colores para las líneas de los gráficos
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f43f5e', '#6366f1'];

export function MedicionesDashboard(_props: MedicionesDashboardProps) {
  const { t } = useLanguage();
  const { showError, showWarning } = useToast();

  const [localizaciones, setLocalizaciones] = useState<any[]>([]);
  const [selectedLocalizacion, setSelectedLocalizacion] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [mediciones, setMediciones] = useState<any[]>([]);
  const [tipos, setTipos] = useState<any[]>([]);
  const [sensores, setSensores] = useState<any[]>([]);
  const [selectedNodoId, setSelectedNodoId] = useState<number | null>(null);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  
  // Estados para fechas temporales (antes de aplicar)
  const [pendingDateRange, setPendingDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  // Estado para la métrica seleccionada
  const [selectedMetricId, setSelectedMetricId] = useState<number | null>(null);
  
  // Estado para el modal del mapa
  const [showMapModal, setShowMapModal] = useState(false);

  // Estado para ajuste del eje Y
  const [yAxisDomain, setYAxisDomain] = useState<{ min: number | null; max: number | null }>({ min: null, max: null });

  // Estados para combobox con searchbar
  const [isLocalizacionDropdownOpen, setIsLocalizacionDropdownOpen] = useState(false);
  const [localizacionSearchTerm, setLocalizacionSearchTerm] = useState('');
  const localizacionDropdownRef = useRef<HTMLDivElement>(null);
  const [localizacionDropdownPosition, setLocalizacionDropdownPosition] = useState<{ top: number; left: number; width: number } | null>(null);

  // Función para obtener la etiqueta de la serie
  const getSeriesLabel = useCallback((m: any) => {
    const sensorId = m.sensorid || m.localizacion?.sensorid;
    const sensorInfo = sensores.find(s => s.sensorid === sensorId);
    
    const sensorName = sensorInfo?.sensor || 
                       sensorInfo?.nombre || 
                       sensorInfo?.modelo || 
                       m.localizacion?.sensor?.sensor || 
                       m.localizacion?.sensor?.nombre;
    
    const tipoId = m.tipoid || sensorInfo?.tipoid || m.localizacion?.sensor?.tipoid || m.localizacion?.sensor?.tipo?.tipoid;
    const tipoInfo = tipos.find(t => t.tipoid === tipoId);
    const tipoName = tipoInfo?.tipo || m.localizacion?.sensor?.tipo?.tipo || 'Sensor';
    
    if (sensorName && sensorName !== tipoName) {
      return `${tipoName} - ${sensorName}`;
    }
    
    if (sensorId && sensorId !== tipoId) {
      return `${tipoName} (ID: ${sensorId})`;
    }
    
    return tipoName;
  }, [sensores, tipos]);

  // Mapa de nombres de métricas - mejorado para buscar en diferentes lugares
  const metricNamesMap = useMemo(() => {
    const map: { [key: number]: string } = {};
    if (mediciones.length > 0) {
      mediciones.forEach((m: any) => {
        // Intentar obtener metricId desde múltiples fuentes
        const metricId = m.metricaid || m.localizacion?.metricaid || 0;
        if (metricId && !map[metricId]) {
          // Intentar obtener nombre desde múltiples fuentes
          const metricName = m.metrica || 
                            m.localizacion?.metrica?.metrica ||
                            m.localizacion?.metrica ||
                            m.nombre || 
                            `Métrica ${metricId}`;
          map[metricId] = metricName;
        }
      });
    }
    console.log('[MedicionesDashboard] metricNamesMap:', map);
    return map;
  }, [mediciones]);

  // Obtener métricas disponibles - mejorado
  const availableMetrics = useMemo(() => {
    if (!selectedLocalizacion || mediciones.length === 0) return [];
    
    const metricsSet = new Set<number>();
    mediciones.forEach((m: any) => {
      // Intentar obtener metricId desde múltiples fuentes
      const metricId = m.metricaid || m.localizacion?.metricaid || 0;
      if (metricId) metricsSet.add(metricId);
    });
    
    const metrics = Array.from(metricsSet).map(id => ({
      id,
      name: metricNamesMap[id] || `Métrica ${id}`
    })).sort((a, b) => a.name.localeCompare(b.name));
    
    console.log('[MedicionesDashboard] availableMetrics:', metrics);
    return metrics;
  }, [selectedLocalizacion, mediciones, metricNamesMap]);

  // Establecer la métrica seleccionada por defecto cuando hay métricas disponibles
  useEffect(() => {
    if (availableMetrics.length > 0 && (!selectedMetricId || !availableMetrics.find(m => m.id === selectedMetricId))) {
      setSelectedMetricId(availableMetrics[0].id);
    }
  }, [availableMetrics]);

  // Filtrar localizaciones por término de búsqueda
  const filteredLocalizaciones = useMemo(() => {
    if (!localizacionSearchTerm.trim()) {
      return localizaciones;
    }
    return localizaciones.filter((localizacion: any) =>
      localizacion.localizacion?.toLowerCase().includes(localizacionSearchTerm.toLowerCase())
    );
  }, [localizaciones, localizacionSearchTerm]);

  // Calcular posición del dropdown de localización cuando se abre
  useEffect(() => {
    if (isLocalizacionDropdownOpen && localizacionDropdownRef.current) {
      const rect = localizacionDropdownRef.current.getBoundingClientRect();
      setLocalizacionDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    } else {
      setLocalizacionDropdownPosition(null);
    }
  }, [isLocalizacionDropdownOpen]);

  // Cerrar dropdown cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (localizacionDropdownRef.current && !localizacionDropdownRef.current.contains(event.target as Node)) {
        setIsLocalizacionDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Cargar localizaciones, tipos y sensores disponibles al inicio
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        const [localizacionesData, tiposData, sensoresData] = await Promise.all([
          JoySenseService.getLocalizaciones(),
          JoySenseService.getTipos(),
          JoySenseService.getSensores()
        ]);
        setLocalizaciones(localizacionesData || []);
        setTipos(tiposData || []);
        setSensores(sensoresData || []);
      } catch (err: any) {
        console.error('[MedicionesDashboard] Error cargando datos iniciales:', err);
        showError('Error', 'Error al cargar datos iniciales');
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, [showError]);

  // Cargar mediciones cuando cambia la localización o el rango de fechas
  useEffect(() => {
    if (!selectedLocalizacion) {
      setMediciones([]);
      setSelectedNodoId(null);
      return;
    }

    // Cuando se selecciona una localización, extraer su nodo
    const nodoId = selectedLocalizacion.nodoid || selectedLocalizacion.nodo?.nodoid;
    setSelectedNodoId(nodoId);

        const loadMediciones = async () => {
      try {
        setLoading(true);

        // Cargar mediciones del nodo
        const medicionesDetalladas = await SupabaseRPCService.getMedicionesNodoCompleto({
          nodoid: nodoId,
          startDate: dateRange.start,
          endDate: dateRange.end
        });

        // CRÍTICO: Obtener TODAS las localizaciones del nodo (catálogo)
        // para garantizar que TODOS los sensores aparezcan, incluso sin datos
        const todasLasLocalizaciones = await JoySenseService.getLocalizacionesByNodo(nodoId);

        // Transformar mediciones detalladas a formato compatible
        let medicionesArray = medicionesDetalladas.map((m: any) => ({
          medicionid: m.medicionid,
          fecha: m.fecha,
          medicion: m.medicion ? parseFloat(m.medicion) : null,
          metricaid: m.metricaid,
          sensorid: m.sensorid,
          tipoid: m.tipoid,
          localizacionid: m.localizacionid,
          localizacion: {
            localizacionid: m.localizacionid,
            metricaid: m.metricaid,
            sensorid: m.sensorid,
            tipoid: m.tipoid,
            metrica: { 
              metricaid: m.metricaid,
              metrica: m.metrica_nombre || `Métrica ${m.metricaid}`,
              unidad: m.unidad
            },
            sensor: {
              sensorid: m.sensorid,
              sensor: m.sensor_nombre || `Sensor ${m.sensorid}`,
              tipoid: m.tipoid,
              tipo: {
                tipoid: m.tipoid,
                tipo: m.tipo_nombre || 'Sensor'
              }
            }
          }
        }));

        // ASEGURAR QUE TODAS LAS LOCALIZACIONES ESTÁN PRESENTES
        // Si falta alguna localización, agregar registros dummy
        const localizacionesPresentes = new Set(medicionesArray.map(m => m.localizacionid));
        const localizacionesFaltantes = todasLasLocalizaciones.filter(
          (loc: any) => !localizacionesPresentes.has(loc.localizacionid)
        );

        // Agregar registros dummy para localizaciones faltantes
        localizacionesFaltantes.forEach((loc: any) => {
          medicionesArray.push({
            medicionid: null,
            fecha: null,
            medicion: null,
            metricaid: loc.metricaid,
            sensorid: loc.sensorid,
            tipoid: loc.tipoid,
            localizacionid: loc.localizacionid,
            localizacion: {
              localizacionid: loc.localizacionid,
              metricaid: loc.metricaid,
              sensorid: loc.sensorid,
              tipoid: loc.tipoid,
              metrica: {
                metricaid: loc.metricaid,
                metrica: loc.metrica || `Métrica ${loc.metricaid}`,
                unidad: loc.unidad
              },
              sensor: {
                sensorid: loc.sensorid,
                sensor: loc.sensor || `Sensor ${loc.sensorid}`,
                tipoid: loc.tipoid,
                tipo: {
                  tipoid: loc.tipoid,
                  tipo: loc.tipo || 'Sensor'
                }
              }
            }
          });
        });

        // DEBUG: Ver cuántos sensores únicos se cargaron
        const sensoresUnicos = new Set(medicionesArray.map(m => `${m.sensorid}-${m.tipoid}`)).size;
        const localizacionesUnicas = new Set(medicionesArray.map(m => m.localizacion?.metricaid + '-' + m.sensorid)).size;
        
        console.log(
          '[MedicionesDashboard] Mediciones detalladas cargadas:',
          medicionesArray.length,
          'puntos,',
          sensoresUnicos,
          'sensores únicos,',
          localizacionesUnicas,
          'localizaciones únicas'
        );
        
        console.log('[MedicionesDashboard] 📊 Mapa de sensores:', {
          sensores: Array.from(new Set(medicionesArray.map(m => ({
            sensorid: m.sensorid,
            tipoid: m.tipoid,
            sensor_nombre: m.localizacion?.sensor?.sensor,
            tipo_nombre: m.localizacion?.sensor?.tipo?.tipo,
            metricaid: m.metricaid,
            metrica: m.localizacion?.metrica?.metrica
          }))).values()).map(s => `${s.tipo_nombre}-${s.sensor_nombre}(M:${s.metrica})`)
        });
        
        setMediciones(medicionesArray);
      } catch (err: any) {
        console.error('[MedicionesDashboard] Error cargando mediciones:', err);
        showError('Error', 'Error al cargar mediciones detalladas');
      } finally {
        setLoading(false);
      }
    };
    loadMediciones();
  }, [selectedLocalizacion, dateRange, showError]);

  // Sincronizar pendingDateRange con dateRange cuando cambia selectedLocalizacion
  useEffect(() => {
    setPendingDateRange(dateRange);
    setYAxisDomain({ min: null, max: null }); // Reset del ajuste del eje Y
  }, [selectedLocalizacion]);

  // Preparar datos para el gráfico de evolución por sensor/tipo de sensor (filtrados por métrica)
  const chartData = useMemo(() => {
    if (mediciones.length === 0) return [];

    // Si no hay métrica seleccionada, usar todas las mediciones (para compatibilidad)
    let medicionesAGraficar = mediciones;
    
    if (selectedMetricId) {
      // Filtrar mediciones por métrica seleccionada
      medicionesAGraficar = mediciones.filter((m: any) => {
        const metricId = m.metricaid || m.localizacion?.metricaid || 0;
        return metricId === selectedMetricId;
      });
    }

    if (medicionesAGraficar.length === 0) return [];

    // Crear agrupación por tiempo Y por sensor
    // Estructura: { timeKey: { sensorLabel: { values: [], count: number }, __metadata__: { fecha, fechaObj } } }
    const grouped: { [timeKey: string]: any } = {};

    medicionesAGraficar.forEach((m: any) => {
      const date = new Date(m.fecha);
      
      const start = new Date(dateRange.start).getTime();
      const end = new Date(dateRange.end).getTime();
      const spanHours = (end - start) / (1000 * 60 * 60);
      const spanDays = spanHours / 24;
      
      let timeKey: string;
      let fechaLabel: string;
      let fechaObj: Date;
      
      if (spanDays >= 2) {
        fechaObj = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        timeKey = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
        fechaLabel = timeKey;
      } else if (spanHours >= 48) {
        fechaObj = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), 0, 0);
        timeKey = fechaObj.toISOString();
        fechaLabel = fechaObj.toLocaleDateString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
      } else {
        const roundedMin = Math.floor(date.getMinutes() / 15) * 15;
        fechaObj = new Date(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), roundedMin, 0);
        timeKey = fechaObj.toISOString();
        fechaLabel = fechaObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      }
      
      const label = getSeriesLabel(m);
      
      if (!grouped[timeKey]) {
        grouped[timeKey] = {
          __metadata__: { fecha: fechaLabel, fechaObj }
        };
      }

      if (!grouped[timeKey][label]) {
        grouped[timeKey][label] = { values: [], count: 0 };
      }
      
      const valor = m.medicion || m.valor;
      if (valor != null && !isNaN(valor)) {
        grouped[timeKey][label].values.push(parseFloat(valor));
        grouped[timeKey][label].count += 1;
      }
    });

    // Convertir a formato para Recharts: una clave por sensor
    const result = Object.entries(grouped)
      .map(([timeKey, sensorData]) => {
        const entry: any = { 
          fecha: sensorData.__metadata__.fecha,
          fechaOriginal: sensorData.__metadata__.fechaObj
        };
        
        // Por cada sensor en este intervalo de tiempo, calcular el promedio
        Object.entries(sensorData).forEach(([sensorLabel, data]: any) => {
          if (sensorLabel !== '__metadata__') {
            // Calcular promedio de valores para este sensor en este intervalo
            const avg = data.values.reduce((a: number, b: number) => a + b, 0) / data.count;
            entry[sensorLabel] = avg;
          }
        });
        
        return entry;
      })
      .sort((a: any, b: any) => a.fechaOriginal.getTime() - b.fechaOriginal.getTime())
      .map((item: any) => {
        const { fechaOriginal, ...rest } = item;
        return rest;
      });

    return result;
  }, [mediciones, selectedMetricId, getSeriesLabel, dateRange]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900 p-6">
      <div className="max-w-[95vw] mx-auto">
        {/* Header - Similar a STATUS DE NODOS pero adaptado */}
        <div className="bg-gray-200 dark:bg-neutral-700 rounded-lg p-3 mb-6 relative">
          {/* Botón X para cancelar selección - Extremo superior derecho */}
          {selectedLocalizacion && (
            <button
              onClick={() => {
                setSelectedLocalizacion(null);
                setLocalizacionSearchTerm('');
                setSelectedMetricId(null);
              }}
              className="absolute top-2 right-2 h-6 w-6 p-0 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-mono flex items-center justify-center transition-colors"
              title="Cancelar selección"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
          
          <div className="flex items-center justify-center gap-4 flex-nowrap overflow-x-auto dashboard-scrollbar-blue w-full pb-2">
            {/* Selector de Localización (reemplaza Nodo) */}
            <div className="flex flex-col items-center flex-shrink-0" ref={localizacionDropdownRef}>
              <label className="text-xs font-bold text-blue-500 font-mono mb-1 whitespace-nowrap uppercase">
                Localización:
              </label>
              <div className="relative">
                <button
                  onClick={() => setIsLocalizacionDropdownOpen(!isLocalizacionDropdownOpen)}
                  className="h-8 min-w-[150px] px-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs flex items-center justify-between"
                >
                  <span className={selectedLocalizacion ? 'text-gray-800 dark:text-white' : 'text-gray-500 dark:text-neutral-400'}>
                    {selectedLocalizacion?.localizacion || 'Selecciona Localización'}
                  </span>
                  <svg className={`w-4 h-4 transition-transform ${isLocalizacionDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isLocalizacionDropdownOpen && localizacionDropdownPosition && (
                  <div 
                    className="fixed z-[9999] bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg shadow-lg max-h-60 overflow-hidden"
                    style={{
                      top: `${localizacionDropdownPosition.top}px`,
                      left: `${localizacionDropdownPosition.left}px`,
                      width: `${localizacionDropdownPosition.width}px`
                    }}
                  >
                    <div className="p-2 border-b border-gray-300 dark:border-neutral-700">
                      <input
                        type="text"
                        value={localizacionSearchTerm}
                        onChange={(e) => setLocalizacionSearchTerm(e.target.value)}
                        placeholder="Buscar..."
                        className="w-full px-2 py-1 bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-800 dark:text-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto dashboard-scrollbar-blue">
                      {filteredLocalizaciones.length > 0 ? (
                        filteredLocalizaciones.map((localizacion: any) => (
                          <button
                            key={localizacion.localizacionid}
                            onClick={() => {
                              setSelectedLocalizacion(localizacion);
                              setIsLocalizacionDropdownOpen(false);
                              setLocalizacionSearchTerm('');
                            }}
                            className={`w-full text-left px-3 py-2 text-sm transition-colors font-mono tracking-wider ${
                              selectedLocalizacion?.localizacionid === localizacion.localizacionid
                                ? 'bg-blue-500 text-white'
                                : 'text-gray-700 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-800'
                            }`}
                          >
                            {localizacion.localizacion}
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-sm text-gray-500 dark:text-neutral-400 font-mono">
                          No se encontraron resultados
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Separador visual */}
            <div className="w-px h-16 bg-gray-400 dark:bg-neutral-600 self-stretch"></div>

            {/* Botón Localización en Mapa */}
            <div className="flex flex-col items-center flex-shrink-0">
              <label className="text-xs font-bold text-blue-500 font-mono mb-1 whitespace-nowrap uppercase">
                Mapa:
              </label>
              <button
                onClick={() => setShowMapModal(true)}
                disabled={localizaciones.length === 0}
                className="h-8 px-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded font-mono text-xs transition-colors whitespace-nowrap"
                title="Seleccionar localización en el mapa"
              >
                Localización en Mapa
              </button>
            </div>

            {/* Separador visual */}
            <div className="w-px h-16 bg-gray-400 dark:bg-neutral-600 self-stretch"></div>

            {/* Intervalo de Fechas */}
            <div className="flex flex-col items-center flex-shrink-0">
              <label className="text-xs font-bold text-blue-500 font-mono mb-1 whitespace-nowrap uppercase">
                Intervalo de Fechas:
              </label>
              <div className="flex items-center gap-2">
                <div className="flex flex-col items-center">
                  <input
                    type="date"
                    value={pendingDateRange.start}
                    onChange={(e) => setPendingDateRange({ ...pendingDateRange, start: e.target.value })}
                    disabled={!selectedLocalizacion}
                    className="h-8 w-36 pl-6 pr-0 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      colorScheme: 'dark',
                      WebkitAppearance: 'none'
                    }}
                  />
                  <span className="text-[10px] text-gray-400 font-mono mt-0.5 uppercase">Inicio</span>
                </div>
                <div className="flex flex-col items-center">
                  <input
                    type="date"
                    value={pendingDateRange.end}
                    onChange={(e) => setPendingDateRange({ ...pendingDateRange, end: e.target.value })}
                    min={pendingDateRange.start || undefined}
                    disabled={!selectedLocalizacion}
                    className="h-8 w-36 pl-6 pr-0 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      colorScheme: 'dark',
                      WebkitAppearance: 'none'
                    }}
                  />
                  <span className="text-[10px] text-gray-400 font-mono mt-0.5 uppercase">Fin</span>
                </div>
              </div>
            </div>

            {/* Botón Aplicar - aparece cuando hay cambios en las fechas */}
            {(pendingDateRange.start !== dateRange.start || pendingDateRange.end !== dateRange.end) ? (
              <div className="flex flex-col items-center flex-shrink-0">
                <label className="text-xs font-bold text-blue-500 font-mono mb-1 whitespace-nowrap invisible">Aplicar:</label>
                <button
                  onClick={() => {
                    // Validar fechas antes de aplicar
                    if (pendingDateRange.start && pendingDateRange.end && new Date(pendingDateRange.start) > new Date(pendingDateRange.end)) {
                      showWarning(
                        'Fecha inválida',
                        'La fecha inicial no puede ser mayor que la fecha final. Por favor, seleccione fechas válidas.'
                      );
                      return;
                    }

                    // Aplicar cambios
                    flushSync(() => {
                      setDateRange(pendingDateRange);
                    });
                  }}
                  disabled={loading}
                  className="h-8 px-3 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded font-mono text-xs transition-colors whitespace-nowrap"
                >
                  Aplicar
                </button>
              </div>
            ) : null}

            {/* Separador visual */}
            {selectedLocalizacion && (
              <div className="w-px h-16 bg-gray-400 dark:bg-neutral-600 self-stretch"></div>
            )}

            {/* Ajuste del eje Y */}
            {selectedLocalizacion && (
              <div className="flex flex-col items-center flex-shrink-0">
                <label className="text-xs font-bold text-blue-500 font-mono mb-1 whitespace-nowrap uppercase">
                  Ajuste Eje Y:
                </label>
                <div className="flex items-center gap-2 h-8">
                  <input
                    type="number"
                    step="0.1"
                    min="-999999"
                    max="999999"
                    value={yAxisDomain.min !== null && !isNaN(yAxisDomain.min) ? yAxisDomain.min.toString() : ''}
                    onChange={(e) => {
                      const inputValue = e.target.value
                      if (inputValue === '') {
                        setYAxisDomain(prev => ({ ...prev, min: null }))
                        return
                      }
                      const numValue = Number(inputValue)
                      if (!isNaN(numValue) && isFinite(numValue) && numValue >= -999999 && numValue <= 999999) {
                        setYAxisDomain(prev => ({ ...prev, min: numValue }))
                      }
                    }}
                    placeholder="Min"
                    className="h-8 w-16 px-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-xs font-mono"
                  />
                  <span className="text-gray-600 dark:text-neutral-400 text-xs">-</span>
                  <input
                    type="number"
                    step="0.1"
                    min="-999999"
                    max="999999"
                    value={yAxisDomain.max !== null && !isNaN(yAxisDomain.max) ? yAxisDomain.max.toString() : ''}
                    onChange={(e) => {
                      const inputValue = e.target.value
                      if (inputValue === '') {
                        setYAxisDomain(prev => ({ ...prev, max: null }))
                        return
                      }
                      const numValue = Number(inputValue)
                      if (!isNaN(numValue) && isFinite(numValue) && numValue >= -999999 && numValue <= 999999) {
                        setYAxisDomain(prev => ({ ...prev, max: numValue }))
                      }
                    }}
                    placeholder="Max"
                    className="h-8 w-16 px-2 bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-xs font-mono"
                  />
                  <button
                    onClick={() => setYAxisDomain({ min: null, max: null })}
                    className="h-8 px-2 bg-gray-500 hover:bg-gray-600 text-white rounded text-xs font-mono"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}

            {/* Separador visual */}
            {selectedLocalizacion && availableMetrics.length > 0 && (
              <div className="w-px h-16 bg-gray-400 dark:bg-neutral-600 self-stretch"></div>
            )}

            {/* Selector de Métricas */}
            {selectedLocalizacion && availableMetrics.length > 0 && (
              <div className="flex flex-col items-center flex-shrink-0">
                <label className="text-xs font-bold text-blue-500 font-mono mb-1 whitespace-nowrap uppercase">
                  Métricas:
                </label>
                <div className="flex flex-wrap gap-2 items-center justify-center">
                  {availableMetrics.map(metric => (
                    <button
                      key={metric.id}
                      onClick={() => setSelectedMetricId(metric.id)}
                      className={`px-2 py-1 rounded text-xs font-mono font-bold transition-all whitespace-nowrap ${
                        selectedMetricId === metric.id
                          ? 'bg-blue-500 text-white shadow-md transform scale-105'
                          : 'bg-gray-300 dark:bg-neutral-600 text-gray-700 dark:text-neutral-300 hover:bg-gray-400 dark:hover:bg-neutral-500'
                      }`}
                    >
                      {metric.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}

        {selectedLocalizacion && !loading && (
          <>
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-md p-6 mb-6">
              <style dangerouslySetInnerHTML={{
                __html: `
                  .recharts-tooltip-wrapper,
                  .recharts-legend-wrapper {
                    font-family: 'JetBrains Mono', monospace !important;
                  }
                `
              }} />
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2} />
                  <XAxis 
                    dataKey="fecha" 
                    tick={{ fontSize: 10, fill: '#888' }}
                    tickLine={{ stroke: '#888' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: '#888' }}
                    tickLine={{ stroke: '#888' }}
                    domain={(() => {
                      // Si hay valores min/max definidos, usarlos estrictamente como array fijo
                      if (yAxisDomain.min !== null && !isNaN(yAxisDomain.min) && yAxisDomain.max !== null && !isNaN(yAxisDomain.max)) {
                        return [yAxisDomain.min, yAxisDomain.max]
                      }
                      if (yAxisDomain.min !== null && !isNaN(yAxisDomain.min)) {
                        // Si solo hay min, calcular max desde los datos
                        const allValues: number[] = []
                        chartData.forEach(point => {
                          Object.keys(point).forEach(key => {
                            if (key !== 'fecha' && typeof point[key] === 'number' && !isNaN(point[key])) {
                              allValues.push(point[key])
                            }
                          })
                        })
                        const dataMax = allValues.length > 0 ? Math.max(...allValues) : yAxisDomain.min + 10
                        return [yAxisDomain.min, dataMax]
                      }
                      if (yAxisDomain.max !== null && !isNaN(yAxisDomain.max)) {
                        // Si solo hay max, calcular min desde los datos
                        const allValues: number[] = []
                        chartData.forEach(point => {
                          Object.keys(point).forEach(key => {
                            if (key !== 'fecha' && typeof point[key] === 'number' && !isNaN(point[key])) {
                              allValues.push(point[key])
                            }
                          })
                        })
                        const dataMin = allValues.length > 0 ? Math.min(...allValues) : yAxisDomain.max - 10
                        return [dataMin, yAxisDomain.max]
                      }
                      // Si no hay límites, usar auto
                      return ['auto', 'auto']
                    })()}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1f2937', 
                      border: 'none', 
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '12px'
                    }}
                    itemStyle={{ padding: '2px 0' }}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
                  />
                  {(() => {
                    if (chartData.length === 0) return null;
                    
                    const allSeriesKeys = Array.from(
                      new Set(
                        chartData.flatMap(item => 
                          Object.keys(item).filter(key => key !== 'fecha' && key !== 'fechaOriginal')
                        )
                      )
                    ).sort();

                    return allSeriesKeys.map((label, index) => (
                      <Line
                        key={label}
                        type="monotone"
                        dataKey={label}
                        stroke={COLORS[index % COLORS.length]}
                        strokeWidth={2}
                        dot={{ r: 2 }}
                        activeDot={{ r: 4 }}
                        name={label}
                        connectNulls={true}
                      />
                    ));
                  })()}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {!selectedLocalizacion && !loading && (
          <div className="flex items-center justify-center py-12 text-gray-500 dark:text-neutral-400">
            <p>Selecciona una localización para ver las mediciones.</p>
          </div>
        )}

        {/* Modal del Mapa con Leaflet */}
        {showMapModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-full max-w-5xl flex flex-col">
              {/* Header del Modal */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-neutral-700">
                <h2 className="text-lg font-bold text-blue-500 font-mono uppercase">
                  Seleccionar Localización en el Mapa
                </h2>
                <button
                  onClick={() => setShowMapModal(false)}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors p-1"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Contenido del Modal - Mapa */}
              <div className="p-2">
                <div 
                  className="overflow-hidden"
                  style={{ height: '500px' }}
                >
                  <style dangerouslySetInnerHTML={{
                    __html: `
                      .mediciones-map-container > div {
                        height: 100% !important;
                      }
                      .mediciones-map-container > div > div {
                        height: 100% !important;
                      }
                    `
                  }} />
                  <div className="mediciones-map-container h-full">
                    <InteractiveLocalizacionMap
                      localizaciones={localizaciones}
                      selectedLocalizacion={selectedLocalizacion}
                      onLocalizacionSelect={(localizacion) => {
                        setSelectedLocalizacion(localizacion);
                        setShowMapModal(false);
                        setLocalizacionSearchTerm('');
                      }}
                      loading={loading}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default MedicionesDashboard;
