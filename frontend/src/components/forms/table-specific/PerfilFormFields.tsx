// ============================================================================
// PERFIL FORM FIELDS
// ============================================================================
// Componente específico para renderizar campos del formulario de Perfil

import React from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import SelectWithPlaceholder from '../../selectors/SelectWithPlaceholder';
import { getColumnDisplayNameTranslated } from '../../../utils/systemParametersUtils';

interface PerfilFormFieldsProps {
  visibleColumns: any[];
  formData: Record<string, any>;
  setFormData: (data: Record<string, any>) => void;
  renderField: (col: any) => React.ReactNode;
  getThemeColor: (type: 'text' | 'bg' | 'hover' | 'focus' | 'border') => string;
  getUniqueOptionsForField?: (columnName: string) => Array<{value: any, label: string}>;
}

export const PerfilFormFields: React.FC<PerfilFormFieldsProps> = ({
  visibleColumns,
  formData,
  setFormData,
  renderField,
  getThemeColor,
  getUniqueOptionsForField
}) => {
  const { t } = useLanguage();

  const result: React.ReactNode[] = [];

  // Fila 1: PERFIL, NIVEL, JEFE (3 elementos por fila)
  const perfilField = visibleColumns.find(c => c.columnName === 'perfil');
  const nivelField = visibleColumns.find(c => c.columnName === 'nivel');
  const jefeField = visibleColumns.find(c => c.columnName === 'jefeid');
  
  result.push(
    <div key="perfil-nivel-jefe-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      {/* PERFIL */}
      {perfilField && renderField(perfilField)}
      
      {/* NIVEL */}
      {nivelField && (
        <div className="mb-4">
          <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
            NIVEL*
          </label>
          {/* Combobox para nivel (1-10) con formato "nivel - PERFIL" */}
          {(() => {
            const nivelOptions = Array.from({ length: 10 }, (_, i) => {
              const nivel = i + 1; // 1 al 10
              const perfilNombre = formData.perfil || 'PERFIL';
              return {
                value: nivel,
                label: `${nivel} - ${perfilNombre}`
              };
            });
            
            const selectedNivel = formData.nivel !== null && formData.nivel !== undefined ? Number(formData.nivel) : null;
            const perfilNombre = formData.perfil || 'PERFIL';
            const placeholderText = selectedNivel ? `${selectedNivel} - ${perfilNombre}` : 'SELECCIONAR NIVEL';
            
            return (
              <SelectWithPlaceholder
                value={selectedNivel}
                onChange={(newValue) => {
                  const parsedValue = newValue !== null && newValue !== undefined ? parseInt(newValue.toString()) : null;
                  setFormData({
                    ...formData,
                    nivel: parsedValue
                  });
                }}
                options={nivelOptions}
                placeholder={placeholderText}
                themeColor="orange"
              />
            );
          })()}
        </div>
      )}
      
      {/* JEFE */}
      {jefeField && (
        <div className="mb-4">
          {(() => {
            const options = getUniqueOptionsForField 
              ? getUniqueOptionsForField('jefeid')
              : [];
            const displayName = getColumnDisplayNameTranslated('jefeid', t) || 'Jefe';
            
            return (
              <>
                <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
                  {displayName.toUpperCase()}
                </label>
                <SelectWithPlaceholder
                  value={formData.jefeid || null}
                  onChange={(newValue) => {
                    const parsedValue = newValue ? parseInt(newValue.toString()) : null;
                    setFormData({
                      ...formData,
                      jefeid: parsedValue
                    });
                  }}
                  options={options}
                  placeholder={t('create.select_boss') || 'SELECCIONAR JEFE'}
                  themeColor="orange"
                />
              </>
            );
          })()}
        </div>
      )}
    </div>
  );

  // Fila 2: ES ADMIN GLOBAL? y STATUS (STATUS al extremo derecho)
  const isAdminGlobalField = visibleColumns.find(c => c.columnName === 'is_admin_global');
  const statusField = visibleColumns.find(c => c.columnName === 'statusid');
  
  if (isAdminGlobalField || statusField) {
    result.push(
      <div key="admin-status-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* ES ADMIN GLOBAL? - Primera columna */}
        {isAdminGlobalField && (
          <div>
            <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
              ES ADMIN GLOBAL?
            </label>
            {(() => {
              const isChecked = formData.is_admin_global === true || formData.is_admin_global === 'true' || formData.is_admin_global === 1;
              const currentValue = isChecked ? true : false;
              const themeBgColor = 'bg-orange-500';
              const themeTextColor = 'text-orange-500';
              
              return (
                <div className="flex items-center space-x-4">
                  {/* Toggle Switch con animación */}
                  <div
                    onClick={() => {
                      setFormData({
                        ...formData,
                        is_admin_global: !currentValue
                      });
                    }}
                    className={`relative inline-flex h-10 w-20 cursor-pointer items-center rounded-full transition-colors duration-300 ease-in-out ${
                      currentValue
                        ? themeBgColor
                        : 'bg-gray-300 dark:bg-neutral-700'
                    }`}
                    role="switch"
                    aria-checked={currentValue}
                  >
                    {/* Slider (círculo que se desliza) */}
                    <span
                      className={`inline-block h-8 w-8 transform rounded-full bg-white shadow-lg transition-transform duration-300 ease-in-out ${
                        currentValue ? 'translate-x-11' : 'translate-x-1'
                      }`}
                    />
                  </div>
                  
                  {/* Etiqueta de texto (solo una a la vez) */}
                  <div className="relative h-6 w-8 overflow-hidden">
                    <span
                      className={`absolute font-mono text-sm font-bold transition-all duration-300 ease-in-out ${
                        currentValue
                          ? `${themeTextColor} translate-x-0 opacity-100`
                          : 'text-gray-500 dark:text-neutral-400 -translate-x-full opacity-0'
                      }`}
                    >
                      SÍ
                    </span>
                    <span
                      className={`absolute font-mono text-sm font-bold transition-all duration-300 ease-in-out ${
                        !currentValue
                          ? `${themeTextColor} translate-x-0 opacity-100`
                          : 'text-gray-500 dark:text-neutral-400 translate-x-full opacity-0'
                      }`}
                    >
                      NO
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
        
        {/* Columna vacía para empujar STATUS a la derecha */}
        <div></div>
        
        {/* STATUS - Tercera columna (extremo derecho) */}
        {statusField && (
          <div>
            <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
              {getColumnDisplayNameTranslated('statusid', t)?.toUpperCase() || 'ESTADO'}
            </label>
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={formData.statusid === 1}
                onChange={(e) => {
                  setFormData({
                    ...formData,
                    statusid: e.target.checked ? 1 : 0
                  });
                }}
                className={`w-5 h-5 ${getThemeColor('text')} bg-neutral-800 border-neutral-600 rounded focus:ring-2 ${getThemeColor('focus')}`}
              />
              <span className="text-white font-mono tracking-wider">
                {formData.statusid === 1 ? t('create.active') : t('create.inactive')}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Renderizar otros campos que no sean los especiales
  const specialFields = ['perfil', 'nivel', 'jefeid', 'is_admin_global', 'statusid'];
  const otherFields = visibleColumns.filter(c => !specialFields.includes(c.columnName));
  
  otherFields.forEach(col => {
    result.push(renderField(col));
  });

  return <>{result}</>;
};

