// ============================================================================
// GRUPO FORM
// ============================================================================
// Formulario unificado para crear/actualizar grupo con localizaciones

import React, { useMemo } from 'react';
import { MultiSelectWithPlaceholder } from '../../../selectors';
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

  // Crear un mapa de valor de opción -> todos los IDs que representa
  const valueToIdsMap = useMemo(() => {
    const map = new Map<any, number[]>();
    localizacionesOptions.forEach((opt: any) => {
      if (opt._allIds) {
        map.set(opt.value, opt._allIds);
      }
    });
    return map;
  }, [localizacionesOptions]);

  // Crear un mapa inverso: IDs -> índice de opción (para mostrar cuáles están seleccionadas)
  const idsToValueMap = useMemo(() => {
    const map = new Map<number, any>();
    localizacionesOptions.forEach((opt: any) => {
      if (opt._allIds && Array.isArray(opt._allIds)) {
        // Mapear el primer ID de cada grupo para identificar la opción seleccionada
        // Así el selector sabe qué opciones mostrar como seleccionadas
        opt._allIds.forEach((id: number) => {
          map.set(id, opt.value);
        });
      }
    });
    return map;
  }, [localizacionesOptions]);

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

  // Convertir los IDs actuales a sus valores de opción correspondientes para que el selector muestre qué está seleccionado
  const selectedOptionValues = useMemo(() => {
    const selected = new Set<any>();
    formData.localizacionids.forEach((id: number) => {
      const optionValue = idsToValueMap.get(id);
      if (optionValue !== undefined) {
        selected.add(optionValue);
      }
    });
    return Array.from(selected);
  }, [formData.localizacionids, idsToValueMap]);

  return (
    <div className="space-y-6">
      {/* 1. Nombre del grupo */}
      <div>
        <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${theme.text}`}>
          GRUPO*
        </label>
        <input
          type="text"
          value={formData.entidad || ''}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, entidad: e.target.value }))
          }
          placeholder="GRUPO"
          className={`w-full px-3 py-2 bg-neutral-800 border rounded-lg text-white text-base font-mono ${theme.focus} border-neutral-600`}
          disabled={loading}
        />
      </div>

      {/* 2. Localizaciones del grupo */}
      <div>
        <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${theme.text}`}>
          LOCALIZACIÓN DE GRUPO*
        </label>
        <MultiSelectWithPlaceholder
          value={selectedOptionValues}
          onChange={(selectedValues) => {
            // Los valores seleccionados son los índices de las opciones (0, 1, 2, etc.)
            // Necesitamos mapearlos a todos los localizacionids correspondientes
            const allLocalizacionids = new Set<number>();
            
            selectedValues.forEach((v: any) => {
              // Buscar en el mapa si este valor representa múltiples IDs
              const ids = valueToIdsMap.get(v);
              if (ids && Array.isArray(ids)) {
                ids.forEach((id: number) => allLocalizacionids.add(id));
              }
            });
            
            setFormData((prev) => ({ 
              ...prev, 
              localizacionids: Array.from(allLocalizacionids).sort((a, b) => a - b)
            }))
          }}
          options={localizacionesOptions}
          placeholder="SELECCIONAR LOCALIZACIONES"
          disabled={loading}
          className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-lg text-white text-base font-mono focus:ring-2 focus:ring-green-500 focus:border-green-500"
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
