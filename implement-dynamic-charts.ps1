# Script para implementar lazy loading dinámico de librerías de gráficos
Write-Host "📊 IMPLEMENTANDO LAZY LOADING PARA GRÁFICOS" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan

# 1. Crear hook para lazy loading de Chart.js
$chartHookContent = @"
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
"@

# 2. Crear hook para lazy loading de Recharts
$rechartsHookContent = @"
import { useState, useEffect } from 'react';

interface RechartsLazyHook {
  LineChart: any;
  Line: any;
  XAxis: any;
  YAxis: any;
  CartesianGrid: any;
  Tooltip: any;
  Legend: any;
  ResponsiveContainer: any;
  BarChart: any;
  Bar: any;
  PieChart: any;
  Pie: any;
  Cell: any;
  loading: boolean;
  error: string | null;
}

export const useRechartsLazy = (): RechartsLazyHook => {
  const [LineChart, setLineChart] = useState<any>(null);
  const [Line, setLine] = useState<any>(null);
  const [XAxis, setXAxis] = useState<any>(null);
  const [YAxis, setYAxis] = useState<any>(null);
  const [CartesianGrid, setCartesianGrid] = useState<any>(null);
  const [Tooltip, setTooltip] = useState<any>(null);
  const [Legend, setLegend] = useState<any>(null);
  const [ResponsiveContainer, setResponsiveContainer] = useState<any>(null);
  const [BarChart, setBarChart] = useState<any>(null);
  const [Bar, setBar] = useState<any>(null);
  const [PieChart, setPieChart] = useState<any>(null);
  const [Pie, setPie] = useState<any>(null);
  const [Cell, setCell] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRecharts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const rechartsModule = await import('recharts');
        
        setLineChart(rechartsModule.LineChart);
        setLine(rechartsModule.Line);
        setXAxis(rechartsModule.XAxis);
        setYAxis(rechartsModule.YAxis);
        setCartesianGrid(rechartsModule.CartesianGrid);
        setTooltip(rechartsModule.Tooltip);
        setLegend(rechartsModule.Legend);
        setResponsiveContainer(rechartsModule.ResponsiveContainer);
        setBarChart(rechartsModule.BarChart);
        setBar(rechartsModule.Bar);
        setPieChart(rechartsModule.PieChart);
        setPie(rechartsModule.Pie);
        setCell(rechartsModule.Cell);
        
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading Recharts');
        setLoading(false);
      }
    };

    loadRecharts();
  }, []);

  return {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    loading,
    error
  };
};
"@

# 3. Crear los archivos
$chartHookPath = "frontend/src/hooks/useChartJSLazy.ts"
$rechartsHookPath = "frontend/src/hooks/useRechartsLazy.ts"

Write-Host "`n📝 Creando hooks para lazy loading de gráficos..." -ForegroundColor Yellow

Set-Content -Path $chartHookPath -Value $chartHookContent -Encoding UTF8
Write-Host "  ✅ Creado: $chartHookPath" -ForegroundColor Green

Set-Content -Path $rechartsHookPath -Value $rechartsHookContent -Encoding UTF8
Write-Host "  ✅ Creado: $rechartsHookPath" -ForegroundColor Green

Write-Host "`n💡 PRÓXIMOS PASOS:" -ForegroundColor Yellow
Write-Host "1. Actualizar componentes que usan Chart.js para usar useChartJSLazy" -ForegroundColor White
Write-Host "2. Actualizar componentes que usan Recharts para usar useRechartsLazy" -ForegroundColor White
Write-Host "3. Agregar loading states y error handling" -ForegroundColor White
Write-Host "4. Probar que los gráficos se cargan correctamente" -ForegroundColor White

Write-Host "`n✅ Hooks de lazy loading creados!" -ForegroundColor Green
