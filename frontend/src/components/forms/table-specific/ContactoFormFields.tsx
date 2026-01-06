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
  codigotelefonosData?: any[];
}

export const ContactoFormFields: React.FC<ContactoFormFieldsProps> = ({
  visibleColumns,
  formData,
  setFormData,
  updateField,
  getThemeColor,
  getUniqueOptionsForField,
  selectedContactType,
  countryCodes,
  codigotelefonosData = []
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
          className="w-full px-3 py-2 bg-gray-200 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-800 dark:text-white text-base font-mono"
        />
      </div>

      {/* Campo Celular con Código de País (Combinado - Estilo Input Group) */}
      <div className="space-y-3">
        <label className="block text-lg font-bold text-orange-500 font-mono tracking-wider">
          {getColumnDisplayNameTranslated('celular', t)?.toUpperCase()} *
        </label>
        {/* Input combinado estilo e-commerce */}
        <div className="flex items-center border border-neutral-600 rounded-lg bg-neutral-700 focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500 transition-all overflow-visible h-[42px]">
          {/* Código de País - Parte izquierda (más angosto para el código) */}
          <div className="flex items-center flex-shrink-0 border-r border-neutral-600 relative z-10">
            <div className="w-20 min-w-[80px] max-w-[80px]">
              <SelectWithPlaceholder
                value={formData.codigotelefonoid || ''}
                onChange={(value) => {
                  updateField('codigotelefonoid', value);
                }}
                options={getUniqueOptionsForField('codigotelefonoid')}
                placeholder="PAIS"
                disabled={!formData.usuarioid || formData.usuarioid === 0 || formData.usuarioid === ''}
                className="w-full px-2 py-2 bg-transparent border-0 text-white font-mono text-sm focus:ring-0 focus:outline-none h-[42px]"
                themeColor="orange"
                renderSelectedLabel={(label) => {
                  // Buscar el código telefónico en codigotelefonosData basándose en el codigotelefonoid seleccionado
                  if (formData.codigotelefonoid && codigotelefonosData && codigotelefonosData.length > 0) {
                    const codigoTelefono = codigotelefonosData.find(
                      (c: any) => c.codigotelefonoid === formData.codigotelefonoid
                    );
                    if (codigoTelefono?.codigotelefono) {
                      return (
                        <span className="text-orange-500">({codigoTelefono.codigotelefono})</span>
                      );
                    }
                  }
                  // Si no se encuentra el código, mostrar solo el label (nombre del país)
                  return label || '';
                }}
                dropdownWidth="w-40 min-w-[160px]"
              />
            </div>
          </div>
          {/* Número de Celular - Parte derecha */}
          <div className="flex items-center flex-1 min-w-0">
            <input
              type="tel"
              value={formData.celular || ''}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, ''); // Solo números
                // Validar que no exceda 12 caracteres
                if (value.length <= 12) {
                  updateField('celular', value);
                }
              }}
              placeholder={formData.codigotelefonoid ? "XXX-XXX-XXX" : "Selecciona país primero"}
              disabled={!formData.codigotelefonoid}
              maxLength={12}
              className="flex-1 min-w-0 px-4 py-2 bg-transparent border-0 text-white placeholder-neutral-400 focus:outline-none focus:ring-0 font-mono text-base h-[42px]"
            />
          </div>
        </div>
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
