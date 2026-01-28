import React, { Suspense, lazy, useEffect } from 'react';
import { preloadService } from '../../services/preloadService';

// Loading component for Suspense fallback
const LoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-2 text-gray-600">Cargando...</span>
  </div>
);

// Lazy load SystemParameters component con preload
const SystemParametersLazy = lazy(() => 
  import('../SystemParameters').then(module => {
    return { default: module.default };
  })
);


// Lazy load NotificacionesMain component
const NotificacionesMainLazy = lazy(() =>
  import('../MainComponents/NotificacionesMain').then(module => {
    return { default: module.default };
  })
);

// Lazy load UmbralesMain component
const UmbralesMainLazy = lazy(() => 
  import('../Umbrales/UmbralesMain').then(module => ({
    default: module.default
  }))
);

// Lazy load Dashboard component con preload
const DashboardLazy = lazy(() => 
  import('../Dashboard/DashboardMain').then(module => {
    return { default: module.default };
  })
);

// Lazy load heavy components con preload
const NormalInsertFormLazy = lazy(() => 
  import('../forms/NormalInsertForm').then(module => {
    return { default: module.default };
  })
);

const MassiveUmbralFormLazy = lazy(() => 
  import('../forms/MassiveUmbralForm').then(module => {
    return { default: module.MassiveUmbralForm };
  })
);

const MassivePerfilUmbralFormLazy = lazy(() => 
  import('../forms/MassivePerfilUmbralForm').then(module => {
    return { default: module.MassivePerfilUmbralForm };
  })
);

const MultipleMetricaSensorFormLazy = lazy(() =>
  import('../forms/multiple/MultipleMetricaSensorForm').then(module => {
    return { default: module.default };
  })
);

const DashboardHierarchyLazy = lazy(() => 
  import('../DashboardHierarchy').then(module => {
    return { default: module.default };
  })
);

const MetricaPorLoteLazy = lazy(() => 
  import('../Reportes/MetricaPorLote').then(module => {
    return { default: module.default };
  })
);

const UmbralesPorLoteLazy = lazy(() => 
  import('../Reportes/UmbralesPorLote').then(module => {
    return { default: module.default };
  })
);

const NodeStatusDashboardLazy = lazy(() => 
  import('../Dashboard/NodeStatusDashboard').then(module => {
    return { default: module.default };
  })
);

const AlertStatusDashboardLazy = lazy(() => 
  import('../Dashboard/AlertStatusDashboard').then(module => {
    return { default: module.default };
  })
);

const MedicionesDashboardLazy = lazy(() => 
  import('../Dashboard/MedicionesDashboard').then(module => {
    return { default: module.MedicionesDashboard };
  })
);

// Wrapper component for lazy loading with error boundary
interface LazyComponentWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

const LazyComponentWrapper: React.FC<LazyComponentWrapperProps> = ({ 
  children, 
  fallback = <LoadingSpinner /> 
}) => {
  return (
    <Suspense fallback={fallback}>
      {children}
    </Suspense>
  );
};

// Error Boundary for lazy components
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class LazyComponentErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Lazy component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-red-600 text-lg font-semibold mb-2">
              Error al cargar el componente
            </div>
            <div className="text-gray-600 mb-4">
              {this.state.error?.message || 'Ha ocurrido un error inesperado'}
            </div>
            <button
              onClick={() => this.setState({ hasError: false, error: undefined })}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Enhanced lazy components with error boundaries
export const SystemParametersLazyWithBoundary = React.forwardRef<any, any>((props, ref) => (
  <LazyComponentErrorBoundary>
    <LazyComponentWrapper>
      <SystemParametersLazy {...props} ref={ref} />
    </LazyComponentWrapper>
  </LazyComponentErrorBoundary>
));


export const NotificacionesMainLazyWithBoundary = React.forwardRef<any, any>((props, ref) => (
  <LazyComponentErrorBoundary>
    <LazyComponentWrapper>
      <NotificacionesMainLazy {...props} ref={ref} />
    </LazyComponentWrapper>
  </LazyComponentErrorBoundary>
));

export const UmbralesMainLazyWithBoundary: React.FC = () => (
  <LazyComponentErrorBoundary>
    <LazyComponentWrapper>
      <UmbralesMainLazy />
    </LazyComponentWrapper>
  </LazyComponentErrorBoundary>
);

export const DashboardLazyWithBoundary: React.FC = () => (
  <LazyComponentErrorBoundary>
    <LazyComponentWrapper>
      <DashboardLazy />
    </LazyComponentWrapper>
  </LazyComponentErrorBoundary>
);

// Enhanced lazy components with error boundaries for heavy components
export const NormalInsertFormLazyWithBoundary: React.FC<any> = (props) => (
  <LazyComponentErrorBoundary>
    <LazyComponentWrapper>
      <NormalInsertFormLazy {...props} />
    </LazyComponentWrapper>
  </LazyComponentErrorBoundary>
);

export const MassiveUmbralFormLazyWithBoundary: React.FC<any> = (props) => (
  <LazyComponentErrorBoundary>
    <LazyComponentWrapper>
      <MassiveUmbralFormLazy {...props} />
    </LazyComponentWrapper>
  </LazyComponentErrorBoundary>
);

export const MassivePerfilUmbralFormLazyWithBoundary: React.FC<any> = (props) => (
  <LazyComponentErrorBoundary>
    <LazyComponentWrapper>
      <MassivePerfilUmbralFormLazy {...props} />
    </LazyComponentWrapper>
  </LazyComponentErrorBoundary>
);

export const MultipleMetricaSensorFormLazyWithBoundary: React.FC<any> = (props) => (
  <LazyComponentErrorBoundary>
    <LazyComponentWrapper>
      <MultipleMetricaSensorFormLazy {...props} />
    </LazyComponentWrapper>
  </LazyComponentErrorBoundary>
);

export const DashboardHierarchyLazyWithBoundary: React.FC<any> = (props) => (
  <LazyComponentErrorBoundary>
    <LazyComponentWrapper>
      <DashboardHierarchyLazy {...props} />
    </LazyComponentWrapper>
  </LazyComponentErrorBoundary>
);

// Export the original lazy components for direct use
export {
  SystemParametersLazy,
  UmbralesMainLazy,
  DashboardLazy,
  NormalInsertFormLazy,
  MassiveUmbralFormLazy,
  MassivePerfilUmbralFormLazy,
  MultipleMetricaSensorFormLazy,
  DashboardHierarchyLazy,
  MetricaPorLoteLazy,
  UmbralesPorLoteLazy,
  NodeStatusDashboardLazy,
  AlertStatusDashboardLazy,
  MedicionesDashboardLazy,
  LazyComponentWrapper,
  LazyComponentErrorBoundary
};

// Utility function to create lazy components dynamically
export const createLazyComponent = (
  importFunction: () => Promise<{ default: React.ComponentType<any> }>,
  fallback?: React.ReactNode
) => {
  const LazyComponent = lazy(importFunction);
  
  return React.forwardRef<any, any>((props, ref) => (
    <LazyComponentErrorBoundary>
      <LazyComponentWrapper fallback={fallback}>
        <LazyComponent {...props} ref={ref} />
      </LazyComponentWrapper>
    </LazyComponentErrorBoundary>
  ));
};

// Preload function for lazy components
export const preloadLazyComponent = (importFunction: () => Promise<any>) => {
  return importFunction();
};

// Hook for lazy loading with loading state
export const useLazyComponent = (importFunction: () => Promise<any>) => {
  const [Component, setComponent] = React.useState<React.ComponentType<any> | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  const loadComponent = React.useCallback(async () => {
    if (Component) return Component;
    
    setLoading(true);
    setError(null);
    
    try {
      const module = await importFunction();
      const component = module.default || module;
      setComponent(component);
      return component;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [Component, importFunction]);

  return {
    Component,
    loading,
    error,
    loadComponent
  };
};

// Hook para preload automático de componentes críticos
export const usePreloadCriticalComponents = () => {
  useEffect(() => {
    // Preload componentes críticos después de que la app esté lista
    const timer = setTimeout(() => {
      preloadService.preloadCriticalComponents();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);
};

// Hook para preload en hover
export const useHoverPreload = (componentName: string) => {
  const ref = React.useRef<HTMLElement>(null);

  useEffect(() => {
    if (ref.current) {
      const cleanup = preloadService.setupHoverPreload(ref.current, componentName);
      return cleanup;
    }
  }, [componentName]);

  return ref;
};
