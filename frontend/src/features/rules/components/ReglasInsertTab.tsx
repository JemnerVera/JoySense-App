import React from 'react';
import { InsertTab } from '../../system-parameters/InsertTab/InsertTab';
import { getColumnDisplayNameTranslated } from '../../../utils/systemParametersUtils';
import { useLanguage } from '../../../contexts/LanguageContext';
import { RelatedData, Message } from '../types';
import { isFieldVisibleInForm } from '../utils';

interface ReglasInsertTabProps {
  selectedTable: string;
  formData: Record<string, any>;
  setFormData: (data: Record<string, any>) => void;
  updateFormField: (field: string, value: any) => void;
  loading: boolean;
  onInsert: () => void;
  onCancel: () => void;
  message: Message | null;
  relatedData: RelatedData;
  columns: any[];
  getUniqueOptionsForField: (columnName: string) => Array<{value: any, label: string}>;
}

export function ReglasInsertTab({
  selectedTable,
  formData,
  setFormData,
  updateFormField,
  loading,
  onInsert,
  onCancel,
  message,
  relatedData,
  columns,
  getUniqueOptionsForField
}: ReglasInsertTabProps) {
  const { t } = useLanguage();

  const handleCancel = () => {
    onCancel();
  };

  return (
    <InsertTab
      tableName={selectedTable}
      formData={formData}
      setFormData={setFormData}
      updateFormField={updateFormField}
      loading={loading}
      onInsert={onInsert}
      onCancel={handleCancel}
      message={message}
      relatedData={relatedData}
      visibleColumns={columns.filter(col => isFieldVisibleInForm(col.columnName))}
      getColumnDisplayName={(columnName: string) =>
        getColumnDisplayNameTranslated(columnName, t)
      }
      getUniqueOptionsForField={getUniqueOptionsForField}
      themeColor="orange"
    />
  );
}