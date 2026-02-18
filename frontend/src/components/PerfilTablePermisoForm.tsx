/**
 * Formulario especializado para crear permisos de configuración (TABLA)
 * Diseño intuitivo con selección de perfil, tabla y permisos
 * SIN necesidad de especificar objeto específico (sin objetoid)
 */

import React, { useState, useEffect, useMemo } from 'react';
import { SelectWithPlaceholder } from './selectors';
import { useLanguage } from '../contexts/LanguageContext';

interface PerfilTablePermisoFormProps {
  formData: Record<string, any>;
  setFormData: (data: Record<string, any>) => void;
  updateFormField?: (field: string, value: any) => void;
  loading: boolean;
  onInsert: () => void;
  onCancel: () => void;
  // Datos relacionados
  perfilesData?: any[];
  fuentesData?: any[];
  origenesData?: any[];
  // Funciones auxiliares
  getUniqueOptionsForField?: (columnName: string) => Array<{value: any, label: string}>;
  // Tema de color
  themeColor?: 'orange' | 'red' | 'blue' | 'green';
}

type TablaType = 'sensor' | 'usuario' | 'perfil' | 'tipo' | 'metrica' | 'entidad' | 'regla' | null;

const PerfilTablePermisoForm: React.FC<PerfilTablePermisoFormProps> = ({
  formData,
  setFormData,
  updateFormField,
  loading,
  onInsert,
  onCancel,
  perfilesData = [],
  fuentesData = [],
  origenesData = [],
  getUniqueOptionsForField,
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
      }
    };
    return colors[themeColor]?.[type] || colors.orange[type];
  };
  
  // Estado local para el tipo de tabla seleccionado
  const [tablaType, setTablaType] = useState<TablaType>(null);
  
  // Helper para obtener origenid de TABLA
  const getTablaOrigenId = useMemo(() => {
    return origenesData.find(o => {
      const nombre = (o.origen || '').toUpperCase().trim();
      return nombre === 'TABLA';
    })?.origenid || null;
  }, [origenesData]);

  // Helper para obtener fuenteid según el tipo de tabla
  const getFuenteIdByType = (type: TablaType): number | null => {
    if (!type) return null;
    const fuente = fuentesData.find(f => 
      f.fuente?.toLowerCase() === type.toLowerCase()
    );
    console.log(`🔍 [PerfilTablePermisoForm] getFuenteIdByType(${type}):`, {
      fuentesData: fuentesData,
      found: fuente,
      fuenteid: fuente?.fuenteid
    });
    return fuente?.fuenteid || null;
  };
  
  // Inicializar valores por defecto
  useEffect(() => {
    if (!formData.puede_ver && formData.puede_ver !== false) {
      const newData = { ...formData, puede_ver: true };
      setFormData(newData);
      if (updateFormField) {
        updateFormField('puede_ver', true);
      }
    }
    if (formData.puede_insertar === undefined) {
      const newData = { ...formData, puede_insertar: false };
      setFormData(newData);
      if (updateFormField) {
        updateFormField('puede_insertar', false);
      }
    }
    if (formData.puede_actualizar === undefined) {
      const newData = { ...formData, puede_actualizar: false };
      setFormData(newData);
      if (updateFormField) {
        updateFormField('puede_actualizar', false);
      }
    }
    if (!formData.statusid) {
      const newData = { ...formData, statusid: 1 };
      setFormData(newData);
      if (updateFormField) {
        updateFormField('statusid', 1);
      }
    }
  }, []); // Solo al montar

  // Cambiar tipo de tabla y establecer origenid y fuenteid
  const handleTablaTypeChange = (type: TablaType) => {
    console.log('✏️ [PerfilTablePermisoForm] handleTablaTypeChange:', type);
    setTablaType(type);
    const newData = { ...formData };
    
    // Establecer origenid (TABLA) si aún no está establecido
    if (!newData.origenid && getTablaOrigenId) {
      newData.origenid = getTablaOrigenId;
      console.log('📌 Set origenid:', getTablaOrigenId);
    }
    
    // Establecer fuenteid según el tipo
    if (type) {
      const fuenteId = getFuenteIdByType(type);
      if (fuenteId) {
        newData.fuenteid = fuenteId;
        console.log('📌 Set fuenteid:', fuenteId);
      } else {
        console.warn('⚠️ No fuenteid found for type:', type);
      }
    }
    
    // NO establecer objetoid (no se usa en permisos config)
    
    setFormData(newData);
    if (updateFormField) {
      if (!formData.origenid && getTablaOrigenId) {
        updateFormField('origenid', getTablaOrigenId);
      }
      if (type) {
        const fuenteId = getFuenteIdByType(type);
        if (fuenteId) {
          updateFormField('fuenteid', fuenteId);
        }
      }
    }
  };

  // Opciones para el combobox de tabla
  const tablaOptions = useMemo(() => [
    { value: 'sensor', label: 'Sensor' },
    { value: 'usuario', label: 'Usuario' },
    { value: 'perfil', label: 'Perfil' },
    { value: 'tipo', label: 'Tipo' },
    { value: 'metrica', label: 'Métrica' },
    { value: 'entidad', label: 'Entidad' },
    { value: 'regla', label: 'Regla' }
  ], []);

  // Opciones para perfiles
  const perfilOptions = useMemo(() => {
    if (getUniqueOptionsForField) {
      return getUniqueOptionsForField('perfilid');
    }
    return perfilesData.map(p => ({
      value: p.perfilid,
      label: p.perfil || `Perfil ${p.perfilid}`
    }));
  }, [perfilesData, getUniqueOptionsForField]);


  // Handler para checkboxes
  const handleCheckboxChange = (field: string, checked: boolean) => {
    const newData = { ...formData, [field]: checked };
    setFormData(newData);
    if (updateFormField) {
      updateFormField(field, checked);
    }
  };

  // Handler para cambio de perfil - limpiar tabla
  const handlePerfilChange = (value: any) => {
    const newData: Record<string, any> = { ...formData, perfilid: value };
    
    // Mantener origenid si ya está establecido, o establecerlo
    if (!newData.origenid && getTablaOrigenId) {
      newData.origenid = getTablaOrigenId;
    }
    
    // Limpiar tabla seleccionada
    delete newData.fuenteid;
    
    setFormData(newData);
    if (updateFormField) {
      updateFormField('perfilid', value);
      if (!formData.origenid && getTablaOrigenId) {
        updateFormField('origenid', getTablaOrigenId);
      }
      updateFormField('fuenteid', null);
    }
    
    // Resetear tipo de tabla
    setTablaType(null);
  };

  // Determinar si los campos están habilitados según la cascada
  const isPerfilEnabled = true; // Siempre habilitado
  const isTablaEnabled = !!formData.perfilid;
  const isPermisosEnabled = !!formData.perfilid && !!tablaType;
  const isStatusEnabled = !!formData.perfilid && !!tablaType;

  return (
    <div className="bg-gray-100 dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-xl p-6">
      <div className="space-y-6">
        {/* Fila 1: PERFIL y TABLA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Perfil */}
          <div>
            <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${
              isPerfilEnabled ? getThemeColor('text') : 'text-gray-500'
            }`}>
              PERFIL *
            </label>
            <SelectWithPlaceholder
              value={formData.perfilid || ''}
              onChange={handlePerfilChange}
              options={perfilOptions}
              placeholder="PERFIL"
              disabled={!isPerfilEnabled}
            />
          </div>

          {/* Tipo de Tabla */}
          <div>
            <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${
              isTablaEnabled ? getThemeColor('text') : 'text-gray-500'
            }`}>
              TABLA *
            </label>
            <SelectWithPlaceholder
              value={tablaType || ''}
              onChange={(value) => handleTablaTypeChange(value as TablaType)}
              options={tablaOptions}
              placeholder="TABLA"
              disabled={!isTablaEnabled}
            />
          </div>
        </div>

        {/* Fila 2: Checkboxes de permisos */}
        {tablaType && (
          <div className="mb-6">
            <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${
              isPermisosEnabled ? 'text-orange-500' : 'text-gray-500'
            }`}>
              PERMISOS
            </label>
            <div className="space-y-3">
              <label className={`flex items-center space-x-3 ${isPermisosEnabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                <input
                  type="checkbox"
                  checked={formData.puede_ver ?? true}
                  disabled={!isPermisosEnabled}
                  onChange={(e) => {
                    if (isPermisosEnabled) {
                      handleCheckboxChange('puede_ver', e.target.checked);
                    }
                  }}
                  className={`w-5 h-5 ${getThemeColor('text')} bg-neutral-800 border-neutral-600 rounded ${getThemeColor('focus')} focus:ring-2 ${
                    !isPermisosEnabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                />
                <span className={`font-mono tracking-wider ${
                  isPermisosEnabled ? 'text-white' : 'text-gray-500'
                }`}>
                  PUEDE VER
                </span>
              </label>
              <label className={`flex items-center space-x-3 ${isPermisosEnabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                <input
                  type="checkbox"
                  checked={formData.puede_insertar ?? false}
                  disabled={!isPermisosEnabled}
                  onChange={(e) => {
                    if (isPermisosEnabled) {
                      handleCheckboxChange('puede_insertar', e.target.checked);
                    }
                  }}
                  className={`w-5 h-5 ${getThemeColor('text')} bg-neutral-800 border-neutral-600 rounded ${getThemeColor('focus')} focus:ring-2 ${
                    !isPermisosEnabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                />
                <span className={`font-mono tracking-wider ${
                  isPermisosEnabled ? 'text-white' : 'text-gray-500'
                }`}>
                  PUEDE INSERTAR
                </span>
              </label>
              <label className={`flex items-center space-x-3 ${isPermisosEnabled ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                <input
                  type="checkbox"
                  checked={formData.puede_actualizar ?? false}
                  disabled={!isPermisosEnabled}
                  onChange={(e) => {
                    if (isPermisosEnabled) {
                      handleCheckboxChange('puede_actualizar', e.target.checked);
                    }
                  }}
                  className={`w-5 h-5 ${getThemeColor('text')} bg-neutral-800 border-neutral-600 rounded ${getThemeColor('focus')} focus:ring-2 ${
                    !isPermisosEnabled ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                />
                <span className={`font-mono tracking-wider ${
                  isPermisosEnabled ? 'text-white' : 'text-gray-500'
                }`}>
                  PUEDE ACTUALIZAR
                </span>
              </label>
            </div>
          </div>
        )}

        {/* Fila 3: STATUS */}
        <div className="mb-4">
          <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${
            isStatusEnabled ? getThemeColor('text') : 'text-gray-500'
          }`}>
            STATUS
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={(formData.statusid ?? 1) === 1}
              disabled={!isStatusEnabled}
              onChange={(e) => {
                if (isStatusEnabled) {
                  const newData = { ...formData, statusid: e.target.checked ? 1 : 0 };
                  setFormData(newData);
                  if (updateFormField) {
                    updateFormField('statusid', e.target.checked ? 1 : 0);
                  }
                }
              }}
              className={`w-5 h-5 ${getThemeColor('text')} bg-neutral-800 border-neutral-600 rounded ${getThemeColor('focus')} focus:ring-2 ${
                !isStatusEnabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            />
            <span className={`font-mono tracking-wider ${
              isStatusEnabled ? 'text-white' : 'text-gray-500'
            }`}>
              {(formData.statusid ?? 1) === 1 ? 'ACTIVO' : 'INACTIVO'}
            </span>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center mt-6">
          <button
            onClick={onInsert}
            disabled={loading || !formData.perfilid || !tablaType}
            className={`px-6 py-2 ${getThemeColor('bg')} text-white rounded-lg ${getThemeColor('hover')} disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-mono tracking-wider`}
          >
            {loading ? 'Guardando...' : 'Crear'}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-2 bg-gray-200 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-700 transition-colors font-mono tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default PerfilTablePermisoForm;
