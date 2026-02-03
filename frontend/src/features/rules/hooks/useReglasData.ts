import { useState, useEffect } from 'react';
import { JoySenseService } from '../../../services/backend-api';

export function useReglasData(activeSubTab: 'status' | 'insert' | 'update') {
  // Estado para reglasData
  const [reglasData, setReglasData] = useState<any[]>([]);

  // Estado para umbralesData
  const [umbralesData, setUmbralesData] = useState<any[]>([]);

  // Cargar reglasData cuando se monta o cuando cambia a 'update'
  useEffect(() => {
    const loadReglas = async () => {
      try {
        const reglas = await JoySenseService.getTableData('regla', 1000);
        const reglasArray = Array.isArray(reglas) ? reglas : [];
        setReglasData(reglasArray);
      } catch (error) {
        console.error('Error cargando reglas:', error);
        setReglasData([]);
      }
    };

    // Cargar cuando se monta o cuando se cambia a 'update'
    if (activeSubTab === 'update' || reglasData.length === 0) {
      loadReglas();
    }
  }, [activeSubTab, reglasData.length]);

  // Cargar umbralesData cuando cambia a 'insert' o 'update'
  useEffect(() => {
    const loadUmbrales = async () => {
      try {
        const umbrales = await JoySenseService.getTableData('umbral', 1000);
        const umbralesArray = Array.isArray(umbrales) ? umbrales : [];
        setUmbralesData(umbralesArray);
      } catch (error) {
        console.error('Error cargando umbrales:', error);
        setUmbralesData([]);
      }
    };

    if (activeSubTab === 'insert' || activeSubTab === 'update') {
      loadUmbrales();
    }
  }, [activeSubTab]);

  // Función para recargar reglas después de operaciones
  const reloadReglas = async () => {
    try {
      const reglas = await JoySenseService.getTableData('regla', 1000);
      setReglasData(Array.isArray(reglas) ? reglas : []);
    } catch (error) {
      console.error('Error recargando reglas:', error);
    }
  };

  // Función para recargar umbrales después de crear uno nuevo
  const reloadUmbrales = async () => {
    try {
      const umbrales = await JoySenseService.getTableData('umbral', 1000);
      setUmbralesData(Array.isArray(umbrales) ? umbrales : []);
    } catch (error) {
      console.error('Error recargando umbrales:', error);
    }
  };

  return {
    reglasData,
    setReglasData,
    umbralesData,
    setUmbralesData,
    reloadReglas,
    reloadUmbrales
  };
}