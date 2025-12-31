/**
 * Componente Modal para mostrar el formulario de actualización
 * Overlay con formulario centrado
 */

import React from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { NormalUpdateForm } from './forms/NormalUpdateForm';
import type { TableConfig } from '../../../config/tables.config';
import type { RelatedData } from '../../../utils/systemParametersUtils';

interface UpdateFormModalProps {
  isOpen: boolean;
  formData: Record<string, any>;
  formErrors: Record<string, string>;
  isSubmitting: boolean;
  config: TableConfig | null;
  relatedData: RelatedData;
  updateFormField: (field: string, value: any) => void;
  handleUpdate: () => Promise<void>;
  handleCancel: () => void;
  visibleColumns?: any[];
  getColumnDisplayName?: (columnName: string) => string;
  themeColor?: 'orange' | 'red' | 'blue' | 'green' | 'purple' | 'cyan';
}

export const UpdateFormModal: React.FC<UpdateFormModalProps> = ({
  isOpen,
  formData,
  formErrors,
  isSubmitting,
  config,
  relatedData,
  updateFormField,
  handleUpdate,
  handleCancel,
  visibleColumns,
  getColumnDisplayName,
  themeColor = 'orange'
}) => {
  const { t } = useLanguage();
  
  // Helper para obtener clases de color según el tema
  const getThemeColor = (type: 'text' | 'bg' | 'hover' | 'focus' | 'border') => {
    const colors = {
      red: {
        text: 'text-red-500',
        bg: 'bg-red-500',
        hover: 'hover:bg-red-600',
        focus: 'focus:ring-red-500',
        border: 'border-red-500'
      },
      blue: {
        text: 'text-blue-500',
        bg: 'bg-blue-500',
        hover: 'hover:bg-blue-600',
        focus: 'focus:ring-blue-500',
        border: 'border-blue-500'
      },
      green: {
        text: 'text-green-500',
        bg: 'bg-green-500',
        hover: 'hover:bg-green-600',
        focus: 'focus:ring-green-500',
        border: 'border-green-500'
      },
      orange: {
        text: 'text-orange-500',
        bg: 'bg-orange-500',
        hover: 'hover:bg-orange-600',
        focus: 'focus:ring-orange-500',
        border: 'border-orange-500'
      },
      purple: {
        text: 'text-purple-500',
        bg: 'bg-purple-500',
        hover: 'hover:bg-purple-600',
        focus: 'focus:ring-purple-500',
        border: 'border-purple-500'
      },
      cyan: {
        text: 'text-cyan-500',
        bg: 'bg-cyan-500',
        hover: 'hover:bg-cyan-600',
        focus: 'focus:ring-cyan-500',
        border: 'border-cyan-500'
      }
    };
    return colors[themeColor]?.[type] || colors.orange[type];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-orange-500 text-white px-6 py-4 rounded-t-lg flex items-center justify-between">
          <h2 className="text-xl font-bold font-mono tracking-wider">
            ACTUALIZAR REGISTRO
          </h2>
          <button
            onClick={handleCancel}
            className="text-white hover:text-gray-200 transition-colors"
            disabled={isSubmitting}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Mensaje de error general */}
          {formErrors.general && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-400 text-red-700 dark:text-red-400 rounded">
              {formErrors.general}
            </div>
          )}

          {/* Formulario */}
          <NormalUpdateForm
            config={config}
            formData={formData}
            formErrors={formErrors}
            updateFormField={updateFormField}
            relatedData={relatedData}
            visibleColumns={visibleColumns}
            getColumnDisplayName={getColumnDisplayName}
            themeColor={themeColor}
          />
        </div>

        {/* Footer con botones */}
        <div className="sticky bottom-0 bg-gray-100 dark:bg-neutral-800 px-6 py-4 rounded-b-lg flex gap-3 justify-end border-t border-gray-300 dark:border-neutral-700">
          <button
            onClick={handleCancel}
            disabled={isSubmitting}
            className="px-6 py-2 bg-gray-300 dark:bg-neutral-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-400 dark:hover:bg-neutral-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
          <button
            onClick={handleUpdate}
            disabled={isSubmitting}
            className={`px-6 py-2 ${getThemeColor('bg')} text-white rounded-lg ${getThemeColor('hover')} disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
          >
            {isSubmitting ? 'Guardando...' : 'Actualizar'}
          </button>
        </div>
      </div>
    </div>
  );
};
