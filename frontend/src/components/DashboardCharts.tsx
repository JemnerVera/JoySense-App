import React, { useEffect, useRef, useMemo } from 'react';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

interface SeparateChartsProps {
  mediciones: any[];
  loading: boolean;
}

const SeparateCharts: React.FC<SeparateChartsProps> = ({ mediciones, loading }) => {
  const humedadChartRef = useRef<HTMLCanvasElement>(null);
  const temperaturaChartRef = useRef<HTMLCanvasElement>(null);
  const electroconductividadChartRef = useRef<HTMLCanvasElement>(null);

  const humedadChartInstance = useRef<Chart | null>(null);
  const temperaturaChartInstance = useRef<Chart | null>(null);
  const electroconductividadChartInstance = useRef<Chart | null>(null);

  // Preparar y filtrar datos para los gráficos
  const chartData = useMemo(() => {
    if (mediciones.length === 0) return { humedadData: [], temperaturaData: [], electroconductividadData: [] };

    const data = mediciones.slice(0, 50).reverse(); // Últimas 50 mediciones, ordenadas por fecha

    // Separar datos por tipo de sensor (mejorada y más robusta)
    const humedadData = data.filter(m => {
      // Priorizar metricaid si existe
      if (m.metricaid === 1) return true;
      // Fallback a nombre de métrica
      const metricaNombre = m.localizacion?.metrica?.metrica?.toLowerCase() || '';
      return metricaNombre.includes('humedad') || metricaNombre.includes('humidity');
    });

    const temperaturaData = data.filter(m => {
      if (m.metricaid === 2) return true;
      const metricaNombre = m.localizacion?.metrica?.metrica?.toLowerCase() || '';
      return metricaNombre.includes('temperatura') || metricaNombre.includes('temperature');
    });

    const electroconductividadData = data.filter(m => {
      if (m.metricaid === 3) return true;
      const metricaNombre = m.localizacion?.metrica?.metrica?.toLowerCase() || '';
      return metricaNombre.includes('electroconductividad') ||
             metricaNombre.includes('conductividad') ||
             metricaNombre.includes('conductivity') ||
             metricaNombre.includes('ec');
    });

    return { humedadData, temperaturaData, electroconductividadData };
  }, [mediciones]);

  const { humedadData, temperaturaData, electroconductividadData } = chartData;

  // Crear gráfico de Humedad
  useEffect(() => {
    if (loading || humedadData.length === 0) return;

    // Destruir gráfico anterior
    if (humedadChartInstance.current) {
      humedadChartInstance.current.destroy();
      humedadChartInstance.current = null;
    }

    const ctx = humedadChartRef.current?.getContext('2d');
    if (ctx) {
      const labels = humedadData.map(m =>
        new Date(m.fecha).toLocaleString('es-ES', {
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      );
      const values = humedadData.map(m => m.medicion);

      humedadChartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Humedad (%)',
            data: values,
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: 'rgb(34, 197, 94)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: true, position: 'top' },
            tooltip: { mode: 'index', intersect: false }
          },
          scales: {
            x: {
              display: true,
              title: { display: true, text: 'Fecha' },
              ticks: { maxRotation: 45, minRotation: 45 }
            },
            y: {
              display: true,
              title: { display: true, text: 'Humedad (%)' },
              beginAtZero: false,
            }
          },
          interaction: { mode: 'nearest', axis: 'x', intersect: false }
        }
      });
    }

    return () => {
      if (humedadChartInstance.current) {
        humedadChartInstance.current.destroy();
      }
    };
  }, [humedadData, loading]);

  // Crear gráfico de Temperatura
  useEffect(() => {
    if (loading || temperaturaData.length === 0) return;

    // Destruir gráfico anterior
    if (temperaturaChartInstance.current) {
      temperaturaChartInstance.current.destroy();
      temperaturaChartInstance.current = null;
    }

    const ctx = temperaturaChartRef.current?.getContext('2d');
    if (ctx) {
      const labels = temperaturaData.map(m =>
        new Date(m.fecha).toLocaleString('es-ES', {
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      );
      const values = temperaturaData.map(m => m.medicion);

      temperaturaChartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Temperatura (°C)',
            data: values,
            borderColor: 'rgb(239, 68, 68)',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: 'rgb(239, 68, 68)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: true, position: 'top' },
            tooltip: { mode: 'index', intersect: false }
          },
          scales: {
            x: {
              display: true,
              title: { display: true, text: 'Fecha' },
              ticks: { maxRotation: 45, minRotation: 45 }
            },
            y: {
              display: true,
              title: { display: true, text: 'Temperatura (°C)' },
              beginAtZero: false,
            }
          },
          interaction: { mode: 'nearest', axis: 'x', intersect: false }
        }
      });
    }

    return () => {
      if (temperaturaChartInstance.current) {
        temperaturaChartInstance.current.destroy();
      }
    };
  }, [temperaturaData, loading]);

  // Crear gráfico de Electroconductividad
  useEffect(() => {
    if (loading || electroconductividadData.length === 0) return;

    // Destruir gráfico anterior
    if (electroconductividadChartInstance.current) {
      electroconductividadChartInstance.current.destroy();
      electroconductividadChartInstance.current = null;
    }

    const ctx = electroconductividadChartRef.current?.getContext('2d');
    if (ctx) {
      const labels = electroconductividadData.map(m =>
        new Date(m.fecha).toLocaleString('es-ES', {
          month: 'short',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      );
      const values = electroconductividadData.map(m => m.medicion);

      electroconductividadChartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: 'Electroconductividad (uS/cm)',
            data: values,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: 'rgb(59, 130, 246)',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 3,
            pointHoverRadius: 5,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: true, position: 'top' },
            tooltip: { mode: 'index', intersect: false }
          },
          scales: {
            x: {
              display: true,
              title: { display: true, text: 'Fecha' },
              ticks: { maxRotation: 45, minRotation: 45 }
            },
            y: {
              display: true,
              title: { display: true, text: 'Electroconductividad (uS/cm)' },
              beginAtZero: true,
            }
          },
          interaction: { mode: 'nearest', axis: 'x', intersect: false }
        }
      });
    }

    return () => {
      if (electroconductividadChartInstance.current) {
        electroconductividadChartInstance.current.destroy();
      }
    };
  }, [electroconductividadData, loading]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (mediciones.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Gráficos de Mediciones</h3>
        <div className="text-center text-gray-500 py-8">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p>No hay datos para mostrar en los gráficos</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Gráficos de Mediciones</h3>
        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {mediciones.length} mediciones
        </span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Gráfico de Humedad */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-semibold text-gray-900">Humedad (%)</h4>
            {humedadData.length > 0 && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                {humedadData.length} datos
              </span>
            )}
          </div>
          <div className="h-48">
            {humedadData.length > 0 ? (
              <canvas ref={humedadChartRef}></canvas>
            ) : (
              <div className="flex flex-col items-center justify-center h-full bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <div className="text-center text-gray-500">
                  <div className="text-3xl mb-2">💧</div>
                  <p className="text-sm font-medium">Sin datos de humedad</p>
                  <p className="text-xs mt-1">No hay mediciones disponibles</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Gráfico de Temperatura */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-semibold text-gray-900">Temperatura (°C)</h4>
            {temperaturaData.length > 0 && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-medium">
                {temperaturaData.length} datos
              </span>
            )}
          </div>
          <div className="h-48">
            {temperaturaData.length > 0 ? (
              <canvas ref={temperaturaChartRef}></canvas>
            ) : (
              <div className="flex flex-col items-center justify-center h-full bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <div className="text-center text-gray-500">
                  <div className="text-3xl mb-2">🌡️</div>
                  <p className="text-sm font-medium">Sin datos de temperatura</p>
                  <p className="text-xs mt-1">No hay mediciones disponibles</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Gráfico de Electroconductividad */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-md font-semibold text-gray-900">Electroconductividad (uS/cm)</h4>
            {electroconductividadData.length > 0 && (
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                {electroconductividadData.length} datos
              </span>
            )}
          </div>
          <div className="h-48">
            {electroconductividadData.length > 0 ? (
              <canvas ref={electroconductividadChartRef}></canvas>
            ) : (
              <div className="flex flex-col items-center justify-center h-full bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <div className="text-center text-gray-500">
                  <div className="text-3xl mb-2">⚡</div>
                  <p className="text-sm font-medium">Sin datos de conductividad</p>
                  <p className="text-xs mt-1">No hay mediciones disponibles</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="text-xs text-gray-500 text-center">
        Mostrando las últimas 50 mediciones ordenadas por fecha
      </div>
    </div>
  );
};

export default SeparateCharts;
