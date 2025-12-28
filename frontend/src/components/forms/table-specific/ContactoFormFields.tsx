// ============================================================================
// CONTACTO FORM FIELDS
// ============================================================================
// Componente específico para renderizar campos del formulario de Contacto

import React from 'react';
import SelectWithPlaceholder from '../../SelectWithPlaceholder';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getColumnDisplayNameTranslated } from '../../../utils/systemParametersUtils';
import { logger } from '../../../utils/logger';

interface ContactoFormFieldsProps {
  visibleColumns: any[];
  formData: Record<string, any>;
  setFormData: (data: Record<string, any>) => void;
  updateField: (field: string, value: any) => void;
  getThemeColor: (type: 'text' | 'bg' | 'hover' | 'focus' | 'border') => string;
  getUniqueOptionsForField: (columnName: string) => Array<{value: any, label: string}>;
  selectedContactType?: 'phone' | 'email' | null;
  countryCodes?: any[];
}

export const ContactoFormFields: React.FC<ContactoFormFieldsProps> = ({
  visibleColumns,
  formData,
  setFormData,
  updateField,
  getThemeColor,
  getUniqueOptionsForField,
  selectedContactType,
  countryCodes
}) => {
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Campo Usuario */}
      <div className="space-y-3">
        <label className="block text-lg font-bold text-orange-500 font-mono tracking-wider">
          {getColumnDisplayNameTranslated('usuarioid', t)?.toUpperCase()} *
        </label>
        <SelectWithPlaceholder
          value={formData.usuarioid || ''}
          onChange={(value) => updateField('usuarioid', value)}
          options={getUniqueOptionsForField('usuarioid')}
          placeholder={`${t('create.select_user')}...`}
        />
      </div>

      {/* Campo Código de País */}
      <div className="space-y-3">
        <label className="block text-lg font-bold text-orange-500 font-mono tracking-wider">
          {getColumnDisplayNameTranslated('codigotelefonoid', t)?.toUpperCase()} *
        </label>
        <SelectWithPlaceholder
          value={formData.codigotelefonoid || ''}
          onChange={(value) => updateField('codigotelefonoid', value)}
          options={getUniqueOptionsForField('codigotelefonoid')}
          placeholder={formData.usuarioid ? t('create.select_country_code') : `${t('buttons.previous')} ${t('buttons.select')} ${t('fields.user')}`}
          disabled={!formData.usuarioid}
        />
      </div>

      {/* Campo Celular */}
      <div className="space-y-3">
        <label className="block text-lg font-bold text-orange-500 font-mono tracking-wider">
          {getColumnDisplayNameTranslated('celular', t)?.toUpperCase()} *
        </label>
        <input
          type="tel"
          value={formData.celular || ''}
          onChange={(e) => {
            const value = e.target.value;
            // Validar que no exceda 12 caracteres
            if (value.length <= 12) {
              updateField('celular', value);
            }
          }}
          placeholder={formData.codigotelefonoid ? "EJ: 987654321" : `${t('buttons.previous')} ${t('buttons.select')} ${t('fields.country_code')}`}
          disabled={!formData.codigotelefonoid}
          maxLength={12}
          className={`w-full px-4 py-3 border rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all font-mono ${
            formData.codigotelefonoid 
              ? 'bg-neutral-700 border-neutral-600' 
              : 'bg-neutral-800 border-neutral-700 cursor-not-allowed opacity-50'
          }`}
        />
        {formData.celular && formData.celular.length > 12 && (
          <p className="text-red-400 text-sm font-mono">
            El número de celular no puede exceder 12 caracteres
          </p>
        )}
      </div>

      {/* Campo Status */}
      <div className="space-y-3">
        <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
          {getColumnDisplayNameTranslated('statusid', t)?.toUpperCase()} *
        </label>
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            checked={formData.statusid === 1}
            onChange={(e) => setFormData({
              ...formData,
              statusid: e.target.checked ? 1 : 0
            })}
            className="w-5 h-5 text-orange-500 bg-neutral-800 border-neutral-600 rounded focus:ring-orange-500 focus:ring-2"
          />
          <span className="text-white font-mono tracking-wider">
            {formData.statusid === 1 ? t('create.active') : t('create.inactive')}
          </span>
        </div>
      </div>
    </div>
  );
};
