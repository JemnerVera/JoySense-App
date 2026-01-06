// ============================================================================
// USUARIO FORM FIELDS
// ============================================================================
// Componente específico para renderizar campos del formulario de Usuario

import React from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import MultiSelectWithPlaceholder from '../../MultiSelectWithPlaceholder';

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

  // Logs para diagnosticar
  console.log('🔍 [UsuarioFormFields] formData recibido:', {
    formData_keys: Object.keys(formData),
    formData_empresas_ids: formData.empresas_ids,
    formData_empresas_ids_type: typeof formData.empresas_ids,
    formData_empresas_ids_isArray: Array.isArray(formData.empresas_ids),
    formData_empresas_ids_length: Array.isArray(formData.empresas_ids) ? formData.empresas_ids.length : 'N/A',
    empresaOptions_count: empresaOptions.length,
    empresaOptions_first3: empresaOptions.slice(0, 3).map(opt => ({ value: opt.value, valueType: typeof opt.value, label: opt.label }))
  });
  
  // Asegurar que empresas_ids sea un array y convertir a números para comparación
  const empresasIds = Array.isArray(formData.empresas_ids) 
    ? formData.empresas_ids.map(id => Number(id))
    : formData.empresas_ids 
      ? [Number(formData.empresas_ids)] 
      : [];
  
  console.log('🔍 [UsuarioFormFields] empresasIds procesado:', {
    empresasIds,
    empresasIds_type: typeof empresasIds[0],
    empresasIds_length: empresasIds.length
  });
  
  // Obtener labels de las empresas seleccionadas para el placeholder
  // Comparar convirtiendo ambos valores a números para evitar problemas de tipo
  const empresasSeleccionadasLabels = empresaOptions
    .filter(opt => {
      const optValue = Number(opt.value);
      const isIncluded = empresasIds.includes(optValue);
      if (isIncluded) {
        console.log('✅ [UsuarioFormFields] Empresa encontrada:', { label: opt.label, optValue, empresasIds });
      }
      return isIncluded;
    })
    .map(opt => opt.label);
  
  console.log('🔍 [UsuarioFormFields] empresasSeleccionadasLabels:', {
    empresasSeleccionadasLabels,
    count: empresasSeleccionadasLabels.length
  });
  
  // Placeholder dinámico: mostrar empresas actuales si hay seleccionadas
  const placeholderText = empresasSeleccionadasLabels.length > 0
    ? empresasSeleccionadasLabels.join(', ')
    : 'Seleccione empresas';
  
  console.log('🔍 [UsuarioFormFields] placeholderText:', placeholderText);

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
        onChange={(value) => setFormData({
          ...formData,
          empresas_ids: value
        })}
        options={empresaOptions}
        placeholder={placeholderText}
        className={`w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-md text-white font-mono focus:outline-none focus:ring-2 focus:ring-orange-500`}
        disabled={false}
      />
      <p className="mt-2 text-sm text-gray-500 dark:text-neutral-400 font-mono">
        Seleccione al menos una empresa. El usuario tendrá acceso a las empresas seleccionadas.
      </p>
    </div>
  );

  return <>{result}</>;
};
