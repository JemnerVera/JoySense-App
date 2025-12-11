/**
 * Formulario especializado para crear permisos geográficos
 * Diseño intuitivo con selección de perfil, geografía y permisos
 */

import React, { useState, useEffect, useMemo } from 'react';
import SelectWithPlaceholder from './SelectWithPlaceholder';
import { useLanguage } from '../contexts/LanguageContext';

interface PerfilGeografiaPermisoFormProps {
  formData: Record<string, any>;
  setFormData: (data: Record<string, any>) => void;
  updateFormField?: (field: string, value: any) => void;
  loading: boolean;
  onInsert: () => void;
  onCancel: () => void;
  // Datos relacionados
  perfilesData?: any[];
  paisesData?: any[];
  empresasData?: any[];
  fundosData?: any[];
  ubicacionesData?: any[];
  // Funciones auxiliares
  getUniqueOptionsForField?: (columnName: string) => Array<{value: any, label: string}>;
  // Tema de color
  themeColor?: 'orange' | 'red' | 'blue' | 'green';
}

type GeografiaType = 'pais' | 'empresa' | 'fundo' | 'ubicacion' | null;

const PerfilGeografiaPermisoForm: React.FC<PerfilGeografiaPermisoFormProps> = ({
  formData,
  setFormData,
  updateFormField,
  loading,
  onInsert,
  onCancel,
  perfilesData = [],
  paisesData = [],
  empresasData = [],
  fundosData = [],
  ubicacionesData = [],
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
  
  // Estado local para el tipo de geografía seleccionado
  const [geografiaType, setGeografiaType] = useState<GeografiaType>(null);
  
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

  // Determinar el tipo de geografía basado en los datos del formulario
  useEffect(() => {
    if (formData.paisid) {
      setGeografiaType('pais');
    } else if (formData.empresaid) {
      setGeografiaType('empresa');
    } else if (formData.fundoid) {
      setGeografiaType('fundo');
    } else if (formData.ubicacionid) {
      setGeografiaType('ubicacion');
    } else {
      setGeografiaType(null);
    }
  }, [formData.paisid, formData.empresaid, formData.fundoid, formData.ubicacionid]);

  // Limpiar otros campos de geografía cuando se selecciona un tipo
  const handleGeografiaTypeChange = (type: GeografiaType) => {
    setGeografiaType(type);
    const newData = { ...formData };
    
    // Limpiar todos los campos de geografía
    delete newData.paisid;
    delete newData.empresaid;
    delete newData.fundoid;
    delete newData.ubicacionid;
    
    setFormData(newData);
    if (updateFormField) {
      updateFormField('paisid', null);
      updateFormField('empresaid', null);
      updateFormField('fundoid', null);
      updateFormField('ubicacionid', null);
    }
  };

  // Handler para cambio de perfil - limpiar geografía y permisos
  const handlePerfilChange = (value: any) => {
    const newData: Record<string, any> = { ...formData, perfilid: value };
    
    // Limpiar geografía cuando cambia el perfil
    delete newData.paisid;
    delete newData.empresaid;
    delete newData.fundoid;
    delete newData.ubicacionid;
    
    setFormData(newData);
    if (updateFormField) {
      updateFormField('perfilid', value);
      updateFormField('paisid', null);
      updateFormField('empresaid', null);
      updateFormField('fundoid', null);
      updateFormField('ubicacionid', null);
    }
    
    // Resetear tipo de geografía
    setGeografiaType(null);
  };

  // Opciones para el combobox de geografía
  const geografiaOptions = useMemo(() => [
    { value: 'pais', label: 'País' },
    { value: 'empresa', label: 'Empresa' },
    { value: 'fundo', label: 'Fundo' },
    { value: 'ubicacion', label: 'Ubicación' }
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

  // Opciones para el combobox dinámico según la geografía seleccionada
  const geografiaOptionsDynamic = useMemo(() => {
    if (!geografiaType) return [];
    
    switch (geografiaType) {
      case 'pais':
        if (getUniqueOptionsForField) {
          return getUniqueOptionsForField('paisid');
        }
        return paisesData.map(p => ({
          value: p.paisid,
          label: p.pais || `País ${p.paisid}`
        }));
      case 'empresa':
        if (getUniqueOptionsForField) {
          return getUniqueOptionsForField('empresaid');
        }
        return empresasData.map(e => ({
          value: e.empresaid,
          label: e.empresa || `Empresa ${e.empresaid}`
        }));
      case 'fundo':
        if (getUniqueOptionsForField) {
          return getUniqueOptionsForField('fundoid');
        }
        return fundosData.map(f => ({
          value: f.fundoid,
          label: f.fundo || `Fundo ${f.fundoid}`
        }));
      case 'ubicacion':
        if (getUniqueOptionsForField) {
          return getUniqueOptionsForField('ubicacionid');
        }
        return ubicacionesData.map(u => ({
          value: u.ubicacionid,
          label: u.ubicacion || `Ubicación ${u.ubicacionid}`
        }));
      default:
        return [];
    }
  }, [geografiaType, paisesData, empresasData, fundosData, ubicacionesData, getUniqueOptionsForField]);

  // Handler para cambiar el valor de geografía dinámico
  const handleGeografiaValueChange = (value: any) => {
    if (!geografiaType) return;
    
    const newData = { ...formData };
    
    // Limpiar todos los campos de geografía primero
    delete newData.paisid;
    delete newData.empresaid;
    delete newData.fundoid;
    delete newData.ubicacionid;
    
    // Establecer el campo correspondiente
    switch (geografiaType) {
      case 'pais':
        newData.paisid = value;
        break;
      case 'empresa':
        newData.empresaid = value;
        break;
      case 'fundo':
        newData.fundoid = value;
        break;
      case 'ubicacion':
        newData.ubicacionid = value;
        break;
    }
    
    // Asegurar que statusid tenga valor por defecto
    if (!newData.statusid) {
      newData.statusid = 1;
    }
    
    setFormData(newData);
    if (updateFormField) {
      const fieldName = `${geografiaType}id`;
      updateFormField(fieldName, value);
      if (!formData.statusid) {
        updateFormField('statusid', 1);
      }
    }
  };

  // Obtener el valor actual de la geografía seleccionada
  const getCurrentGeografiaValue = () => {
    if (!geografiaType) return null;
    switch (geografiaType) {
      case 'pais':
        return formData.paisid || null;
      case 'empresa':
        return formData.empresaid || null;
      case 'fundo':
        return formData.fundoid || null;
      case 'ubicacion':
        return formData.ubicacionid || null;
      default:
        return null;
    }
  };

  // Handler para checkboxes
  const handleCheckboxChange = (field: string, checked: boolean) => {
    const newData = { ...formData, [field]: checked };
    setFormData(newData);
    if (updateFormField) {
      updateFormField(field, checked);
    }
  };


  // Determinar si los campos están habilitados según la cascada
  const isPerfilEnabled = true; // Siempre habilitado
  const isGeografiaEnabled = !!formData.perfilid;
  const isGeografiaValueEnabled = !!formData.perfilid && !!geografiaType;
  const isPermisosEnabled = !!formData.perfilid && !!geografiaType && !!getCurrentGeografiaValue();
  const isStatusEnabled = !!formData.perfilid && !!geografiaType && !!getCurrentGeografiaValue();

  return (
    <div className="bg-gray-100 dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-xl p-6">
      <div className="space-y-6">
        {/* Fila 1: PERFIL y GEOGRAFÍA */}
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

          {/* Tipo de Geografía */}
          <div>
            <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${
              isGeografiaEnabled ? getThemeColor('text') : 'text-gray-500'
            }`}>
              GEOGRAFÍA *
            </label>
            <SelectWithPlaceholder
              value={geografiaType || ''}
              onChange={(value) => handleGeografiaTypeChange(value as GeografiaType)}
              options={geografiaOptions}
              placeholder="GEOGRAFÍA"
              disabled={!isGeografiaEnabled}
            />
          </div>
        </div>

        {/* Fila 2: Combobox dinámico de geografía + Checkboxes */}
        {geografiaType && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Combobox dinámico según geografía seleccionada */}
            <div>
              <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${
                isGeografiaValueEnabled ? getThemeColor('text') : 'text-gray-500'
              }`}>
                {geografiaType === 'pais' ? 'PAÍS' : 
                 geografiaType === 'empresa' ? 'EMPRESA' :
                 geografiaType === 'fundo' ? 'FUNDO' : 'UBICACIÓN'} *
              </label>
              <SelectWithPlaceholder
                value={getCurrentGeografiaValue() || ''}
                onChange={handleGeografiaValueChange}
                options={geografiaOptionsDynamic}
                placeholder={geografiaType === 'pais' ? 'PAÍS' : 
                                         geografiaType === 'empresa' ? 'EMPRESA' :
                                         geografiaType === 'fundo' ? 'FUNDO' : 'UBICACIÓN'}
                disabled={!isGeografiaValueEnabled}
              />
            </div>

            {/* Checkboxes de permisos */}
            <div>
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
            disabled={loading || !formData.perfilid || !geografiaType || !getCurrentGeografiaValue()}
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

export default PerfilGeografiaPermisoForm;
