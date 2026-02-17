import React from 'react';
import { ReglaObjetoUpdateForm } from '../ReglaObjetoUpdateForm';
import { RelatedData, Message } from '../types';

interface ReglaObjetoUpdateTabProps {
  reglasData: any[];
  reglaObjetoData: any[];
  relatedData: RelatedData;
  getUniqueOptionsForField: (columnName: string) => Array<{value: any, label: string}>;
  onUpdate: (reglaid: number, data: Record<string, any>) => Promise<{success: boolean, error?: string}>;
  onCancel: () => void;
  setMessage: (message: Message | null) => void;
  onFormDataChange: (formData: Record<string, any>) => void;
  paisesData?: any[];
  empresasData?: any[];
  fundosData?: any[];
  ubicacionesData?: any[];
  fuentesData?: any[];
}

export function ReglaObjetoUpdateTab({
  reglasData,
  reglaObjetoData,
  relatedData,
  getUniqueOptionsForField,
  onUpdate,
  onCancel,
  setMessage,
  onFormDataChange,
  paisesData,
  empresasData,
  fundosData,
  ubicacionesData,
  fuentesData
}: ReglaObjetoUpdateTabProps) {
  const activeReglaObjetos = reglaObjetoData.filter(ro => ro.statusid === 1);

  return (
    <div className="space-y-6">
      {activeReglaObjetos.length > 0 ? (
        <ReglaObjetoUpdateForm
          reglaObjetoData={activeReglaObjetos}
          relatedData={relatedData}
          getUniqueOptionsForField={getUniqueOptionsForField}
          onUpdate={onUpdate}
          onCancel={onCancel}
          setMessage={setMessage}
          themeColor="orange"
          onFormDataChange={onFormDataChange}
          paisesData={paisesData}
          empresasData={empresasData}
          fundosData={fundosData}
          ubicacionesData={ubicacionesData}
          fuentesData={fuentesData}
          reglasData={reglasData}
        />
      ) : (
        <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6 flex items-center justify-center min-h-[200px]">
          <p className="text-neutral-400 font-mono italic">No hay alcances de regla para actualizar</p>
        </div>
      )}
    </div>
  );
}
