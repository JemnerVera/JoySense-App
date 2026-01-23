// ============================================================================
// USUARIO FORM FIELDS
// ============================================================================
// Componente específico para renderizar campos del formulario de Usuario

import React, { useMemo } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import MultiSelectWithPlaceholder from '../../selectors/MultiSelectWithPlaceholder';
import SelectWithPlaceholder from '../../selectors/SelectWithPlaceholder';

interface UsuarioFormFieldsProps {
  visibleColumns: any[];
  formData: Record<string, any>;
  setFormData: (data: Record<string, any>) => void;
  renderField: (col: any) => React.ReactNode;
  getThemeColor: (type: 'text' | 'bg' | 'hover' | 'focus' | 'border') => string;
  empresasData?: any[];
  getUniqueOptionsForField?: (columnName: string) => Array<{value: any, label: string}>;
}

export const UsuarioFormFields: React.FC<UsuarioFormFieldsProps> = ({
  visibleColumns,
  formData,
  setFormData,
  renderField,
  getThemeColor,
  empresasData = [],
  getUniqueOptionsForField
}) => {
  const { t } = useLanguage();

  const result: React.ReactNode[] = [];

  // Obtener opciones de empresas
  const empresaOptions = getUniqueOptionsForField 
    ? getUniqueOptionsForField('empresaid')
    : empresasData
        .filter((e: any) => e.statusid === 1)
        .map((e: any) => ({
          value: e.empresaid,
          label: e.empresa || `Empresa ${e.empresaid}`
        }));

  // Asegurar que empresas_ids sea un array y convertir a números para comparación
  const empresasIds = Array.isArray(formData.empresas_ids) 
    ? formData.empresas_ids.map(id => Number(id))
    : formData.empresas_ids 
      ? [Number(formData.empresas_ids)] 
      : [];
  
  // Obtener labels de las empresas seleccionadas para el placeholder
  // Comparar convirtiendo ambos valores a números para evitar problemas de tipo
  const empresasSeleccionadasLabels = empresaOptions
    .filter(opt => {
      const optValue = Number(opt.value);
      return empresasIds.includes(optValue);
    })
    .map(opt => opt.label);
  
  // Placeholder dinámico: mostrar empresas actuales si hay seleccionadas
  const placeholderText = empresasSeleccionadasLabels.length > 0
    ? empresasSeleccionadasLabels.join(', ')
    : 'Seleccione empresas';

  // Primera fila: Login, Contraseña
  const loginField = visibleColumns.find(c => c.columnName === 'login');
  result.push(
    <div key="login-password-row" className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      {loginField && renderField(loginField)}
      <div className="mb-4">
        <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
          CONTRASEÑA*
        </label>
        <input
          type="password"
          value={formData.password || ''}
          onChange={(e) => setFormData({
            ...formData,
            password: e.target.value
          })}
          className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white font-mono focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="••••••••"
        />
      </div>
    </div>
  );

  // Segunda fila: Nombre, Apellido, Status
  const firstnameField = visibleColumns.find(c => c.columnName === 'firstname');
  const lastnameField = visibleColumns.find(c => c.columnName === 'lastname');
  const statusField = visibleColumns.find(c => c.columnName === 'statusid');

  result.push(
    <div key="name-status-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      {firstnameField && renderField(firstnameField)}
      {lastnameField && renderField(lastnameField)}
      {statusField && renderField(statusField)}
    </div>
  );

  // Tercera fila: Empresas (selección múltiple)
  result.push(
    <div key="empresas-row" className="mb-6">
      <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
        EMPRESAS*
      </label>
      <MultiSelectWithPlaceholder
        value={empresasIds}
        onChange={(value) => {
          const newFormData: Record<string, any> = {
            ...formData,
            empresas_ids: value
          };
          // Si la empresa default actual no está en las nuevas empresas seleccionadas, limpiarla
          if (formData.is_default_empresa && !value.includes(Number(formData.is_default_empresa))) {
            newFormData.is_default_empresa = null;
          }
          // Si no hay empresa default y hay empresas seleccionadas, establecer la primera como default
          if (!newFormData.is_default_empresa && value.length > 0) {
            newFormData.is_default_empresa = value[0];
          }
          setFormData(newFormData);
        }}
        options={empresaOptions}
        placeholder={placeholderText}
        className={`w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white font-mono focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500`}
        disabled={false}
      />
      <p className="mt-2 text-xs text-gray-400 dark:text-neutral-500 font-mono opacity-75">
        Seleccione al menos una empresa. El usuario tendrá acceso a las empresas seleccionadas.
      </p>
    </div>
  );

  // Cuarta fila: Empresa por defecto (solo si hay empresas seleccionadas)
  const empresasSeleccionadasOptions = useMemo(() => {
    return empresaOptions.filter(opt => empresasIds.includes(Number(opt.value)));
  }, [empresaOptions, empresasIds]);

  const empresaDefaultLabel = useMemo(() => {
    if (!formData.is_default_empresa) return null;
    const empresa = empresasSeleccionadasOptions.find(opt => Number(opt.value) === Number(formData.is_default_empresa));
    return empresa ? empresa.label : null;
  }, [formData.is_default_empresa, empresasSeleccionadasOptions]);

  if (empresasIds.length > 0) {
    result.push(
      <div key="empresa-default-row" className="mb-6">
        <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
          EMPRESA POR DEFECTO
        </label>
        <SelectWithPlaceholder
          value={formData.is_default_empresa || null}
          onChange={(value) => setFormData({
            ...formData,
            is_default_empresa: value
          })}
          options={empresasSeleccionadasOptions}
          placeholder={empresaDefaultLabel || 'Seleccione empresa por defecto'}
          className={`w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white font-mono focus:outline-none focus:ring-2 focus:ring-orange-500`}
          disabled={false}
          themeColor="orange"
          allowExternalChange={true}
        />
        <p className="mt-2 text-xs text-gray-400 dark:text-neutral-500 font-mono opacity-75">
          Seleccione la empresa que será la predeterminada para este usuario. Si no se selecciona, se usará la primera empresa de la lista.
        </p>
      </div>
    );
  }

  return <>{result}</>;
};
