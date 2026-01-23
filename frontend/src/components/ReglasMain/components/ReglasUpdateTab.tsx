import React from 'react';
import { ReglaUpdateForm } from '../../Reglas/ReglaUpdateForm';
import { RelatedData, Message } from '../types';

interface ReglasUpdateTabProps {
  reglasData: any[];
  relatedData: RelatedData;
  getUniqueOptionsForField: (columnName: string) => Array<{value: any, label: string}>;
  onUpdate: (reglaid: number, data: Record<string, any>) => Promise<{success: boolean, error?: string}>;
  onCancel: () => void;
  setMessage: (message: Message | null) => void;
  onFormDataChange: (formData: Record<string, any>) => void;
}

export function ReglasUpdateTab({
  reglasData,
  relatedData,
  getUniqueOptionsForField,
  onUpdate,
  onCancel,
  setMessage,
  onFormDataChange
}: ReglasUpdateTabProps) {
  return (
    <ReglaUpdateForm
      reglasData={reglasData}
      relatedData={relatedData}
      getUniqueOptionsForField={getUniqueOptionsForField}
      onUpdate={onUpdate}
      onCancel={onCancel}
      setMessage={setMessage}
      themeColor="orange"
      onFormDataChange={onFormDataChange}
    />
  );
}