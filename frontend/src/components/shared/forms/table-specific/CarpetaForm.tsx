// ============================================================================
// CARPETA FORM
// ============================================================================
// Formulario unificado para crear/actualizar carpeta con ubicaciones y usuarios

import React from 'react';
import { MultiSelectWithPlaceholder } from '../../../selectors';
import { useLanguage } from '../../../../contexts/LanguageContext';

export interface CarpetaFormData {
  carpeta: string;
  ubicacionids: number[];
  usuarioids: number[];
  carpetaid?: number; // Para modo actualizar
}

interface CarpetaFormProps {
  formData: CarpetaFormData;
  setFormData: (data: CarpetaFormData | ((prev: CarpetaFormData) => CarpetaFormData)) => void;
  ubicacionesOptions: Array<{ value: any; label: string }>;
  usuariosOptions: Array<{ value: any; label: string }>;
  loading?: boolean;
  onSave: () => void;
  onCancel: () => void;
  isUpdate?: boolean;
  themeColor?: 'green' | 'orange';
}

const CarpetaForm: React.FC<CarpetaFormProps> = ({
  formData,
  setFormData,
  ubicacionesOptions,
  usuariosOptions,
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
  const isFormValid = (formData.carpeta || '').trim().length > 0;

  return (
    <div className="space-y-6">
      {/* 1. Nombre de carpeta */}
      <div>
        <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${theme.text}`}>
          NOMBRE DE CARPETA *
        </label>
        <input
          type="text"
          value={formData.carpeta || ''}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, carpeta: e.target.value }))
          }
          placeholder="NOMBRE DE LA CARPETA"
          className={`w-full px-3 py-2 bg-neutral-800 border rounded-lg text-white text-base font-mono ${theme.focus} border-neutral-600`}
          disabled={loading}
        />
      </div>

      {/* 2. Ubicaciones disponibles por geografía */}
      <div>
        <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${theme.text}`}>
          UBICACIONES
        </label>
        <p className="text-sm text-neutral-400 mb-2 font-mono">
          Seleccione las ubicaciones disponibles según su geografía
        </p>
        <MultiSelectWithPlaceholder
          value={formData.ubicacionids || []}
          onChange={(value) =>
            setFormData((prev) => ({ ...prev, ubicacionids: value }))
          }
          options={ubicacionesOptions}
          placeholder="SELECCIONAR UBICACIONES"
          disabled={loading}
          className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-lg text-white text-base font-mono focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
      </div>

      {/* 3. Usuarios con permisos para la geografía */}
      <div>
        <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${theme.text}`}>
          USUARIOS
        </label>
        <p className="text-sm text-neutral-400 mb-2 font-mono">
          Usuarios con permisos para la geografía de las ubicaciones seleccionadas
        </p>
        <MultiSelectWithPlaceholder
          value={formData.usuarioids || []}
          onChange={(value) =>
            setFormData((prev) => ({ ...prev, usuarioids: value }))
          }
          options={usuariosOptions}
          placeholder="SELECCIONAR USUARIOS"
          disabled={loading}
          className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-lg text-white text-base font-mono focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
      </div>

      {/* Botones */}
      <div className="flex gap-4 pt-4">
        <button
          type="button"
          onClick={onSave}
          disabled={loading || !isFormValid}
          className={`px-6 py-2 rounded-lg font-mono font-bold tracking-wider text-white transition-colors ${
            loading || !isFormValid
              ? 'opacity-50 cursor-not-allowed bg-neutral-600'
              : `${theme.button}`
          }`}
        >
          {loading ? t('common.loading') || 'GUARDANDO...' : isUpdate ? t('common.update') || 'ACTUALIZAR' : t('common.save') || 'GUARDAR'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-6 py-2 rounded-lg font-mono font-bold tracking-wider bg-neutral-700 hover:bg-neutral-600 text-white border border-neutral-600 transition-colors disabled:opacity-50"
        >
          {t('common.cancel') || 'CANCELAR'}
        </button>
      </div>
    </div>
  );
};

export default CarpetaForm;
