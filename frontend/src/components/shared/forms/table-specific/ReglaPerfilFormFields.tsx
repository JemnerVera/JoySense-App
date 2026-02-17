// ============================================================================
// REGLA PERFIL FORM FIELDS
// ============================================================================
// Componente específico para renderizar campos del formulario de ReglaPerfil

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { getColumnDisplayNameTranslated } from '../../../../utils/systemParametersUtils';
import { SelectWithPlaceholder, DualListbox } from '../../../selectors';

interface ReglaPerfilFormFieldsProps {
  visibleColumns: any[];
  formData: Record<string, any>;
  setFormData: (data: Record<string, any>) => void;
  renderField: (col: any) => React.ReactNode;
  getThemeColor: (type: 'text' | 'bg' | 'hover' | 'focus' | 'border') => string;
  getUniqueOptionsForField?: (columnName: string) => Array<{value: any, label: string}>;
  reglasData?: any[]; // Datos de reglas disponibles
  perfilesData?: any[]; // Datos de perfiles disponibles
  existingPerfiles?: any[]; // Para modo UPDATE: perfiles existentes de la regla
  isUpdateMode?: boolean; // Si es true, estamos en modo UPDATE
}

export const ReglaPerfilFormFields: React.FC<ReglaPerfilFormFieldsProps> = ({
  visibleColumns,
  formData,
  setFormData,
  renderField,
  getThemeColor,
  getUniqueOptionsForField,
  reglasData = [],
  perfilesData = [],
  existingPerfiles = [],
  isUpdateMode = false
}) => {
  const { t } = useLanguage();

  // Obtener el campo reglaid
  const reglaidField = visibleColumns.find(c => c.columnName === 'reglaid');
  const reglaid = formData.reglaid;

  // Obtener opciones de reglas
  const reglaOptions = useMemo(() => {
    if (!getUniqueOptionsForField) return [];
    return getUniqueOptionsForField('reglaid');
  }, [getUniqueOptionsForField, reglasData]);

  // Filtrar perfiles activos
  const perfilesActivos = useMemo(() => {
    return perfilesData.filter((p: any) => p.statusid === 1);
  }, [perfilesData]);

  // Convertir perfiles a opciones para DualListbox
  const perfilesOptions = useMemo(() => {
    return perfilesActivos.map((perfil: any) => ({
      value: perfil.perfilid,
      label: perfil.perfil || `Perfil ${perfil.perfilid}`
    }));
  }, [perfilesActivos]);

  // Obtener perfiles seleccionados del formData o de existingPerfiles
  const selectedPerfiles = useMemo(() => {
    if (formData._perfilesSeleccionados && Array.isArray(formData._perfilesSeleccionados)) {
      return formData._perfilesSeleccionados;
    }
    if (isUpdateMode && existingPerfiles.length > 0) {
      return existingPerfiles.map((p: any) => p.perfilid);
    }
    return [];
  }, [formData._perfilesSeleccionados, existingPerfiles, isUpdateMode]);

  return (
    <div>
      {/* Campo REGLA con SelectWithPlaceholder */}
      {reglaidField && (
        <div className="mb-6">
          <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
            {getColumnDisplayNameTranslated('reglaid', t)?.toUpperCase() || 'REGLA'}{reglaidField.required ? '*' : ''}
          </label>
          <SelectWithPlaceholder
            value={reglaid || null}
            onChange={(value) => {
              setFormData({
                ...formData,
                reglaid: value ? Number(value) : null
              });
            }}
            options={reglaOptions}
            placeholder={`${t('buttons.select')} REGLA`}
            themeColor="orange"
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded text-neutral-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-mono"
          />
        </div>
      )}

      {/* DualListbox de perfiles (solo se muestra si hay una regla seleccionada) */}
      {reglaid && perfilesActivos.length > 0 && (
        <div className="mb-6">
          <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
            PERFILES
          </label>
          <div className="border border-neutral-600 rounded-lg p-4 bg-neutral-800/50">
            <DualListbox
              value={selectedPerfiles}
              onChange={(perfiles) =>
                setFormData((prev: Record<string, any>) => ({
                  ...prev,
                  _perfilesSeleccionados: perfiles
                }))
              }
              options={perfilesOptions}
              placeholder="SELECCIONAR PERFILES"
              canFilter={true}
              themeColor="orange"
              availableLabel="DISPONIBLES"
              selectedLabel="SELECCIONADOS"
            />
          </div>
        </div>
      )}

      {/* Mensaje cuando no hay regla seleccionada */}
      {!reglaid && (
        <div className="mb-6 p-4 bg-gray-100 dark:bg-neutral-800 rounded-lg border border-gray-300 dark:border-neutral-600">
          <p className="text-gray-600 dark:text-neutral-400 font-mono text-sm text-center">
            Selecciona una regla para ver los perfiles disponibles
          </p>
        </div>
      )}

      {/* Renderizar otros campos que no sean los especiales */}
      {(() => {
        const specialFields = ['reglaid', 'perfilid', 'statusid'];
        const otherFields = visibleColumns.filter(c => !specialFields.includes(c.columnName));
        return otherFields.map(col => renderField(col));
      })()}
    </div>
  );
};

