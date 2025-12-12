// ============================================================================
// COMPONENT: MassiveUmbralSummary - Resumen de selección
// ============================================================================

import React from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';

interface MassiveUmbralSummaryProps {
  selectedNodesCount: number;
  assignedTiposCount: number;
  validMetricasCount: number;
  totalCombinations: number;
}

export const MassiveUmbralSummary: React.FC<MassiveUmbralSummaryProps> = ({
  selectedNodesCount,
  assignedTiposCount,
  validMetricasCount,
  totalCombinations
}) => {
  const { t } = useLanguage();

  if (selectedNodesCount === 0) return null;

  return (
    <div className="bg-gray-100 dark:bg-neutral-800 rounded-lg p-4">
      <h5 className="text-orange-400 font-mono tracking-wider font-bold mb-3">
        {t('umbral.selection_summary')}
      </h5>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div>
          <span className="text-orange-400">{t('umbral.selected_nodes')}</span>
          <span className="text-gray-900 dark:text-white ml-2">{selectedNodesCount}</span>
        </div>
        <div>
          <span className="text-orange-400">{t('umbral.assigned_types')}</span>
          <span className="text-gray-900 dark:text-white ml-2">{assignedTiposCount}</span>
        </div>
        <div>
          <span className="text-orange-400">{t('umbral.configured_metrics')}</span>
          <span className="text-gray-900 dark:text-white ml-2">{validMetricasCount}</span>
        </div>
      </div>
      <div className="mt-3 text-orange-300 font-mono text-sm">
        {t('umbral.total_thresholds_to_create')} <span className="font-bold">{totalCombinations}</span>
      </div>
    </div>
  );
};

