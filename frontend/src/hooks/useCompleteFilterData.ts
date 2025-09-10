import { useState, useEffect } from 'react';
import { JoySenseService } from '../services/backend-api';

interface CompleteFilterData {
  paises: any[];
  empresas: any[];
  fundos: any[];
  entidades: any[];
  ubicaciones: any[];
  loading: boolean;
  error: string | null;
}

export const useCompleteFilterData = (authToken: string): CompleteFilterData => {
  const [paises, setPaises] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [fundos, setFundos] = useState<any[]>([]);
  const [entidades, setEntidades] = useState<any[]>([]);
  const [ubicaciones, setUbicaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Cargar datos en paralelo para mejor rendimiento
        const [paisesData, empresasData, fundosData, entidadesData, ubicacionesData] = await Promise.all([
          JoySenseService.getPaises(),
          JoySenseService.getEmpresas(),
          JoySenseService.getFundos(),
          JoySenseService.getTableData('entidad'),
          JoySenseService.getTableData('ubicacion')
        ]);

        setPaises(paisesData || []);
        setEmpresas(empresasData || []);
        setFundos(fundosData || []);
        setEntidades(entidadesData || []);
        setUbicaciones(ubicacionesData || []);

      } catch (err: any) {
        console.error('Error cargando datos completos de filtros:', err);
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
    entidades,
    ubicaciones,
    loading,
    error
  };
};
