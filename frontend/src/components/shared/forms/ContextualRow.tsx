// ============================================================================
// CONTEXTUAL ROW COMPONENT
// ============================================================================
// Componente para renderizar fila contextual con filtros globales

import React from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';

interface ContextualRowProps {
  fields: string[];
  paisSeleccionado?: string;
  empresaSeleccionada?: string;
  fundoSeleccionado?: string;
  getPaisName: (paisId: string) => string | null;
  getEmpresaName: (empresaId: string) => string | null;
  getFundoName: (fundoId: string) => string | null;
  getThemeColor: (type: 'text' | 'bg' | 'hover' | 'focus' | 'border') => string;
}

export const ContextualRow: React.FC<ContextualRowProps> = ({
  fields,
  paisSeleccionado,
  empresaSeleccionada,
  fundoSeleccionado,
  getPaisName,
  getEmpresaName,
  getFundoName,
  getThemeColor
}) => {
  const { t } = useLanguage();

  const contextualFields = fields.map((field, index) => {
    // Para País: mostrar solo si hay filtro global
    if (field === 'pais' && paisSeleccionado) {
      const paisName = getPaisName(paisSeleccionado);
      const isLoading = paisName === null;
      
      return (
        <div key={`pais-contextual-${index}`}>
          <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
            {t('create.country')}
          </label>
          <div className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-base font-mono cursor-not-allowed opacity-75 flex justify-between items-center">
            <span className={isLoading ? 'text-gray-400' : 'text-white'}>
              {isLoading ? `${t('buttons.select')} ${t('fields.country')}` : paisName}
            </span>
            {isLoading && (
              <div className="animate-spin h-4 w-4 border-2 border-orange-500 border-t-transparent rounded-full"></div>
            )}
          </div>
        </div>
      );
    } 
    // Para Empresa: mostrar solo si hay filtro global
    else if (field === 'empresa' && empresaSeleccionada) {
      const empresaName = getEmpresaName(empresaSeleccionada);
      const isLoading = empresaName === null;
      
      return (
        <div key={`empresa-contextual-${index}`}>
          <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
            {t('create.company')}
          </label>
          <div className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-base font-mono cursor-not-allowed opacity-75 flex justify-between items-center">
            <span className={isLoading ? 'text-gray-400' : 'text-white'}>
              {isLoading ? `${t('buttons.select')} ${t('fields.company')}` : empresaName}
            </span>
            {isLoading && (
              <div className="animate-spin h-4 w-4 border-2 border-orange-500 border-t-transparent rounded-full"></div>
            )}
          </div>
        </div>
      );
    } 
    // Para Fundo: mostrar solo si hay filtro global
    else if (field === 'fundo' && fundoSeleccionado) {
      const fundoName = getFundoName(fundoSeleccionado);
      const isLoading = fundoName === null;
      
      return (
        <div key={`fundo-contextual-${index}`}>
          <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
            {t('table_headers.fund')}
          </label>
          <div className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-base font-mono cursor-not-allowed opacity-75 flex justify-between items-center">
            <span className={isLoading ? 'text-gray-400' : 'text-white'}>
              {isLoading ? `${t('buttons.select')} ${t('table_headers.fund')}` : fundoName}
            </span>
            {isLoading && (
              <div className="animate-spin h-4 w-4 border-2 border-orange-500 border-t-transparent rounded-full"></div>
            )}
          </div>
        </div>
      );
    }
    return null;
  }).filter(Boolean);

  if (contextualFields.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      {contextualFields}
    </div>
  );
};
