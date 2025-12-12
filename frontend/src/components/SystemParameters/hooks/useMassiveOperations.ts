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

  const handleMassiveUmbralApply = useCallback(async (dataToApply: any[]) => {
    if (!dataToApply || dataToApply.length === 0) {
      setMessage({ type: 'error', text: 'No hay datos para aplicar' });
      return;
    }

    try {
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (const umbralData of dataToApply) {
        try {
          const result = await insertRow(umbralData);
          if (result.success) {
            successCount++;
          } else {
            errorCount++;
            errors.push(`Nodo ${umbralData.nodoid}, Tipo ${umbralData.tipoid}, Métrica ${umbralData.metricaid}: ${result.error || 'Error desconocido'}`);
          }
        } catch (error: any) {
          errorCount++;
          errors.push(`Nodo ${umbralData.nodoid}, Tipo ${umbralData.tipoid}, Métrica ${umbralData.metricaid}: ${error.message || 'Error desconocido'}`);
        }
      }

      if (errorCount === 0) {
        setMessage({ 
          type: 'success', 
          text: `✅ ${successCount} umbral(es) creado(s) correctamente` 
        });
        // Recargar datos
        loadData();
        loadTableData(selectedTable);
      } else {
        setMessage({ 
          type: 'warning', 
          text: `✅ ${successCount} creado(s), ❌ ${errorCount} error(es). ${errors.slice(0, 3).join('; ')}${errors.length > 3 ? '...' : ''}` 
        });
      }
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: `Error al aplicar umbrales: ${error.message || 'Error desconocido'}` 
      });
    }
  }, [insertRow, loadData, loadTableData, selectedTable, setMessage]);

  return {
    handleMassiveUmbralApply
  };
};

