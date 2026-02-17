// ============================================================================
// GRUPO FORM
// ============================================================================
// Formulario unificado para crear/actualizar grupo con localizaciones

import React from 'react';
import { DualListbox } from '../../../selectors';
import { useLanguage } from '../../../../contexts/LanguageContext';

export interface GrupoFormData {
  entidad: string;
  localizacionids: number[];
  entidadid?: number; // Para modo actualizar
}

interface GrupoFormProps {
  formData: GrupoFormData;
  setFormData: (data: GrupoFormData | ((prev: GrupoFormData) => GrupoFormData)) => void;
  localizacionesOptions: Array<{ value: any; label: string; _allIds?: number[] }>;
  loading?: boolean;
  onSave: () => void;
  onCancel: () => void;
  isUpdate?: boolean;
  themeColor?: 'green' | 'orange';
}

const GrupoForm: React.FC<GrupoFormProps> = ({
  formData,
  setFormData,
  localizacionesOptions,
  loading = false,
  onSave,
  onCancel,
  isUpdate = false,
  themeColor = 'green'
}) => {
  const { t } = useLanguage();

  const themeClasses = {
    green: {
      text: 'text-green-500',
      focus: 'focus:ring-green-500 focus:border-green-500',
      button: 'bg-green-600 hover:bg-green-700'
    },
    orange: {
      text: 'text-orange-500',
      focus: 'focus:ring-orange-500 focus:border-orange-500',
      button: 'bg-orange-600 hover:bg-orange-700'
    }
  };

  const theme = themeClasses[themeColor];
  const isFormValid = (formData.entidad || '').trim().length > 0;

  return (
    <div className="space-y-6">
      {/* 1. Nombre del grupo */}
      <div>
        <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${theme.text}`}>
CARPETA PERSONAL*
        </label>
        <input
          type="text"
          value={formData.entidad || ''}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, entidad: e.target.value }))
          }
          placeholder="CARPETA PERSONAL"
          className={`w-1/3 px-3 py-2 bg-neutral-800 border rounded-lg text-white text-base font-mono ${theme.focus} border-neutral-600`}
          disabled={loading}
        />
      </div>

      {/* 2. Localizaciones del grupo */}
      <div>
        <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${theme.text}`}>
          LOCALIZACIÓN DE GRUPO*
        </label>
        <DualListbox
          value={formData.localizacionids || []}
          onChange={(localizacionids) =>
            setFormData((prev) => ({ ...prev, localizacionids }))
          }
          options={localizacionesOptions}
          placeholder="SELECCIONAR LOCALIZACIONES"
          disabled={loading}
          canFilter={true}
          themeColor={themeColor}
          availableLabel="DISPONIBLES"
          selectedLabel="SELECCIONADOS"
        />
      </div>

      {/* Botones */}
      <div className="flex gap-4 justify-center pt-4">
        <button
          type="button"
          onClick={onSave}
          disabled={loading || !isFormValid}
          className={`px-8 py-2 rounded-lg font-mono font-bold tracking-wider text-white transition-colors ${
            loading || !isFormValid
              ? 'opacity-50 cursor-not-allowed bg-neutral-600'
              : `${theme.button}`
          }`}
        >
          {loading ? t('loading') || 'GUARDANDO...' : isUpdate ? t('update') || 'ACTUALIZAR' : t('save') || 'GUARDAR'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className={`px-8 py-2 rounded-lg font-mono font-bold tracking-wider text-white transition-colors ${
            loading 
              ? 'opacity-50 cursor-not-allowed bg-neutral-600'
              : `${theme.button}`
          }`}
        >
          {t('cancel') || 'CANCELAR'}
        </button>
      </div>
    </div>
  );
};

export default GrupoForm;
