import React from 'react';

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    tension: number;
  }[];
}

interface DashboardChartComponentProps {
  data: ChartData;
  type: 'line' | 'bar' | 'doughnut';
  title: string;
  height?: string;
  loading?: boolean;
  error?: string;
}

export const DashboardChartComponent: React.FC<DashboardChartComponentProps> = ({
  data,
  type,
  title,
  height = '300px',
  loading = false,
  error
}) => {

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-400 text-sm">Cargando gráfico...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-2">⚠️</div>
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const renderSimpleChart = () => {
    if (!data || !data.datasets || data.datasets.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-gray-400">No hay datos para mostrar</p>
        </div>
      );
    }

    const maxValue = Math.max(...data.datasets.flatMap(dataset => dataset.data));
    const minValue = Math.min(...data.datasets.flatMap(dataset => dataset.data));
    const range = maxValue - minValue || 1;

    return (
      <div className="p-4 h-full">
        <h3 className="text-white text-lg font-semibold mb-4">{title}</h3>
        
        {type === 'doughnut' ? (
          // Gráfico de dona simplificado
          <div className="flex flex-col items-center space-y-4">
            {data.datasets[0]?.data.map((value, index) => {
              const percentage = (value / data.datasets[0].data.reduce((a, b) => a + b, 0)) * 100;
              return (
                <div key={index} className="flex items-center space-x-3 w-full">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: data.datasets[0].borderColor }}
                  ></div>
                  <span className="text-gray-300 text-sm">{data.labels[index]}</span>
                  <span className="text-white font-medium ml-auto">{value}</span>
                  <span className="text-gray-400 text-sm">({percentage.toFixed(1)}%)</span>
                </div>
              );
            })}
          </div>
        ) : (
          // Gráfico de barras/líneas simplificado
          <div className="h-full flex flex-col">
            <div className="flex-1 flex items-end space-x-2 justify-center">
              {data.labels.map((label, index) => {
                const values = data.datasets.map(dataset => dataset.data[index] || 0);
                const maxBarValue = Math.max(...values);
                const barHeight = (maxBarValue / maxValue) * 100;
                
                return (
                  <div key={index} className="flex flex-col items-center space-y-1">
                    <div className="flex flex-col items-end space-y-1">
                      {data.datasets.map((dataset, datasetIndex) => {
                        const value = dataset.data[index] || 0;
                        const height = (value / maxValue) * 80;
                        return (
                          <div
                            key={datasetIndex}
                            className="w-8 rounded-t"
                            style={{
                              height: `${height}%`,
                              backgroundColor: dataset.backgroundColor,
                              border: `2px solid ${dataset.borderColor}`,
                              minHeight: value > 0 ? '4px' : '0px'
                            }}
                            title={`${dataset.label}: ${value}`}
                          ></div>
                        );
                      })}
                    </div>
                    <span className="text-gray-400 text-xs transform -rotate-45 origin-left">
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
            
            {/* Leyenda */}
            <div className="mt-4 flex flex-wrap justify-center space-x-4">
              {data.datasets.map((dataset, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: dataset.borderColor }}
                  ></div>
                  <span className="text-gray-300 text-sm">{dataset.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ height }} className="bg-gray-800 rounded-lg">
      {renderSimpleChart()}
    </div>
  );
};