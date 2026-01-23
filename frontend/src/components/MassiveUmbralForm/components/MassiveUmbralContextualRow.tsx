// ============================================================================
// COMPONENT: MassiveUmbralContextualRow - Filas contextuales con filtros globales
// ============================================================================

import React from 'react';
import SelectWithPlaceholder from '../../selectors/SelectWithPlaceholder';
import { useLanguage } from '../../../contexts/LanguageContext';
import { FormData } from '../types';

interface MassiveUmbralContextualRowProps {
  fields: string[];
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  fundosOptions: any[];
  entidadesOptions: any[];
  paisSeleccionado?: string;
  empresaSeleccionada?: string;
  getPaisName?: (paisId: string) => string;
  getEmpresaName?: (empresaId: string) => string;
  loading?: boolean;
}

export const MassiveUmbralContextualRow: React.FC<MassiveUmbralContextualRowProps> = ({
  fields,
  formData,
  setFormData,
  fundosOptions,
  entidadesOptions,
  paisSeleccionado,
  empresaSeleccionada,
  getPaisName,
  getEmpresaName,
  loading = false
}) => {
  const { t } = useLanguage();

  const contextualFields = fields.map(field => {
    if (field === 'pais' && paisSeleccionado && getPaisName) {
      return (
        <div key="pais-contextual">
          <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
            PAÍS
          </label>
          <div className="w-full px-3 py-2 bg-gray-200 dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded-lg text-gray-600 dark:text-white font-mono cursor-not-allowed opacity-75">
            {getPaisName(paisSeleccionado)}
          </div>
        </div>
      );
    } else if (field === 'empresa' && empresaSeleccionada && getEmpresaName) {
      return (
        <div key="empresa-contextual">
          <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
            EMPRESA
          </label>
          <div className="w-full px-3 py-2 bg-gray-200 dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded-lg text-gray-600 dark:text-white font-mono cursor-not-allowed opacity-75">
            {getEmpresaName(empresaSeleccionada)}
          </div>
        </div>
      );
    } else if (field === 'fundo') {
      return (
        <div key="fundo-contextual">
          <label className="block text-lg font-bold text-orange-500 font-mono tracking-wider mb-2">
            {t('table_headers.fund')}
          </label>
          {fundosOptions.length === 1 ? (
            <div className="w-full px-3 py-2 bg-gray-200 dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded-lg text-gray-600 dark:text-white font-mono cursor-not-allowed opacity-75">
              {fundosOptions[0].label}
            </div>
          ) : (
            <SelectWithPlaceholder
              options={fundosOptions}
              value={formData.fundoid}
              onChange={(value) => {
                setFormData(prev => ({
                  ...prev,
                  fundoid: value ? parseInt(value.toString()) : null,
                  entidadid: null
                }));
              }}
              placeholder={t('umbral.select_fund')}
              disabled={loading}
            />
          )}
        </div>
      );
    } else if (field === 'entidad') {
      return (
        <div key="entidad-contextual">
          <label className="block text-lg font-bold text-orange-500 font-mono tracking-wider mb-2">
            {t('table_headers.entity')}
          </label>
          {entidadesOptions.length === 1 ? (
            <div className="w-full px-3 py-2 bg-gray-200 dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded-lg text-gray-600 dark:text-white font-mono cursor-not-allowed opacity-75">
              {entidadesOptions[0].label}
            </div>
          ) : (
            <SelectWithPlaceholder
              options={entidadesOptions}
              value={formData.entidadid}
              onChange={(value) => {
                setFormData(prev => ({
                  ...prev,
                  entidadid: value ? parseInt(value.toString()) : null
                }));
              }}
              placeholder={t('umbral.select_entity')}
              disabled={loading}
            />
          )}
        </div>
      );
    }
    return null;
  }).filter(Boolean);

  if (contextualFields.length === 0) return null;

  // Separar campos en dos filas
  const firstRowFields = contextualFields.filter(field => 
    field && (field.key === 'pais-contextual' || field.key === 'empresa-contextual')
  );
  const secondRowFields = contextualFields.filter(field => 
    field && (field.key === 'fundo-contextual' || field.key === 'entidad-contextual')
  );

  return (
    <div className="space-y-6 mb-6">
      {/* Primera fila: País y Empresa */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {firstRowFields}
      </div>
      {/* Segunda fila: Fundo y Entidad */}
      {secondRowFields.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {secondRowFields}
        </div>
      )}
    </div>
  );
};

