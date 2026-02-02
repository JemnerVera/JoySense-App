import React, { useState, useEffect } from 'react';
import { useFormRendering } from '../../hooks/useFormRendering';
import { useSystemParametersCRUD } from '../../hooks/useSystemParametersCRUD';

interface ParameterFormProps {
  selectedTable: string;
  formData: Record<string, any>;
  onFormDataChange: (data: Record<string, any>) => void;
  onSuccess: (message: string) => void;
  onError: (error: string) => void;
  existingData?: any[];
  isUpdate?: boolean;
  originalData?: Record<string, any>;
}

/**
 * Componente reutilizable para formularios de parámetros
 * Utiliza los hooks de lógica de negocio para manejar validación y operaciones CRUD
 */
export function ParameterForm({
  selectedTable,
  formData,
  onFormDataChange,
  onSuccess,
  onError,
  existingData = [],
  isUpdate = false,
  originalData = {}
}: ParameterFormProps) {
  
  const [localFormData, setLocalFormData] = useState<Record<string, any>>(formData);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  const { getFieldProps, getFormValidation, shouldShowField } = useFormRendering(selectedTable, localFormData);
  const { handleInsert, handleUpdate, isProcessing, operationError } = useSystemParametersCRUD();

  // Sincronizar datos locales con props
  useEffect(() => {
    setLocalFormData(formData);
  }, [formData]);

  // Manejar cambios en campos del formulario
  const handleFieldChange = (fieldName: string, value: any) => {
    const newFormData = { ...localFormData, [fieldName]: value };
    setLocalFormData(newFormData);
    onFormDataChange(newFormData);
    
    // Limpiar errores de validación
    setValidationErrors([]);
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Validar formulario
      const validation = getFormValidation(localFormData);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        return;
      }

      let result;
      if (isUpdate) {
        result = await handleUpdate(selectedTable, localFormData, originalData, existingData);
      } else {
        result = await handleInsert(selectedTable, localFormData, existingData);
      }

      if (result.success) {
        onSuccess(result.message || 'Operación exitosa');
        setValidationErrors([]);
      } else {
        onError(result.error || 'Error en la operación');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      onError(errorMessage);
    }
  };

  // Renderizar campo de entrada
  const renderField = (fieldName: string, fieldType: 'text' | 'number' | 'password' | 'select' = 'text', options?: any[]) => {
    if (!shouldShowField(fieldName, localFormData)) {
      return null;
    }

    const fieldProps = getFieldProps(fieldName, localFormData);
    const value = localFormData[fieldName] || '';

    return (
      <div key={fieldName} className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {fieldName.toUpperCase()}
          {fieldProps.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        {fieldType === 'select' ? (
          <select
            value={value}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            disabled={fieldProps.disabled}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              fieldProps.disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
            } ${fieldProps.error ? 'border-red-500' : 'border-gray-300'}`}
          >
            <option value="">{fieldName.toUpperCase()}{fieldProps.required ? '*' : ''}</option>
            {options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={fieldType}
            value={value}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            disabled={fieldProps.disabled}
            placeholder={`${fieldName.toUpperCase()}${fieldProps.required ? '*' : ''}`}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              fieldProps.disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
            } ${fieldProps.error ? 'border-red-500' : 'border-gray-300'}`}
          />
        )}
        
        {fieldProps.error && (
          <p className="mt-1 text-sm text-red-600">{fieldProps.error}</p>
        )}
        
        {fieldProps.warning && (
          <p className="mt-1 text-sm text-yellow-600">{fieldProps.warning}</p>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Renderizar campos específicos según la tabla */}
      {selectedTable === 'pais' && (
        <>
          {renderField('pais', 'text')}
          {renderField('paisabrev', 'text')}
        </>
      )}
      
      {selectedTable === 'empresa' && (
        <>
          {renderField('empresa', 'text')}
          {renderField('empresabrev', 'text')}
          {renderField('paisid', 'select', [
            { value: 1, label: 'Perú' },
            { value: 2, label: 'Chile' }
          ])}
        </>
      )}
      
      {selectedTable === 'fundo' && (
        <>
          {renderField('fundo', 'text')}
          {renderField('fundoabrev', 'text')}
          {renderField('empresaid', 'select', [
            { value: 1, label: 'Empresa 1' },
            { value: 2, label: 'Empresa 2' }
          ])}
        </>
      )}
      
      {selectedTable === 'perfilumbral' && (
        <>
          {renderField('perfilid', 'select', [
            { value: 1, label: 'Perfil 1' },
            { value: 2, label: 'Perfil 2' }
          ])}
          {renderField('umbralid', 'select', [
            { value: 1, label: 'Umbral 1' },
            { value: 2, label: 'Umbral 2' }
          ])}
        </>
      )}
      
      {selectedTable === 'criticidad' && (
        <>
          {renderField('criticidad', 'text')}
          {renderField('criticidadbrev', 'text')}
        </>
      )}
      
      {selectedTable === 'contacto' && (
        <>
          {renderField('usuarioid', 'select', [
            { value: 1, label: 'Usuario 1' },
            { value: 2, label: 'Usuario 2' }
          ])}
          {renderField('medioid', 'select', [
            { value: 1, label: 'Medio 1' },
            { value: 2, label: 'Medio 2' }
          ])}
        </>
      )}

      {selectedTable === 'usuario' && (
        <>
          {renderField('login', 'text')}
          {renderField('firstname', 'text')}
          {renderField('lastname', 'text')}
          {renderField('password', 'password')}
          {renderField('statusid', 'select', [
            { value: 1, label: 'Activo' },
            { value: 2, label: 'Inactivo' }
          ])}
        </>
      )}

      {/* Agregar más casos según sea necesario */}
      
      {/* Mostrar errores de validación */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Errores de validación:
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <ul className="list-disc pl-5 space-y-1">
                  {validationErrors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Mostrar errores de operación */}
      {operationError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{operationError}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Botones de acción */}
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isProcessing}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? 'Procesando...' : (isUpdate ? 'Actualizar' : 'Crear')}
        </button>
      </div>
      
      {/* Leyenda de campos obligatorios */}
      <div className="text-xs text-gray-500 mt-4">
        (*) Campo obligatorio
      </div>
    </form>
  );
}
