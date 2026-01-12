/**
 * AlertStatusDashboard - Dashboard para Status de Alertas
 * Muestra un mapa con nodos que tienen alertas activas y permite analizar las alertas por métrica
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { JoySenseService } from '../../services/backend-api';
import { NodeData } from '../../types/NodeData';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { InteractiveMap } from './InteractiveMap';

interface AlertStatusDashboardProps {}

interface AlertaData {
  alertaid: string;
  reglaid: number;
  localizacionid: number;
  medicionid: number;
  fecha: string;
  valor: number;
  regla?: {
    nombre: string;
    criticidad?: {
      criticidad: string;
    };
  };
  localizacion?: {
    nodoid: number;
    metricaid: number;
    metrica?: {
      metrica: string;
      unidad: string;
    };
  };
  umbral?: {
    minimo: number;
    maximo: number;
    estandar?: number;
  };
}

interface MedicionConAlerta {
  medicionid: number;
  fecha: string;
  medicion: number;
  metricaid: number;
  metrica?: string;
  unidad?: string;
  tieneAlerta: boolean;
  fechaAlerta?: string;
  valorAlerta?: number;
}

export function AlertStatusDashboard({}: AlertStatusDashboardProps) {
  const { t } = useLanguage();
  const { showError } = useToast();
  
  const [nodesWithAlerts, setNodesWithAlerts] = useState<NodeData[]>([]);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [alertas, setAlertas] = useState<AlertaData[]>([]);
  const [mediciones, setMediciones] = useState<MedicionConAlerta[]>([]);
  const [metricas, setMetricas] = useState<any[]>([]);
  const [showDetailedAnalysis, setShowDetailedAnalysis] = useState(false);
  const [selectedMetrica, setSelectedMetrica] = useState<number | null>(null);

  // Cargar nodos con alertas activas
  useEffect(() => {
    const loadNodesWithAlerts = async () => {
      try {
        setLoading(true);
        
        // Obtener todas las alertas activas (sin fecha de fin o status activo)
        const alertasData = await JoySenseService.getAlertasRegla({
          pageSize: 1000
        });
        
        const alertasArray = Array.isArray(alertasData) ? alertasData : (alertasData as any)?.data || [];
        
        // Obtener nodos únicos que tienen alertas
        const nodoIds = new Set<number>();
        alertasArray.forEach((alerta: any) => {
          if (alerta.localizacion?.nodoid) {
            nodoIds.add(alerta.localizacion.nodoid);
          }
        });
        
        // Obtener todos los nodos y filtrar solo los que tienen alertas
        const allNodes = await JoySenseService.getNodosConLocalizacion(1000);
        const nodesWithAlertsData = (allNodes || []).filter((node: NodeData) => 
          nodoIds.has(node.nodoid)
        );
        
        setNodesWithAlerts(nodesWithAlertsData);
        setAlertas(alertasArray);
      } catch (err: any) {
        console.error('Error cargando nodos con alertas:', err);
        showError('Error', 'Error al cargar nodos con alertas');
      } finally {
        setLoading(false);
      }
    };
    
    loadNodesWithAlerts();
  }, [showError]);

  // Cargar datos cuando se selecciona un nodo
  useEffect(() => {
    if (!selectedNode) {
      setMediciones([]);
      setMetricas([]);
      return;
    }

    const loadNodeData = async () => {
      try {
        setLoading(true);
        
        // Obtener alertas del nodo seleccionado
        const alertasDelNodo = alertas.filter((a: any) => 
          a.localizacion?.nodoid === selectedNode.nodoid
        );
        
        // Obtener localizaciones del nodo
        const localizaciones = await JoySenseService.getLocalizacionesByNodo(selectedNode.nodoid);
        const localizacionIds = (localizaciones || []).map((l: any) => l.localizacionid);
        
        // Obtener mediciones del nodo (últimos 30 días)
        const endDate = new Date();
        const startDate = new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        const medicionesData = await JoySenseService.getMediciones({
          nodoid: selectedNode.nodoid,
          startDate: startDate.toISOString().split('T')[0] + ' 00:00:00',
          endDate: endDate.toISOString().split('T')[0] + ' 23:59:59',
          limit: 1000
        });
        
        // Asegurarse de que medicionesData es un array
        const medicionesArray = Array.isArray(medicionesData) 
          ? medicionesData 
          : (medicionesData as any)?.data || [];
        
        // Combinar mediciones con información de alertas
        const medicionesConAlertas: MedicionConAlerta[] = medicionesArray.map((m: any) => {
          // Buscar si esta medición tiene una alerta asociada
          const alertaAsociada = alertasDelNodo.find((a: any) => a.medicionid === m.medicionid);
          
          return {
            medicionid: m.medicionid,
            fecha: m.fecha,
            medicion: m.medicion,
            metricaid: m.metricaid || m.localizacion?.metricaid || 0,
            metrica: m.localizacion?.metrica?.metrica || '',
            unidad: m.localizacion?.metrica?.unidad || '',
            tieneAlerta: !!alertaAsociada,
            fechaAlerta: alertaAsociada?.fecha,
            valorAlerta: alertaAsociada?.valor
          };
        });
        
        setMediciones(medicionesConAlertas);
        
        // Obtener métricas únicas del nodo
        const metricasUnicas = new Map<number, any>();
        medicionesConAlertas.forEach(m => {
          if (m.metricaid && !metricasUnicas.has(m.metricaid)) {
            metricasUnicas.set(m.metricaid, {
              metricaid: m.metricaid,
              metrica: m.metrica,
              unidad: m.unidad
            });
          }
        });
        
        setMetricas(Array.from(metricasUnicas.values()));
      } catch (err: any) {
        console.error('Error cargando datos del nodo:', err);
        showError('Error', 'Error al cargar datos del nodo');
      } finally {
        setLoading(false);
      }
    };

    loadNodeData();
  }, [selectedNode, alertas, showError]);

  // Preparar datos para los minigráficos
  const prepareChartData = useCallback((metricaid: number) => {
    const medicionesMetrica = mediciones.filter(m => m.metricaid === metricaid);
    
    // Ordenar por fecha
    const sorted = [...medicionesMetrica].sort((a, b) => 
      new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    );
    
    // Obtener todas las alertas para esta métrica
    const alertasMetrica = alertas.filter((a: any) => 
      a.localizacion?.nodoid === selectedNode?.nodoid &&
      a.localizacion?.metricaid === metricaid
    );
    const alertasOrdenadas = alertasMetrica.sort((a, b) => 
      new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
    );
    const ultimaAlerta = alertasOrdenadas.length > 0 ? alertasOrdenadas[0] : null;
    
    // Crear un mapa de fechas de alerta para referencia rápida
    const alertasPorFecha = new Map<string, any>();
    alertasOrdenadas.forEach(a => {
      const fechaKey = new Date(a.fecha).toISOString().split('T')[0];
      if (!alertasPorFecha.has(fechaKey)) {
        alertasPorFecha.set(fechaKey, a);
      }
    });
    
    return sorted.map(m => {
      const fechaKey = new Date(m.fecha).toISOString().split('T')[0];
      const alertaEnEstaFecha = alertasPorFecha.get(fechaKey);
      
      return {
        fecha: new Date(m.fecha).toLocaleString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }),
        fechaOriginal: new Date(m.fecha),
        medicion: m.medicion,
        tieneAlerta: m.tieneAlerta || !!alertaEnEstaFecha,
        ultimaAlertaFecha: ultimaAlerta ? new Date(ultimaAlerta.fecha).toLocaleString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }) : null,
        ultimaAlertaValor: ultimaAlerta?.valor || null,
        valorAlertaActual: alertaEnEstaFecha?.valor || null
      };
    });
  }, [mediciones, alertas, selectedNode]);

  return (
    <div className="h-screen bg-gray-50 dark:bg-neutral-900 p-6 flex flex-col overflow-hidden">
      <div className="max-w-7xl mx-auto w-full flex flex-col flex-1 min-h-0">
        <h1 className="text-2xl font-bold text-blue-500 font-mono mb-6 uppercase flex-shrink-0">
          STATUS DE ALERTAS
        </h1>

        {/* Mapa con nodos que tienen alertas */}
        <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-lg mb-6 overflow-hidden flex-1 min-h-0">
          <div style={{ height: '100%', width: '100%' }}>
            <InteractiveMap
              nodes={nodesWithAlerts}
              selectedNode={selectedNode}
              onNodeSelect={setSelectedNode}
              loading={loading}
              nodeMediciones={{}}
              nodesWithAlerts={nodesWithAlerts.map(n => n.nodoid)}
            />
          </div>
        </div>

        {/* Minigráficos por métrica cuando hay un nodo seleccionado */}
        {selectedNode && !loading && metricas.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {metricas.map((metrica) => {
              const chartData = prepareChartData(metrica.metricaid);
              const ultimaAlerta = alertas
                .filter((a: any) => 
                  a.localizacion?.nodoid === selectedNode.nodoid &&
                  a.localizacion?.metricaid === metrica.metricaid
                )
                .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())[0];

              return (
                <div
                  key={metrica.metricaid}
                  className="bg-white dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 rounded-lg p-6 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => {
                    setSelectedMetrica(metrica.metricaid);
                    setShowDetailedAnalysis(true);
                  }}
                >
                  <h3 className="text-lg font-bold text-blue-500 font-mono mb-4 uppercase">
                    {metrica.metrica}
                  </h3>
                  
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={chartData}>
                        <XAxis
                          dataKey="fecha"
                          tick={{ fontSize: 10 }}
                          interval="preserveStartEnd"
                        />
                        <YAxis hide />
                        <Tooltip 
                          formatter={(value: any, name: string) => {
                            if (name === 'medicion') {
                              return [`${value} ${metrica.unidad}`, 'Medición'];
                            }
                            if (name === 'alerta') {
                              return [`${value} ${metrica.unidad}`, 'Alerta'];
                            }
                            return [value, name];
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="medicion"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={false}
                          name="Medición"
                        />
                        {chartData.some(d => d.valorAlertaActual) && (
                          <Line
                            type="monotone"
                            dataKey="valorAlertaActual"
                            stroke="#ef4444"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={{ fill: '#ef4444', r: 4 }}
                            name="Alerta"
                          />
                        )}
                        {ultimaAlerta && (
                          <ReferenceLine
                            x={new Date(ultimaAlerta.fecha).toLocaleString('es-ES', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                            stroke="#ef4444"
                            strokeWidth={1}
                            strokeDasharray="3 3"
                            label={{ value: "Última Alerta", position: "top", fill: "#ef4444", fontSize: 10 }}
                          />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-32 text-gray-400">
                      Sin datos
                    </div>
                  )}
                  
                  {ultimaAlerta && (
                    <div className="mt-4 text-sm text-red-500 font-mono">
                      Última alerta: {new Date(ultimaAlerta.fecha).toLocaleString('es-ES')}
                      <br />
                      Valor: {ultimaAlerta.valor} {metrica.unidad}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Modal de análisis detallado */}
        {showDetailedAnalysis && selectedMetrica && selectedNode && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-neutral-900 rounded-xl border border-gray-300 dark:border-neutral-700 w-full max-w-7xl max-h-[95vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-300 dark:border-neutral-700 flex justify-between items-center">
                <h2 className="text-xl font-bold text-blue-500 font-mono uppercase">
                  Análisis Detallado - {metricas.find(m => m.metricaid === selectedMetrica)?.metrica}
                </h2>
                <button
                  onClick={() => {
                    setShowDetailedAnalysis(false);
                    setSelectedMetrica(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <ResponsiveContainer width="100%" height={500}>
                  <LineChart data={prepareChartData(selectedMetrica)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="fecha"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="medicion"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      name="Medición"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AlertStatusDashboard;

