import { createContext, useContext, ReactNode, useMemo } from 'react';
import type { MetricMetadata, BackendMetric } from '../types/metrics';
import { createMetricsRegistry } from '../components/Dashboard/utils/metricUtils';

type MetricsRegistry = Map<string, MetricMetadata>;

interface MetricsContextType {
  registry: MetricsRegistry | null;
}

const MetricsContext = createContext<MetricsContextType>({
  registry: null
});

interface MetricsProviderProps {
  children: ReactNode;
  metricas?: BackendMetric[];
}

export function MetricsProvider({ children, metricas = [] }: MetricsProviderProps) {
  const registry = useMemo(() => {
    if (!metricas || metricas.length === 0) {
      return createMetricsRegistry([]);
    }
    return createMetricsRegistry(metricas);
  }, [metricas]);

  return (
    <MetricsContext.Provider value={{ registry }}>
      {children}
    </MetricsContext.Provider>
  );
}

export function useMetricsRegistry(): MetricsRegistry | null {
  const context = useContext(MetricsContext);
  return context.registry;
}
