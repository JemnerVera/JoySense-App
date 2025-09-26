import { useState, useEffect } from 'react';
import { JoySenseService } from '../services/backend-api';

interface FilterData {
  paises: any[];
  empresas: any[];
  fundos: any[];
  loading: boolean;
  error: string | null;
}

export const useFilterData = (authToken: string): FilterData => {
  const [paises, setPaises] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [fundos, setFundos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        setError(null);
        
        
        // Cargar datos en paralelo para mejor rendimiento
        // Usar los métodos específicos que ya existen en el backend
        const [paisesData, empresasData, fundosData] = await Promise.all([
          JoySenseService.getPaises(), // Usar método específico
          JoySenseService.getEmpresas(), // Usar método específico
          JoySenseService.getFundos() // Usar método específico
        ]);

        console.log('📊 Datos cargados:', {
          paises: paisesData?.length || 0,
          empresas: empresasData?.length || 0,
          fundos: fundosData?.length || 0
        });

        setPaises(paisesData || []);
        setEmpresas(empresasData || []);
        setFundos(fundosData || []);

      } catch (err: any) {
        console.error('❌ Error cargando datos de filtros:', err);
        setError(err.message || 'Error al cargar datos de filtros');
      } finally {
        setLoading(false);
      }
    };

    // Cargar datos independientemente del authToken
    // ya que getTableData maneja la autenticación internamente
    cargarDatos();
  }, [authToken]);

  return {
    paises,
    empresas,
    fundos,
    loading,
    error
  };
};
