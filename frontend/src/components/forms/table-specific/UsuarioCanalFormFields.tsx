// ============================================================================
// USUARIO CANAL FORM FIELDS
// ============================================================================
// Componente específico para renderizar campos del formulario de Usuario Canal
// Autocompleta el identificador basado en el usuario y canal seleccionados

import React, { useEffect, useMemo } from 'react';
import SelectWithPlaceholder from '../../SelectWithPlaceholder';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getColumnDisplayNameTranslated } from '../../../utils/systemParametersUtils';

interface UsuarioCanalFormFieldsProps {
  visibleColumns: any[];
  formData: Record<string, any>;
  setFormData: (data: Record<string, any>) => void;
  updateField: (field: string, value: any) => void;
  getThemeColor: (type: 'text' | 'bg' | 'hover' | 'focus' | 'border') => string;
  getUniqueOptionsForField: (columnName: string) => Array<{value: any, label: string}>;
  contactosData?: any[];
  correosData?: any[];
  canalesData?: any[];
  codigotelefonosData?: any[];
}

export const UsuarioCanalFormFields: React.FC<UsuarioCanalFormFieldsProps> = ({
  visibleColumns,
  formData,
  setFormData,
  updateField,
  getThemeColor,
  getUniqueOptionsForField,
  contactosData = [],
  correosData = [],
  canalesData = [],
  codigotelefonosData = []
}) => {
  const { t } = useLanguage();

  // Obtener el nombre del canal seleccionado
  const canalSeleccionado = useMemo(() => {
    if (!formData.canalid) return null;
    return canalesData.find((c: any) => c.canalid === formData.canalid);
  }, [formData.canalid, canalesData]);

  const nombreCanal = canalSeleccionado?.canal?.toLowerCase() || '';

  // Determinar si el canal requiere teléfono o email
  const requiereTelefono = ['whatsapp', 'telegram', 'sms'].includes(nombreCanal);
  const requiereEmail = nombreCanal === 'email';

  // Buscar contacto o correo del usuario seleccionado
  const contactoUsuario = useMemo(() => {
    if (!formData.usuarioid) return null;
    // Convertir ambos a número para comparación correcta (usuarioid puede ser bigint en BD)
    const usuarioidNum = Number(formData.usuarioid);
    return contactosData.find((c: any) => 
      Number(c.usuarioid) === usuarioidNum && c.statusid === 1
    ) || null;
  }, [formData.usuarioid, contactosData]);

  const correoUsuario = useMemo(() => {
    if (!formData.usuarioid) return null;
    // Convertir ambos a número para comparación correcta (usuarioid puede ser bigint en BD)
    const usuarioidNum = Number(formData.usuarioid);
    return correosData.find((c: any) => 
      Number(c.usuarioid) === usuarioidNum && c.statusid === 1
    );
  }, [formData.usuarioid, correosData]);

  // Construir el identificador automáticamente
  useEffect(() => {
    // Solo autocompletar si no hay un identificador ya ingresado manualmente
    // y si tenemos usuario y canal seleccionados
    if (!formData.usuarioid || !formData.canalid) {
      return;
    }

    // Si ya hay un identificador y el usuario no lo ha cambiado manualmente, no sobrescribir
    // (esto permite que el usuario pueda editar el valor si es necesario)
    if (formData.identificador && formData.identificador.trim() !== '') {
      // Verificar si el identificador actual coincide con el que se generaría automáticamente
      // Si no coincide, significa que el usuario lo editó manualmente, no sobrescribir
      let identificadorEsperado = '';
      
      if (requiereTelefono && contactoUsuario) {
        // El celular en contacto ya contiene el código de país concatenado
        identificadorEsperado = contactoUsuario.celular || '';
      } else if (requiereEmail && correoUsuario) {
        identificadorEsperado = correoUsuario.correo || '';
      }

      // Si el identificador actual no coincide con el esperado, no sobrescribir
      if (identificadorEsperado && formData.identificador !== identificadorEsperado) {
        return;
      }
    }

    // Autocompletar identificador
    let nuevoIdentificador = '';

    if (requiereTelefono && contactoUsuario) {
      // El celular en contacto ya contiene el código de país concatenado
      // (se concatena en useInsertForm/useUpdateForm antes de guardar)
      // Por lo tanto, usar el celular directamente
      if (contactoUsuario.celular) {
        nuevoIdentificador = contactoUsuario.celular;
      }
    } else if (requiereEmail && correoUsuario) {
      nuevoIdentificador = correoUsuario.correo || '';
    }

    // Solo actualizar si hay un nuevo identificador y es diferente al actual
    if (nuevoIdentificador && formData.identificador !== nuevoIdentificador) {
      updateField('identificador', nuevoIdentificador);
    }
  }, [
    formData.usuarioid,
    formData.canalid,
    contactoUsuario,
    correoUsuario,
    requiereTelefono,
    requiereEmail,
    codigotelefonosData,
    updateField,
    formData.identificador
  ]);

  // Obtener campos visibles
  const usuarioidField = visibleColumns.find(c => c.columnName === 'usuarioid');
  const canalidField = visibleColumns.find(c => c.columnName === 'canalid');
  const identificadorField = visibleColumns.find(c => c.columnName === 'identificador');
  const statusField = visibleColumns.find(c => c.columnName === 'statusid');

  // Mensaje de ayuda para el identificador
  const ayudaIdentificador = useMemo(() => {
    if (!formData.usuarioid || !formData.canalid) {
      return 'Seleccione usuario y canal para autocompletar';
    }
    
    if (requiereTelefono) {
      if (contactoUsuario) {
        return '✅ Teléfono encontrado y autocompletado';
      } else {
        return '⚠️ No se encontró contacto para este usuario';
      }
    } else if (requiereEmail) {
      if (correoUsuario) {
        return '✅ Correo encontrado y autocompletado';
      } else {
        return '⚠️ No se encontró correo para este usuario';
      }
    }
    return '';
  }, [formData.usuarioid, formData.canalid, requiereTelefono, requiereEmail, contactoUsuario, correoUsuario]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {/* Campo Usuario */}
      {usuarioidField && (
        <div className="space-y-3">
          <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
            {getColumnDisplayNameTranslated('usuarioid', t)?.toUpperCase()} *
          </label>
          <SelectWithPlaceholder
            value={formData.usuarioid || ''}
            onChange={(value) => updateField('usuarioid', value)}
            options={getUniqueOptionsForField('usuarioid')}
            placeholder={`${t('create.select_user')}...`}
            className={`w-full px-3 py-2 bg-gray-200 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 ${getThemeColor('focus')} focus:border-${getThemeColor('border')} text-gray-800 dark:text-white text-base font-mono`}
          />
        </div>
      )}

      {/* Campo Canal */}
      {canalidField && (
        <div className="space-y-3">
          <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
            {getColumnDisplayNameTranslated('canalid', t)?.toUpperCase()} *
          </label>
          <SelectWithPlaceholder
            value={formData.canalid || ''}
            onChange={(value) => updateField('canalid', value)}
            options={getUniqueOptionsForField('canalid')}
            placeholder="SELECCIONAR CANAL"
            className={`w-full px-3 py-2 bg-gray-200 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 ${getThemeColor('focus')} focus:border-${getThemeColor('border')} text-gray-800 dark:text-white text-base font-mono`}
          />
        </div>
      )}

      {/* Campo Identificador */}
      {identificadorField && (
        <div className="space-y-3">
          <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
            {getColumnDisplayNameTranslated('identificador', t)?.toUpperCase()} *
          </label>
          <input
            type="text"
            value={formData.identificador || ''}
            onChange={(e) => updateField('identificador', e.target.value)}
            className={`w-full px-3 py-2 bg-gray-200 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg focus:ring-2 ${getThemeColor('focus')} focus:border-${getThemeColor('border')} text-gray-800 dark:text-white text-base font-mono`}
            placeholder={
              requiereTelefono 
                ? 'Ej: +51960599778' 
                : requiereEmail 
                ? 'Ej: usuario@demo.com'
                : 'Identificador del canal'
            }
          />
          {ayudaIdentificador && (
            <p className={`text-xs mt-1 font-mono ${
              ayudaIdentificador.startsWith('✅') 
                ? 'text-green-500' 
                : ayudaIdentificador.startsWith('⚠️')
                ? 'text-yellow-500'
                : 'text-gray-500 dark:text-neutral-400'
            }`}>
              {ayudaIdentificador}
            </p>
          )}
        </div>
      )}

      {/* Campo Status */}
      {statusField && (
        <div className="space-y-3">
          <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
            {getColumnDisplayNameTranslated('statusid', t)?.toUpperCase()}
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={formData.statusid === 1}
              onChange={(e) => updateField('statusid', e.target.checked ? 1 : 0)}
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
};

