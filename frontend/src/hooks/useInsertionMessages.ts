import { useState, useCallback, useEffect } from 'react';

interface InsertedRecord {
  id: string;
  fields: Record<string, any>;
}

export const useInsertionMessages = (activeSubTab: string, activeTab?: string, selectedTable?: string) => {
  const [insertedRecords, setInsertedRecords] = useState<InsertedRecord[]>([]);

  // Limpiar registros cuando se cambia de subpestaña (excepto cuando se mantiene en 'insert')
  useEffect(() => {
    if (activeSubTab !== 'insert') {
      setInsertedRecords([]);
    }
  }, [activeSubTab]);

  // Limpiar registros cuando se cambia de pestaña principal (excepto cuando se mantiene en 'parameters')
  useEffect(() => {
    if (activeTab && activeTab !== 'parameters') {
      setInsertedRecords([]);
    }
  }, [activeTab]);

  // Limpiar registros cuando se cambia de tabla seleccionada
  useEffect(() => {
    setInsertedRecords([]);
  }, [selectedTable]);

  // Función para agregar un nuevo registro insertado
  const addInsertedRecord = useCallback((fields: Record<string, any>) => {
    const newRecord: InsertedRecord = {
      id: `record_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fields: { ...fields }
    };
    
    setInsertedRecords(prev => [...prev, newRecord]);
  }, []);

  // Función para limpiar todos los registros insertados
  const clearInsertedRecords = useCallback(() => {
    setInsertedRecords([]);
  }, []);

  // Función para limpiar registros cuando se cambia de pestaña
  const clearOnTabChange = useCallback(() => {
    setInsertedRecords([]);
  }, []);

  return {
    insertedRecords,
    addInsertedRecord,
    clearInsertedRecords,
    clearOnTabChange
  };
};
