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
