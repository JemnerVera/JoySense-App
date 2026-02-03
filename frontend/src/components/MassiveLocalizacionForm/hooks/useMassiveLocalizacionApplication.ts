// ============================================================================
// HOOK: useMassiveLocalizacionApplication
// Maneja la aplicación de localizaciones masivas
// ============================================================================

import { useCallback } from 'react';
import { FormData, SelectedNodo, SelectedLocalizacion, LocalizacionDataToApply } from '../types';
import { logger } from '../../../utils/logger';

interface UseMassiveLocalizacionApplicationProps {
  formData: FormData;
  selectedNodo: SelectedNodo | null;
  selectedLocalizacion: SelectedLocalizacion | null;
  localizacionName: string;
  onApply: (data: LocalizacionDataToApply[]) => void;
}

export const useMassiveLocalizacionApplication = ({
  formData,
  selectedNodo,
  selectedLocalizacion,
  localizacionName,
  onApply
}: UseMassiveLocalizacionApplicationProps) => {
  const handleApply = useCallback(async () => {
    try {
      // Validar datos requeridos
      if (!selectedNodo || !localizacionName) {
        logger.error('Faltan datos requeridos para aplicar localizaciones masivas');
        return;
      }

      // Obtener sensores y métricas seleccionados
      const selectedSensoresMetricas = formData.sensoresMetricasData?.filter(sm => sm.selected) || [];
      
      if (selectedSensoresMetricas.length === 0) {
        logger.error('No hay sensores y métricas seleccionados');
        return;
      }

      // Construir datos a aplicar
      const dataToApply: LocalizacionDataToApply[] = selectedSensoresMetricas.map(sm => ({
        nodoid: selectedNodo.nodoid,
        localizacionid: 0, // El ID se generará en la BD
        sensorid: sm.sensorid,
        metricaid: sm.metricaid,
        localizacion: localizacionName,
        statusid: 1
      }));

      logger.info(`Aplicando ${dataToApply.length} localizaciones masivas`, dataToApply);
      onApply(dataToApply);
    } catch (error) {
      logger.error('Error al aplicar localizaciones masivas:', error);
      throw error;
    }
  }, [formData, selectedNodo, localizacionName, onApply]);

  return {
    handleApply
  };
};
