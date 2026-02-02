// ============================================================================
// USUARIO FORM FIELDS
// ============================================================================
// Componente específico para renderizar campos del formulario de Usuario

import React, { useMemo } from 'react';
import { useLanguage } from '../../../../contexts/LanguageContext';

interface UsuarioFormFieldsProps {
  visibleColumns: any[];
  formData: Record<string, any>;
  setFormData: (data: Record<string, any>) => void;
  renderField: (col: any) => React.ReactNode;
  getThemeColor: (type: 'text' | 'bg' | 'hover' | 'focus' | 'border') => string;
}

export const UsuarioFormFields: React.FC<UsuarioFormFieldsProps> = ({
  visibleColumns,
  formData,
  setFormData,
  renderField,
  getThemeColor
}) => {
  const { t } = useLanguage();

  const result: React.ReactNode[] = [];

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


  return <>{result}</>;
};
