import { useState, useEffect, useCallback } from 'react';
import { JoySenseService } from '../services/backend-api';

interface Umbral {
  umbralid: number;
  ubicacionid: number;
  criticidadid: number;
  nodoid: number;
  metricaid: number;
  umbral: string;
  maximo: number;
  minimo: number;
  tipoid: number;
  statusid: number;
  usercreatedid: number;
  datecreated: string;
  usermodifiedid?: number;
  datemodified?: string;
}

interface UmbralFormData {
  ubicacionid: string;
  criticidadid: string;
  nodoid: string;
  metricaid: string;
  umbral: string;
  maximo: string;
  minimo: string;
  tipoid: string;
}

export const useUmbrales = () => {
  const [umbrales, setUmbrales] = useState<Umbral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Cargar umbrales
  const loadUmbrales = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);
      
      console.log('🔍 Debug - Iniciando carga de umbrales...');
      const response = await JoySenseService.getTableData('umbral');
      console.log('🔍 Debug - Respuesta de getTableData:', response);
      
      // Extraer el array de datos de la respuesta
      let data: Umbral[] = [];
      if (response && typeof response === 'object') {
        if (Array.isArray(response)) {
          // Si la respuesta es directamente un array
          data = response;
        } else if (response && typeof response === 'object' && 'data' in response && Array.isArray((response as any).data)) {
          // Si la respuesta tiene estructura {data: [...], total: X, page: X, totalPages: X}
          data = (response as any).data;
        } else {
          console.error('❌ Error: Formato de respuesta inesperado:', response);
          setUmbrales([]);
          setError('Error: Formato de respuesta inesperado del servidor');
          return;
        }
      }
      
      console.log('🔍 Debug - Datos extraídos:', data);
      console.log('🔍 Debug - Cantidad de umbrales:', data.length);
      
      setUmbrales(data);
      setMessage(`Se cargaron ${data.length} umbrales`);
      console.log('✅ Debug - Umbrales cargados correctamente:', data.length);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error en loadUmbrales:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Crear umbral
  const createUmbral = useCallback(async (formData: UmbralFormData) => {
    try {
      setError(null);
      setMessage(null);
      
      const umbralData = {
        ubicacionid: parseInt(formData.ubicacionid),
        criticidadid: parseInt(formData.criticidadid),
        nodoid: parseInt(formData.nodoid),
        metricaid: parseInt(formData.metricaid),
        umbral: formData.umbral,
        maximo: parseFloat(formData.maximo),
        minimo: parseFloat(formData.minimo),
        tipoid: parseInt(formData.tipoid),
        statusid: 1,
        usercreatedid: 1,
        datecreated: new Date().toISOString()
      };

      const response = await JoySenseService.insertTableRow('umbral', umbralData);
      
      if (response.error) throw new Error(response.error);
      
      setMessage('Umbral creado correctamente');
      await loadUmbrales(); // Recargar lista
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error en createUmbral:', err);
      return false;
    }
  }, [loadUmbrales]);

  // Actualizar umbral
  const updateUmbral = useCallback(async (umbralid: number, formData: UmbralFormData) => {
    try {
      setError(null);
      setMessage(null);
      
      const umbralData = {
        ubicacionid: parseInt(formData.ubicacionid),
        criticidadid: parseInt(formData.criticidadid),
        nodoid: parseInt(formData.nodoid),
        metricaid: parseInt(formData.metricaid),
        umbral: formData.umbral,
        maximo: parseFloat(formData.maximo),
        minimo: parseFloat(formData.minimo),
        tipoid: parseInt(formData.tipoid),
        usermodifiedid: 1,
        datemodified: new Date().toISOString()
      };

      const response = await JoySenseService.updateTableRow('umbral', umbralid.toString(), umbralData);
      
      if (response.error) throw new Error(response.error);
      
      setMessage('Umbral actualizado correctamente');
      await loadUmbrales(); // Recargar lista
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error en updateUmbral:', err);
      return false;
    }
  }, [loadUmbrales]);

  // Eliminar umbral
  const deleteUmbral = useCallback(async (umbralid: number) => {
    try {
      setError(null);
      setMessage(null);
      
      const response = await JoySenseService.deleteTableRow('umbral', umbralid.toString());
      
      if (response.error) throw new Error(response.error);
      
      setMessage('Umbral eliminado correctamente');
      await loadUmbrales(); // Recargar lista
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      console.error('Error en deleteUmbral:', err);
      return false;
    }
  }, [loadUmbrales]);

  // Limpiar mensajes
  const clearMessages = useCallback(() => {
    setError(null);
    setMessage(null);
  }, []);

  // Cargar datos iniciales
  useEffect(() => {
    loadUmbrales();
  }, [loadUmbrales]);

  return {
    umbrales,
    loading,
    error,
    message,
    loadUmbrales,
    createUmbral,
    updateUmbral,
    deleteUmbral,
    clearMessages
  };
};
