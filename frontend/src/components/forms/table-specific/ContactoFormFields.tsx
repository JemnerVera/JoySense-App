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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

      {/* Campo dinámico según tipo de contacto */}
      {selectedContactType === 'phone' && (
        <>
          {/* Campo País */}
          <div className="space-y-3">
            <label className="block text-lg font-bold text-orange-500 font-mono tracking-wider">
              {t('create.country')} *
            </label>
            <SelectWithPlaceholder
              value={formData.codigotelefonoid || ''}
              onChange={(value) => {
                if (!value) return;
                
                const selectedCountry = countryCodes?.find(c => c.codigotelefonoid.toString() === value.toString());
                logger.debug('País seleccionado:', {
                  value,
                  selectedCountry,
                  codigotelefono: selectedCountry?.codigotelefono,
                  paistelefono: selectedCountry?.paistelefono
                });
                
                // Si ya hay un número escrito, concatenarlo con el nuevo código
                const existingPhoneNumber = formData.phoneNumber || '';
                const newCountryCode = selectedCountry?.codigotelefono || '';
                const newFullPhoneNumber = newCountryCode && existingPhoneNumber ? `${newCountryCode}${existingPhoneNumber}` : '';
                
                setFormData({ 
                  ...formData, 
                  codigotelefonoid: value,
                  phoneNumber: existingPhoneNumber,
                  celular: newFullPhoneNumber
                });
              }}
              options={(() => {
                return countryCodes?.map(country => ({
                  value: country.codigotelefonoid,
                  label: country.paistelefono
                })) || [];
              })()}
              placeholder={formData.usuarioid ? `${t('buttons.select')} ${t('fields.country')}...` : `${t('buttons.previous')} ${t('buttons.select')} ${t('fields.user')}`}
              disabled={!formData.usuarioid}
            />
          </div>

          {/* Campo Número de Teléfono */}
          <div className="space-y-3">
            <label className="block text-lg font-bold text-orange-500 font-mono tracking-wider">
              {t('contact.phone_number')} *
            </label>
            <div className="flex">
              <span className={`px-4 py-3 border rounded-l-lg text-white text-sm font-medium min-w-[80px] text-center ${
                formData.codigotelefonoid 
                  ? 'bg-orange-600 border-orange-500' 
                  : 'bg-neutral-800 border-neutral-700'
              }`}>
                {(() => {
                  const selectedCountry = countryCodes?.find(c => c.codigotelefonoid.toString() === formData.codigotelefonoid?.toString());
                  return selectedCountry?.codigotelefono || '+';
                })()}
              </span>
              <input
                type="tel"
                value={formData.phoneNumber || ''}
                onChange={(e) => {
                  const selectedCountry = countryCodes?.find(c => c.codigotelefonoid.toString() === formData.codigotelefonoid?.toString());
                  const countryCode = selectedCountry?.codigotelefono || '';
                  const phoneNumber = e.target.value;
                  const fullPhoneNumber = countryCode && phoneNumber ? `${countryCode}${phoneNumber}` : phoneNumber;
                  
                  logger.debug('Actualizando teléfono:', {
                    countryCode,
                    phoneNumber,
                    fullPhoneNumber,
                    selectedCountry
                  });
                  
                  setFormData({ 
                    ...formData, 
                    phoneNumber: phoneNumber,
                    celular: fullPhoneNumber
                  });
                }}
                placeholder={formData.codigotelefonoid ? "EJ: 987654321" : `${t('buttons.previous')} ${t('buttons.select')} ${t('fields.country')}`}
                disabled={!formData.codigotelefonoid}
                className={`flex-1 px-4 py-3 border border-l-0 rounded-r-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all font-mono ${
                  formData.codigotelefonoid 
                    ? 'bg-neutral-700 border-neutral-600' 
                    : 'bg-neutral-800 border-neutral-700 cursor-not-allowed opacity-50'
                }`}
              />
            </div>
          </div>
        </>
      )}

      {selectedContactType === 'email' && (
        <div className="space-y-3">
          <label className="block text-lg font-bold text-orange-500 font-mono tracking-wider">
            {t('contact.email_address')} *
          </label>
          <input
            type="email"
            value={formData.correo || ''}
            onChange={(e) => {
              const email = e.target.value;
              updateField('correo', email);
            }}
            placeholder={formData.usuarioid ? "USUARIO@DOMINIO.COM" : t('contact.select_user_first')}
            disabled={!formData.usuarioid}
            className={`w-full px-4 py-3 border rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all font-mono ${
              formData.usuarioid 
                ? 'bg-neutral-700 border-neutral-600' 
                : 'bg-neutral-800 border-neutral-700 cursor-not-allowed opacity-50'
            }`}
          />
          {formData.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo) && (
            <p className="text-red-400 text-sm font-mono">
              Formato de correo inválido. Use: usuario@dominio.com
            </p>
          )}
        </div>
      )}

      {/* Campo Status (siempre visible en contacto) */}
      <div className="mb-4">
        <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
          {t('create.status')}*
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
