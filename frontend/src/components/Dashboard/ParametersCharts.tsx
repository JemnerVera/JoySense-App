import React, { useEffect, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface SeparateChartsProps {
  mediciones: any[];
  loading: boolean;
  selectedMetrica?: number | null;
  metricas?: any[];
  tipos?: any[];
  startDate?: string;
  endDate?: string;
}

const SeparateCharts: React.FC<SeparateChartsProps> = React.memo(({ 
  mediciones, 
  loading, 
  selectedMetrica,
  metricas = [],
  tipos = [],
  startDate,
  endDate
}) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  // Crear gráfico
  useEffect(() => {
    if (!chartRef.current || mediciones.length === 0) return;

    // Destruir gráfico anterior si existe
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Preparar datos para el gráfico
    const datosGrafico = prepararDatosGrafico(mediciones, selectedMetrica || null, tipos);
    
    console.log('🔍 SeparateCharts: Datos del gráfico:', {
      mediciones: mediciones.length,
      selectedMetrica: selectedMetrica,
      medicionesFiltradas: mediciones.filter(m => m.metricaid === selectedMetrica).length,
      labels: datosGrafico.labels.length,
      datasets: datosGrafico.datasets.length,
      fechasUnicas: Array.from(new Set(mediciones.filter(m => m.metricaid === selectedMetrica).map(m => m.fecha))).length,
      primeraMedicion: mediciones[0],
      metricasDisponibles: mediciones.map(m => m.metricaid).filter((v, i, a) => a.indexOf(v) === i)
    });

    // Crear nuevo gráfico
    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    const metricaSeleccionada = metricas.find(m => m.metricaid === selectedMetrica);
    const titulo = metricaSeleccionada ? `${metricaSeleccionada.metrica} por Tipo` : 'Mediciones por Fecha';

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: datosGrafico.labels,
        datasets: datosGrafico.datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: '#ffffff',
              usePointStyle: true,
              pointStyle: 'circle'
            }
          }
        },
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: 'Fecha y Hora',
              color: '#ffffff'
            },
            ticks: {
              color: '#ffffff',
              maxTicksLimit: 15,
              maxRotation: 45,
              minRotation: 0
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          },
          y: {
            display: true,
            title: {
              display: true,
              text: metricaSeleccionada ? metricaSeleccionada.unidad || 'Valor' : 'Valor',
              color: '#ffffff'
            },
            ticks: {
              color: '#ffffff'
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)'
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        },
        elements: {
          line: {
            tension: 0.1,
            borderWidth: 2
          },
          point: {
            radius: 3,
            hoverRadius: 5,
            borderWidth: 2
          }
        }
      }
    });

    // Cleanup
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [mediciones, selectedMetrica, metricas, tipos]);

  // Función para crear rango completo de fechas
  const crearRangoFechas = (startDate: string, endDate: string) => {
    const fechas = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Agregar un día extra para incluir la fecha final
    end.setDate(end.getDate() + 1);
    
    for (let fecha = new Date(start); fecha < end; fecha.setDate(fecha.getDate() + 1)) {
      fechas.push(new Date(fecha).toISOString().split('T')[0]);
    }
    
    return fechas;
  };

  // Función para preparar datos del gráfico
  const prepararDatosGrafico = (mediciones: any[], selectedMetrica: number | null, tipos: any[]) => {
    if (mediciones.length === 0) {
      return { labels: [], datasets: [] };
    }

    // Si no hay métrica seleccionada, usar la primera disponible
    let metricaAUsar = selectedMetrica;
    if (!metricaAUsar && mediciones.length > 0) {
      const metricasDisponibles = Array.from(new Set(mediciones.map(m => m.metricaid)));
      metricaAUsar = metricasDisponibles[0];
    }

    // Filtrar mediciones por métrica seleccionada
    const medicionesFiltradas = mediciones.filter(m => m.metricaid === metricaAUsar);

    // Ordenar mediciones por fecha
    const medicionesOrdenadas = medicionesFiltradas.sort((a, b) => 
      new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
    );

    // Crear labels usando TODAS las mediciones individuales (con fecha y hora)
    const labels = medicionesOrdenadas.map(medicion => {
      const fecha = new Date(medicion.fecha);
      return fecha.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    });

    // Agrupar mediciones por tipo
    const medicionesPorTipo: { [tipo: string]: any[] } = {};
    
    medicionesOrdenadas.forEach(medicion => {
      const tipo = tipos.find(t => t.tipoid === medicion.tipoid)?.tipo || `Tipo ${medicion.tipoid}`;
      
      if (!medicionesPorTipo[tipo]) {
        medicionesPorTipo[tipo] = [];
      }
      medicionesPorTipo[tipo].push(medicion);
    });

    // Crear datasets (tipos)
    const datasets = Object.keys(medicionesPorTipo).map((tipo, index) => {
      const color = generarColor(index);
      const medicionesTipo = medicionesPorTipo[tipo];
      
      // Crear array de datos para este tipo, alineado con TODAS las mediciones
      const data = medicionesOrdenadas.map(medicion => {
        const medicionTipo = medicionesTipo.find(m => 
          m.fecha === medicion.fecha && 
          m.tipoid === medicion.tipoid
        );
        return medicionTipo ? medicionTipo.medicion : null;
      });

      return {
        label: tipo,
        data: data,
        borderColor: color,
        backgroundColor: color + '20',
        fill: false,
        tension: 0.1,
        pointRadius: 3,
        pointHoverRadius: 5,
        spanGaps: true // Conectar puntos incluso con gaps
      };
    });

    return { labels, datasets };
  };

  // Función para generar colores
  const generarColor = (index: number) => {
    const colores = [
      '#3B82F6', // blue
      '#10B981', // emerald
      '#F59E0B', // amber
      '#EF4444', // red
      '#8B5CF6', // violet
      '#06B6D4', // cyan
      '#84CC16', // lime
      '#22c55e', // green
      '#EC4899', // pink
      '#6B7280'  // gray
    ];
    return colores[index % colores.length];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-400">Cargando gráfico...</p>
        </div>
      </div>
    );
  }

  if (mediciones.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-white mb-2">No hay datos para mostrar</h3>
          <p className="text-gray-400">Selecciona filtros para ver las mediciones</p>
        </div>
      </div>
    );
  }

  // Filtrar mediciones por métrica seleccionada para estadísticas
  const medicionesFiltradas = selectedMetrica 
    ? mediciones.filter(m => m.metricaid === selectedMetrica)
    : mediciones;

  const metricaSeleccionada = metricas.find(m => m.metricaid === selectedMetrica);

  return (
    <div className="w-full">
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="h-96">
          <canvas ref={chartRef}></canvas>
        </div>
      </div>
    </div>
  );
});

export default SeparateCharts;
