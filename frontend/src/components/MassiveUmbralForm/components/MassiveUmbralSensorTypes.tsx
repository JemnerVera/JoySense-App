// ============================================================================
// COMPONENT: MassiveUmbralSensorTypes - Tipos de sensores asignados
// ============================================================================

import React from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { SelectedTipo } from '../types';

interface MassiveUmbralSensorTypesProps {
  assignedSensorTypes: SelectedTipo[];
}

export const MassiveUmbralSensorTypes: React.FC<MassiveUmbralSensorTypesProps> = ({
  assignedSensorTypes
}) => {
  const { t } = useLanguage();

  if (assignedSensorTypes.length === 0) return null;

  return (
    <div>
      <h4 className="text-lg font-bold text-orange-500 font-mono tracking-wider mb-4">
        {t('umbral.assigned_sensor_types')}
      </h4>
      
      <div className="bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg p-4 max-h-96 overflow-y-auto custom-scrollbar">
        <div className="space-y-2">
          {assignedSensorTypes.map((tipo) => (
            <div key={tipo.tipoid} className="flex items-center justify-between px-3 py-2 bg-gray-100 dark:bg-neutral-800 rounded">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-orange-500 rounded mr-3 flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span className="text-gray-900 dark:text-white text-sm font-mono tracking-wider">
                  {tipo.tipo.toUpperCase()}
                </span>
              </div>
              <svg 
                className="w-5 h-5 text-gray-400 dark:text-neutral-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-label="Solo lectura"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
                />
              </svg>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

