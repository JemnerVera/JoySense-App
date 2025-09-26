import { useState, useEffect } from 'react';

interface ChartJSLazyHook {
  Chart: any;
  CategoryScale: any;
  LinearScale: any;
  PointElement: any;
  LineElement: any;
  BarElement: any;
  Title: any;
  Tooltip: any;
  Legend: any;
  ArcElement: any;
  loading: boolean;
  error: string | null;
}

export const useChartJSLazy = (): ChartJSLazyHook => {
  const [Chart, setChart] = useState<any>(null);
  const [CategoryScale, setCategoryScale] = useState<any>(null);
  const [LinearScale, setLinearScale] = useState<any>(null);
  const [PointElement, setPointElement] = useState<any>(null);
  const [LineElement, setLineElement] = useState<any>(null);
  const [BarElement, setBarElement] = useState<any>(null);
  const [Title, setTitle] = useState<any>(null);
  const [Tooltip, setTooltip] = useState<any>(null);
  const [Legend, setLegend] = useState<any>(null);
  const [ArcElement, setArcElement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadChartJS = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const chartModule = await import('chart.js');
        const chart = chartModule.default;
        
        setChart(chart);
        setCategoryScale(chart.CategoryScale);
        setLinearScale(chart.LinearScale);
        setPointElement(chart.PointElement);
        setLineElement(chart.LineElement);
        setBarElement(chart.BarElement);
        setTitle(chart.Title);
        setTooltip(chart.Tooltip);
        setLegend(chart.Legend);
        setArcElement(chart.ArcElement);
        
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading Chart.js');
        setLoading(false);
      }
    };

    loadChartJS();
  }, []);

  return {
    Chart,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    loading,
    error
  };
};
