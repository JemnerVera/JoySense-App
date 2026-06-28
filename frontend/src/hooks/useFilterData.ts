import { useState, useEffect } from 'react';
import { JoySenseService } from '../services/backend-api';

interface FilterData {
  paises: any[];
  empresas: any[];
  fundos: any[];
  ubicaciones: any[];
  loading: boolean;
  error: string | null;
}

export const useFilterData = (authToken: string): FilterData => {
  const [paises, setPaises] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [fundos, setFundos] = useState<any[]>([]);
  const [ubicaciones, setUbicaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await JoySenseService.getFiltersData();

        setPaises(data?.paises || []);
        setEmpresas(data?.empresas || []);
        setFundos(data?.fundos || []);
        setUbicaciones(data?.ubicaciones || []);

      } catch (err: any) {
        console.error('❌ Error cargando datos de filtros:', err);
        setError(err.message || 'Error al cargar datos de filtros');
      } finally {
        setLoading(false);
      }
    };

    cargarDatos();
  }, [authToken]);

  return {
    paises,
    empresas,
    fundos,
    ubicaciones,
    loading,
    error
  };
};
