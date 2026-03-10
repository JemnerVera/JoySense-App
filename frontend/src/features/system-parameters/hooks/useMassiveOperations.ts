// ============================================================================
// HOOK: useMassiveOperations - Handler para operaciones masivas
// ============================================================================

import { useCallback } from 'react';

interface Message {
  type: 'success' | 'error' | 'warning' | 'info';
  text: string;
}

interface UseMassiveOperationsProps {
  insertRow: (data: Record<string, any>) => Promise<{ success: boolean; error?: string }>;
  loadData: () => void;
  loadTableData: (table: string) => void;
  selectedTable: string;
  setMessage: (message: Message | null) => void;
}

export const useMassiveOperations = ({
  insertRow,
  loadData,
  loadTableData,
  selectedTable,
  setMessage
}: UseMassiveOperationsProps) => {

  const handleMassiveUmbralApply = useCallback(async (dataToApply: any[]): Promise<{ success: boolean; error?: string }> => {
    if (!dataToApply || dataToApply.length === 0) {
      setMessage({ type: 'warning', text: 'No hay datos para aplicar' });
      return { success: false, error: 'No hay datos para aplicar' };
    }

    try {
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // Determinar el nombre de la tabla para mensajes
      const tableNames: Record<string, string> = {
        'umbral': 'umbral(es)',
        'sensor': 'sensor(es)',
        'metricasensor': 'asociación(es) de métrica-sensor',
        'localizacion': 'localización(es)'
      };
      const tableName = tableNames[selectedTable] || 'registro(s)';

      for (const rowData of dataToApply) {
        try {
          const result = await insertRow(rowData);
          if (result.success) {
            successCount++;
          } else {
            errorCount++;
            // Mensaje de error genérico
            const errorMsg = result.error || 'Error desconocido';
            errors.push(errorMsg);
          }
        } catch (error: any) {
          errorCount++;
          const errorMsg = error.message || 'Error desconocido';
          errors.push(errorMsg);
        }
      }

      if (errorCount === 0) {
        setMessage({ 
          type: 'success', 
          text: `✅ ${successCount} ${tableName} creado(s) correctamente` 
        });
        // Recargar datos
        loadData();
        loadTableData(selectedTable);
        return { success: true };
      } else {
        setMessage({ 
          type: 'warning', 
          text: `✅ ${successCount} creado(s), ❌ ${errorCount} error(es). ${errors.slice(0, 3).join('; ')}${errors.length > 3 ? '...' : ''}` 
        });
        // Recargar datos incluso si hay errores parciales
        loadData();
        loadTableData(selectedTable);
        return { success: errorCount === 0, error: errorCount > 0 ? `${errorCount} error(es)` : undefined };
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Error desconocido';
      setMessage({ 
        type: 'warning', 
        text: `Error al aplicar datos: ${errorMsg}` 
      });
      return { success: false, error: errorMsg };
    }
  }, [insertRow, loadData, loadTableData, selectedTable, setMessage]);

  return {
    handleMassiveUmbralApply
  };
};

