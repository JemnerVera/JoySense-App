// ============================================================================
// CRITICIDAD FORM FIELDS
// ============================================================================
// Componente específico para renderizar campos de criticidad con layout personalizado

import React from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';

interface CriticidadFormFieldsProps {
  visibleColumns: any[];
  formData: Record<string, any>;
  renderField: (col: any) => React.ReactNode;
}

export const CriticidadFormFields: React.FC<CriticidadFormFieldsProps> = ({
  visibleColumns,
  formData,
  renderField
}) => {
  const { t } = useLanguage();

  const criticidadField = visibleColumns.find(c => c.columnName === 'criticidad');
  const escalamientoField = visibleColumns.find(c => c.columnName === 'escalamiento');
  const escalonField = visibleColumns.find(c => c.columnName === 'escalon');
  const statusField = visibleColumns.find(c => c.columnName === 'statusid');

  const result: React.ReactNode[] = [];

  // Fila 1: CRITICIDAD y STATUS al extremo derecho
  if (criticidadField || statusField) {
    result.push(
      <div key="row-1" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {criticidadField && renderField(criticidadField)}
        <div></div> {/* Espacio vacío central */}
        <div className="flex flex-col justify-start">
          {statusField && renderField(statusField)}
        </div>
      </div>
    );
  }

  // Fila 2: ESCALAMIENTO y ESCALON
  if (escalamientoField || escalonField) {
    result.push(
      <div key="row-2" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {escalamientoField && renderField(escalamientoField)}
        {escalonField && renderField(escalonField)}
        <div></div> {/* Espacio vacío a la derecha */}
      </div>
    );
  }

  return <>{result}</>;
};
