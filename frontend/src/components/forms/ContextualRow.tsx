// ============================================================================
// CONTEXTUAL ROW COMPONENT
// ============================================================================
// Componente para renderizar fila contextual con filtros globales

import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface ContextualRowProps {
  fields: string[];
  paisSeleccionado?: string;
  empresaSeleccionada?: string;
  fundoSeleccionado?: string;
  getPaisName: (paisId: string) => string;
  getEmpresaName: (empresaId: string) => string;
  getFundoName: (fundoId: string) => string;
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
      return (
        <div key={`pais-contextual-${index}`}>
          <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
            {t('create.country')}
          </label>
          <div className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-base font-mono cursor-not-allowed opacity-75">
            {getPaisName(paisSeleccionado)}
          </div>
        </div>
      );
    } 
    // Para Empresa: mostrar solo si hay filtro global
    else if (field === 'empresa' && empresaSeleccionada) {
      return (
        <div key={`empresa-contextual-${index}`}>
          <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
            {t('create.company')}
          </label>
          <div className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-base font-mono cursor-not-allowed opacity-75">
            {getEmpresaName(empresaSeleccionada)}
          </div>
        </div>
      );
    } 
    // Para Fundo: mostrar solo si hay filtro global
    else if (field === 'fundo' && fundoSeleccionado) {
      return (
        <div key={`fundo-contextual-${index}`}>
          <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
            {t('table_headers.fund')}
          </label>
          <div className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-base font-mono cursor-not-allowed opacity-75">
            {getFundoName(fundoSeleccionado)}
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
