import React, { useState, useCallback } from 'react';
import { useInsertOperations } from '../../hooks/useInsertOperations';
import { useUpdateOperations } from '../../hooks/useUpdateOperations';

interface MassiveOperationsProps {
  selectedTable: string;
  onSuccess: (message: string) => void;
  onError: (error: string) => void;
  onClose: () => void;
  operationType: 'insert' | 'update';
  existingData?: any[];
  updateData?: any[];
}

/**
 * Componente para manejar operaciones masivas (inserción y actualización)
 * Utiliza los hooks de operaciones para manejar múltiples registros
 */
export function MassiveOperations({
  selectedTable,
  onSuccess,
  onError,
  onClose,
  operationType,
  existingData = [],
  updateData = []
}: MassiveOperationsProps) {
  
  const [massiveData, setMassiveData] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  const { insertMultiple, isInserting } = useInsertOperations();
  const { updateMultiple, isUpdating } = useUpdateOperations();

  // Manejar cambio en datos masivos
  const handleDataChange = (value: string) => {
    setMassiveData(value);
    setValidationErrors([]);
  };

  // Validar formato de datos masivos
  const validateMassiveData = (data: string): { isValid: boolean; errors: string[]; parsedData: any[] } => {
    const errors: string[] = [];
    let parsedData: any[] = [];

    try {
      // Intentar parsear como JSON
      if (data.trim().startsWith('[') || data.trim().startsWith('{')) {
        parsedData = JSON.parse(data);
        if (!Array.isArray(parsedData)) {
          parsedData = [parsedData];
        }
      } else {
        // Intentar parsear como CSV
        const lines = data.trim().split('\n');
        if (lines.length < 2) {
          errors.push('Se requieren al menos 2 líneas (encabezado y datos)');
          return { isValid: false, errors, parsedData: [] };
        }

        const headers = lines[0].split(',').map(h => h.trim());
        parsedData = lines.slice(1).map(line => {
          const values = line.split(',').map(v => v.trim());
          const obj: any = {};
          headers.forEach((header, index) => {
            obj[header] = values[index] || '';
          });
          return obj;
        });
      }

      // Validar que todos los registros tengan la estructura correcta
      if (parsedData.length === 0) {
        errors.push('No se encontraron datos válidos');
      }

      // Validar campos requeridos según la tabla
      const requiredFields = getRequiredFields(selectedTable);
      parsedData.forEach((record, index) => {
        requiredFields.forEach(field => {
          if (!record[field] || record[field].toString().trim() === '') {
            errors.push(`Registro ${index + 1}: El campo '${field}' es obligatorio`);
          }
        });
      });

    } catch (error) {
      errors.push('Formato de datos inválido. Use JSON o CSV');
    }

    return {
      isValid: errors.length === 0,
      errors,
      parsedData
    };
  };

  // Obtener campos requeridos según la tabla
  const getRequiredFields = (table: string): string[] => {
    const requiredFieldsMap: Record<string, string[]> = {
      pais: ['pais', 'paisabrev'],
      empresa: ['empresa', 'empresabrev', 'paisid'],
      fundo: ['fundo', 'fundoabrev', 'empresaid'],
      ubicacion: ['ubicacion', 'fundoid'],
      localizacion: ['latitud', 'longitud', 'referencia', 'entidadid', 'ubicacionid', 'nodoid'],
      entidad: ['entidad'],
      tipo: ['tipo', 'entidadid'],
      nodo: ['nodo', 'deveui'],
      metrica: ['metrica', 'unidad'],
      umbral: ['minimo', 'maximo', 'umbral', 'metricaid'],
      perfilumbral: ['perfil', 'umbralid'],
      criticidad: ['criticidad', 'criticidadbrev'],
      medio: ['medio'],
      contacto: ['usuarioid', 'medioid'],
      usuario: ['usuario', 'perfilid'],
      perfil: ['perfil', 'nivel'],
      usuarioperfil: ['usuarioid', 'perfilid']
    };

    return requiredFieldsMap[table] || [];
  };

  // Manejar envío de operación masiva
  const handleSubmit = async () => {
    setIsProcessing(true);
    setValidationErrors([]);

    try {
      // Validar datos
      const validation = validateMassiveData(massiveData);
      if (!validation.isValid) {
        setValidationErrors(validation.errors);
        setIsProcessing(false);
        return;
      }

      let result;
      if (operationType === 'insert') {
        result = await insertMultiple(selectedTable, validation.parsedData);
      } else {
        result = await updateMultiple(selectedTable, validation.parsedData);
      }

      if (result.success) {
        const message = operationType === 'insert' 
          ? `✅ Se insertaron ${(result as any).insertedCount || 0} registros exitosamente`
          : `✅ Se actualizaron ${(result as any).updatedCount || 0} registros exitosamente`;
        onSuccess(message);
        onClose();
      } else {
        onError(result.errors?.join(', ') || 'Error en la operación masiva');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      onError(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  // Generar plantilla de datos
  const generateTemplate = () => {
    const requiredFields = getRequiredFields(selectedTable);
    const template = requiredFields.join(', ') + '\n';
    setMassiveData(template);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Encabezado */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {operationType === 'insert' ? 'Inserción Masiva' : 'Actualización Masiva'} - {selectedTable.toUpperCase()}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Instrucciones */}
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Instrucciones:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Puede usar formato JSON o CSV</li>
              <li>• Para CSV: primera línea debe contener los nombres de las columnas</li>
              <li>• Para JSON: use un array de objetos</li>
              <li>• Campos obligatorios: {getRequiredFields(selectedTable).join(', ')}</li>
            </ul>
          </div>

          {/* Controles */}
          <div className="mb-4 flex space-x-2">
            <button
              onClick={generateTemplate}
              className="px-3 py-1 text-sm font-medium text-blue-700 bg-blue-100 border border-blue-300 rounded-md hover:bg-blue-200"
            >
              Generar Plantilla
            </button>
          </div>

          {/* Área de texto para datos */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Datos ({operationType === 'insert' ? 'Inserción' : 'Actualización'}):
            </label>
            <textarea
              value={massiveData}
              onChange={(e) => handleDataChange(e.target.value)}
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder="Pegue aquí los datos en formato JSON o CSV..."
            />
          </div>

          {/* Mostrar errores de validación */}
          {validationErrors.length > 0 && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
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

          {/* Botones de acción */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={isProcessing || !massiveData.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Procesando...' : (operationType === 'insert' ? 'Insertar' : 'Actualizar')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
