import React from 'react';
import SelectWithPlaceholder from './SelectWithPlaceholder';
import ReplicateButton from './ReplicateButton';
import { tableValidationSchemas } from '../utils/formValidation';

interface NormalInsertFormProps {
  visibleColumns: any[];
  formData: Record<string, any>;
  setFormData: (data: Record<string, any>) => void;
  selectedTable: string;
  loading: boolean;
  onInsert: () => void;
  onCancel: () => void;
  getColumnDisplayName: (columnName: string) => string;
  getUniqueOptionsForField: (columnName: string) => Array<{value: any, label: string}>;
  onPasteFromClipboard?: () => void;
  onReplicateClick?: () => void;
  // Filtros globales para contextualizar
  paisSeleccionado?: string;
  empresaSeleccionada?: string;
  fundoSeleccionado?: string;
  // Datos para mostrar nombres en lugar de IDs
  paisesData?: any[];
  empresasData?: any[];
  fundosData?: any[];
}

const NormalInsertForm: React.FC<NormalInsertFormProps> = ({
  visibleColumns,
  formData,
  setFormData,
  selectedTable,
  loading,
  onInsert,
  onCancel,
  getColumnDisplayName,
  getUniqueOptionsForField,
  onPasteFromClipboard,
  onReplicateClick,
  paisSeleccionado,
  empresaSeleccionada,
  fundoSeleccionado,
  paisesData,
  empresasData,
  fundosData
}) => {
  console.log('🔍 NormalInsertForm renderizado:', {
    selectedTable,
    visibleColumnsLength: visibleColumns?.length,
    visibleColumns: visibleColumns?.map(c => c.columnName),
    paisSeleccionado,
    empresaSeleccionada,
    fundoSeleccionado,
    paisesDataLength: paisesData?.length,
    empresasDataLength: empresasData?.length,
    fundosDataLength: fundosData?.length
  });

  // Función para obtener el nombre de un país por ID
  const getPaisName = (paisId: string) => {
    console.log('🔍 getPaisName Debug:', { paisId, paisesData: paisesData?.length });
    const pais = paisesData?.find(p => p.paisid.toString() === paisId);
    return pais ? pais.pais : `País ${paisId}`;
  };

  // Función para obtener el nombre de una empresa por ID
  const getEmpresaName = (empresaId: string) => {
    const empresa = empresasData?.find(e => e.empresaid.toString() === empresaId);
    return empresa ? empresa.empresa : `Empresa ${empresaId}`;
  };

  // Función para obtener el nombre de un fundo por ID
  const getFundoName = (fundoId: string) => {
    const fundo = fundosData?.find(f => f.fundoid.toString() === fundoId);
    return fundo ? fundo.fundo : `Fundo ${fundoId}`;
  };

  // Función para determinar si un campo es obligatorio
  const isFieldRequired = (columnName: string): boolean => {
    const schema = tableValidationSchemas[selectedTable];
    if (!schema) return false;
    
    const rule = schema.find(rule => rule.field === columnName);
    return rule ? rule.required : false;
  };

  // Función para renderizar fila contextual con filtros globales
  const renderContextualRow = (fields: string[]) => {
    console.log('🔍 renderContextualRow Debug:', {
      selectedTable,
      fields,
      paisSeleccionado,
      empresaSeleccionada,
      fundoSeleccionado
    });
    
    const contextualFields = fields.map(field => {
      if (field === 'pais' && paisSeleccionado) {
        return (
          <div key="pais-contextual">
            <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
              PAÍS
            </label>
            <div className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white font-mono cursor-not-allowed opacity-75">
              {getPaisName(paisSeleccionado)}
            </div>
          </div>
        );
      } else if (field === 'empresa' && empresaSeleccionada) {
        return (
          <div key="empresa-contextual">
            <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
              EMPRESA
            </label>
            <div className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white font-mono cursor-not-allowed opacity-75">
              {getEmpresaName(empresaSeleccionada)}
            </div>
          </div>
        );
      } else if (field === 'fundo' && fundoSeleccionado) {
        return (
          <div key="fundo-contextual">
            <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
              FUNDO
            </label>
            <div className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white font-mono cursor-not-allowed opacity-75">
              {getFundoName(fundoSeleccionado)}
            </div>
          </div>
        );
      }
      return null;
    }).filter(Boolean);

    if (contextualFields.length > 0) {
  return (
        <div key="contextual-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {contextualFields}
        </div>
      );
    }
    return null;
  };

  // Función para renderizar campos con layout específico
  const renderSpecialLayoutFields = (): React.ReactNode[] => {
    console.log('🔍 renderSpecialLayoutFields Debug:', {
      selectedTable,
      visibleColumnsLength: visibleColumns?.length
    });
    
    if (selectedTable === 'umbral') {
      return renderUmbralFields();
    } else if (selectedTable === 'empresa') {
      return renderEmpresaFields();
    } else if (selectedTable === 'fundo') {
      return renderFundoFields();
    } else if (selectedTable === 'ubicacion') {
      return renderUbicacionFields();
    } else if (selectedTable === 'localizacion') {
      console.log('🔍 Llamando renderLocalizacionFields');
      return renderLocalizacionFields();
    } else if (selectedTable === 'entidad') {
      return renderEntidadFields();
    } else if (selectedTable === 'tipo') {
      return renderTipoFields();
    } else if (selectedTable === 'nodo') {
      return renderNodoFields();
    } else if (selectedTable === 'sensor') {
      return renderSensorFields();
    } else if (selectedTable === 'metricasensor') {
      return renderSensorMetricaFields();
    } else if (selectedTable === 'metrica') {
      return renderMetricaFields();
    } else if (selectedTable === 'usuario') {
      return renderStatusRightFields();
    } else {
      return visibleColumns.map(col => renderField(col));
    }
  };

  // Función para renderizar campos de umbral con layout específico y cascada
  const renderUmbralFields = (): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    
    // Fila contextual: País, Empresa, Fundo (si hay filtros globales)
    const contextualRow = renderContextualRow(['pais', 'empresa', 'fundo']);
    if (contextualRow) {
      result.push(contextualRow);
    }
    
    // Primera fila: Ubicación, Nodo, Tipo
    const ubicacionField = visibleColumns.find(c => c.columnName === 'ubicacionid');
    const nodoField = visibleColumns.find(c => c.columnName === 'nodoid');
    const tipoField = visibleColumns.find(c => c.columnName === 'tipoid');
    
    if (ubicacionField || nodoField || tipoField) {
      result.push(
        <div key="first-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Ubicación - siempre habilitada */}
          {ubicacionField && renderUmbralField(ubicacionField, true)}
          
          {/* Nodo - habilitado solo si hay ubicación seleccionada */}
          {nodoField && renderUmbralField(nodoField, !!formData.ubicacionid)}
          
          {/* Tipo - habilitado solo si hay nodo seleccionado */}
          {tipoField && renderUmbralField(tipoField, !!formData.nodoid)}
        </div>
      );
    }

    // Segunda fila: Métrica, (Valor Mínimo, Valor Máximo), Criticidad
    const metricaField = visibleColumns.find(c => c.columnName === 'metricaid');
    const minimoField = visibleColumns.find(c => c.columnName === 'minimo');
    const maximoField = visibleColumns.find(c => c.columnName === 'maximo');
    const criticidadField = visibleColumns.find(c => c.columnName === 'criticidadid');
    
    if (metricaField || minimoField || maximoField || criticidadField) {
      result.push(
        <div key="second-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Métrica - habilitada solo si hay tipo seleccionado */}
          {metricaField && renderUmbralField(metricaField, !!formData.tipoid)}
          
          {/* Valores - habilitados solo si hay métrica seleccionada */}
          <div className="bg-gray-600 bg-opacity-40 p-3 rounded-lg border border-gray-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {minimoField && renderUmbralField(minimoField, !!formData.metricaid)}
              {maximoField && renderUmbralField(maximoField, !!formData.metricaid)}
            </div>
          </div>
          
          {/* Criticidad - habilitada solo si hay métrica seleccionada */}
          {criticidadField && renderUmbralField(criticidadField, !!formData.metricaid)}
        </div>
      );
    }

    // Tercera fila: Nombre Umbral, (vacío), Status
    const umbralField = visibleColumns.find(c => c.columnName === 'umbral');
    const statusField = visibleColumns.find(c => c.columnName === 'statusid');
    
    if (umbralField || statusField) {
      result.push(
        <div key="third-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Nombre Umbral - habilitado solo si hay métrica seleccionada */}
          {umbralField && renderUmbralField(umbralField, !!formData.metricaid)}
          
          <div></div> {/* Espacio vacío */}
          
          {/* Status - habilitado solo si hay métrica seleccionada */}
          {statusField && renderUmbralField(statusField, !!formData.metricaid)}
        </div>
      );
    }

    return result;
  };

  // Función para renderizar un campo de umbral con lógica de cascada
  const renderUmbralField = (col: any, isEnabled: boolean): React.ReactNode => {
    const displayName = getColumnDisplayName(col.columnName);
    if (!displayName) return null;
    
    const value = formData[col.columnName] || '';
    
    // Campos automáticos - NO mostrar en formulario
    if (['usercreatedid', 'usermodifiedid', 'datecreated', 'datemodified'].includes(col.columnName)) {
      return null;
    }

    // Campo statusid como checkbox
    if (col.columnName === 'statusid') {
      return (
        <div key={col.columnName} className="mb-4">
          <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${
            isEnabled ? 'text-orange-500' : 'text-gray-500'
          }`}>
            {displayName.toUpperCase()}
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={value === 1}
              disabled={!isEnabled}
              onChange={(e) => {
                if (isEnabled) {
                  setFormData({
                    ...formData,
                    [col.columnName]: e.target.checked ? 1 : 0
                  });
                }
              }}
              className={`w-5 h-5 text-orange-500 bg-neutral-800 border-neutral-600 rounded focus:ring-orange-500 focus:ring-2 ${
                !isEnabled ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            />
            <span className={`font-mono tracking-wider ${
              isEnabled ? 'text-white' : 'text-gray-500'
            }`}>
              {value === 1 ? 'ACTIVO' : 'INACTIVO'}
            </span>
          </div>
        </div>
      );
    }

    // Campos de texto (umbral, minimo, maximo)
    if (['umbral', 'minimo', 'maximo'].includes(col.columnName)) {
      return (
        <div key={col.columnName} className="mb-4">
          <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${
            isEnabled ? 'text-orange-500' : 'text-gray-500'
          }`}>
            {displayName.toUpperCase()}
          </label>
          <input
            type={col.columnName === 'umbral' ? 'text' : 'number'}
            value={value}
            disabled={!isEnabled}
            onChange={(e) => {
              if (isEnabled) {
                setFormData({
                  ...formData,
                  [col.columnName]: e.target.value
                });
              }
            }}
            placeholder={col.columnName === 'umbral' ? 'Ingrese nombre umbral' : `Ingrese ${col.columnName}`}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-gray-700 text-white ${
              !isEnabled ? 'opacity-50 cursor-not-allowed border-gray-600' : 'border-gray-300'
            }`}
          />
        </div>
      );
    }

    // Campos de selección (ubicacionid, nodoid, tipoid, metricaid, criticidadid)
    const options = getUniqueOptionsForField(col.columnName);
    const placeholder = `Seleccionar ${displayName.toLowerCase()}`;
    
    return (
      <div key={col.columnName} className="mb-4">
        <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${
          isEnabled ? 'text-orange-500' : 'text-gray-500'
        }`}>
          {displayName.toUpperCase()}
        </label>
        <SelectWithPlaceholder
          value={value}
          onChange={(newValue) => {
            if (isEnabled) {
              // Limpiar campos dependientes cuando cambia un campo padre
              const newFormData: any = { ...formData, [col.columnName]: newValue ? parseInt(newValue.toString()) : null };
              
              // Limpiar campos dependientes según la cascada
              if (col.columnName === 'ubicacionid') {
                newFormData['nodoid'] = null;
                newFormData['tipoid'] = null;
                newFormData['metricaid'] = null;
                newFormData['criticidadid'] = null;
                newFormData['minimo'] = '';
                newFormData['maximo'] = '';
                newFormData['umbral'] = '';
                newFormData['statusid'] = 1; // Mantener status por defecto
              } else if (col.columnName === 'nodoid') {
                newFormData['tipoid'] = null;
                newFormData['metricaid'] = null;
                newFormData['criticidadid'] = null;
                newFormData['minimo'] = '';
                newFormData['maximo'] = '';
                newFormData['umbral'] = '';
                newFormData['statusid'] = 1; // Mantener status por defecto
              } else if (col.columnName === 'tipoid') {
                newFormData['metricaid'] = null;
                newFormData['criticidadid'] = null;
                newFormData['minimo'] = '';
                newFormData['maximo'] = '';
                newFormData['umbral'] = '';
                newFormData['statusid'] = 1; // Mantener status por defecto
              } else if (col.columnName === 'metricaid') {
                newFormData['criticidadid'] = null;
                newFormData['minimo'] = '';
                newFormData['maximo'] = '';
                newFormData['umbral'] = '';
                newFormData['statusid'] = 1; // Mantener status por defecto
              }
              
              setFormData(newFormData);
            }
          }}
          options={options}
          placeholder={placeholder}
          disabled={!isEnabled}
        />
      </div>
    );
  };

  // Función para renderizar campos de Empresa con layout específico
  const renderEmpresaFields = (): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    
    // Auto-seleccionar País si solo hay una opción
    const paisOptions = getUniqueOptionsForField('paisid');
    if (paisOptions.length === 1 && !formData.paisid) {
      setFormData({ ...formData, paisid: paisOptions[0].value });
    }
    
    // Primera fila: País (si hay múltiples opciones, mostrar dropdown; si solo una, mostrar como texto)
    const paisField = visibleColumns.find(c => c.columnName === 'paisid');
    if (paisField) {
      if (paisOptions.length === 1) {
        // Mostrar como texto cuando solo hay una opción
        result.push(
          <div key="pais-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
                PAÍS
              </label>
              <div className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white font-mono cursor-not-allowed opacity-75">
                {paisOptions[0].label}
              </div>
            </div>
            <div></div> {/* Espacio vacío */}
            <div></div> {/* Espacio vacío */}
          </div>
        );
      } else {
        // Mostrar dropdown cuando hay múltiples opciones
        result.push(
          <div key="pais-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {renderField(paisField)}
            <div></div> {/* Espacio vacío */}
            <div></div> {/* Espacio vacío */}
          </div>
        );
      }
    }
    
    // Segunda fila: Empresa, Abreviatura, Status
    const empresaField = visibleColumns.find(c => c.columnName === 'empresa');
    const abreviaturaField = visibleColumns.find(c => c.columnName === 'empresabrev');
    const statusField = visibleColumns.find(c => c.columnName === 'statusid');
    
    if (empresaField || abreviaturaField || statusField) {
      result.push(
        <div key="second-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {empresaField && renderField(empresaField)}
          {abreviaturaField && renderField(abreviaturaField)}
          {statusField && renderField(statusField)}
        </div>
      );
    }
    
    return result;
  };

  // Función para renderizar campos de Fundo con layout específico
  const renderFundoFields = (): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    
    // Fila contextual: País, Empresa (si hay filtros globales)
    const contextualRow = renderContextualRow(['pais', 'empresa']);
    if (contextualRow) {
      result.push(contextualRow);
    }
    
    // Primera fila: Fundo, Abreviatura, Status
    const fundoField = visibleColumns.find(c => c.columnName === 'fundo');
    const abreviaturaField = visibleColumns.find(c => c.columnName === 'fundoabrev');
    const statusField = visibleColumns.find(c => c.columnName === 'statusid');
    
    if (fundoField || abreviaturaField || statusField) {
      result.push(
        <div key="first-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {fundoField && renderField(fundoField)}
          {abreviaturaField && renderField(abreviaturaField)}
          {statusField && renderField(statusField)}
        </div>
      );
    }
    
    return result;
  };

  // Función para renderizar campos de Ubicación con layout específico
  const renderUbicacionFields = (): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    
    // Fila contextual: País, Empresa, Fundo (si hay filtros globales)
    const contextualRow = renderContextualRow(['pais', 'empresa', 'fundo']);
    if (contextualRow) {
      result.push(contextualRow);
    }
    
    // Primera fila: Ubicación, Status
    const ubicacionField = visibleColumns.find(c => c.columnName === 'ubicacion');
    const statusField = visibleColumns.find(c => c.columnName === 'statusid');
    
    if (ubicacionField || statusField) {
      result.push(
        <div key="first-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {ubicacionField && renderField(ubicacionField)}
          <div></div> {/* Espacio vacío */}
          {statusField && renderField(statusField)}
        </div>
      );
    }
    
    return result;
  };

  // Función para renderizar campos de Tipo con layout específico
  const renderTipoFields = (): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    
    // Primera fila: Entidad, Tipo, Status
    const entidadField = visibleColumns.find(c => c.columnName === 'entidadid');
    const tipoField = visibleColumns.find(c => c.columnName === 'tipo');
    const statusField = visibleColumns.find(c => c.columnName === 'statusid');
    
    if (entidadField || tipoField || statusField) {
      result.push(
        <div key="first-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {entidadField && renderField(entidadField)}
          {tipoField && renderField(tipoField)}
          {statusField && renderField(statusField)}
        </div>
      );
    }
    
    return result;
  };

  // Función para renderizar campos de Entidad con layout específico
  const renderEntidadFields = (): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    
    // Fila contextual: País, Empresa, Fundo (si hay filtros globales)
    const contextualRow = renderContextualRow(['pais', 'empresa', 'fundo']);
    if (contextualRow) {
      result.push(contextualRow);
    }
    
    // Primera fila: Entidad, Status
    const entidadField = visibleColumns.find(c => c.columnName === 'entidad');
    const statusField = visibleColumns.find(c => c.columnName === 'statusid');
    
    if (entidadField || statusField) {
      result.push(
        <div key="first-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {entidadField && renderField(entidadField)}
          <div></div> {/* Espacio vacío */}
          {statusField && renderField(statusField)}
        </div>
      );
    }
    
    return result;
  };

  // Función para renderizar campos de Nodo con layout específico
  const renderNodoFields = (): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    
    // Renderizar el resto de campos normalmente
    const otherFields = visibleColumns.filter(col => !['paisid', 'empresaid', 'fundoid'].includes(col.columnName));
    if (otherFields.length > 0) {
      result.push(
        <div key="fields-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {otherFields.map(col => renderField(col))}
        </div>
      );
    }
    
    return result;
  };

  // Función para renderizar campos de Sensor con layout específico
  const renderSensorFields = (): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    
    // Renderizar el resto de campos normalmente
    const otherFields = visibleColumns.filter(col => !['paisid', 'empresaid', 'fundoid'].includes(col.columnName));
    if (otherFields.length > 0) {
      result.push(
        <div key="fields-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {otherFields.map(col => renderField(col))}
        </div>
      );
    }
    
    return result;
  };

  // Función para renderizar campos de Sensor Metrica con layout específico
  const renderSensorMetricaFields = (): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    
    // Renderizar el resto de campos normalmente
    const otherFields = visibleColumns.filter(col => !['paisid', 'empresaid', 'fundoid'].includes(col.columnName));
    if (otherFields.length > 0) {
      result.push(
        <div key="fields-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {otherFields.map(col => renderField(col))}
        </div>
      );
    }
    
    return result;
  };

  // Función para renderizar campos de Metrica con layout específico
  const renderMetricaFields = (): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    
    // Renderizar el resto de campos normalmente
    const otherFields = visibleColumns.filter(col => !['paisid', 'empresaid', 'fundoid'].includes(col.columnName));
    if (otherFields.length > 0) {
      result.push(
        <div key="fields-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {otherFields.map(col => renderField(col))}
        </div>
      );
    }
    
    return result;
  };

  // Función para renderizar campos con Status al extremo derecho (Usuario)
  const renderStatusRightFields = (): React.ReactNode[] => {
    const statusField = visibleColumns.find(col => col.columnName === 'statusid');
    const otherFields = visibleColumns.filter(col => col.columnName !== 'statusid');
    
    const result: React.ReactNode[] = [];
    
    // Primera fila: todos los campos excepto status
    const firstRow = otherFields.map(col => renderField(col)).filter(Boolean);
    
    if (firstRow.length > 0) {
      result.push(
        <div key="first-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {firstRow}
        </div>
      );
    }
    
    // Segunda fila: Status al extremo derecho
    if (statusField) {
      result.push(
        <div key="second-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div></div> {/* Espacio vacío */}
          <div></div> {/* Espacio vacío */}
          {renderField(statusField)}
        </div>
      );
    }
    
    return result;
  };

  // Función para renderizar campos de Localización con layout específico
  const renderLocalizacionFields = (): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    
    // Fila contextual: País, Empresa, Fundo (si hay filtros globales)
    const contextualRow = renderContextualRow(['pais', 'empresa', 'fundo']);
    if (contextualRow) {
      result.push(contextualRow);
    }
    
    // Segunda fila: Entidad, Ubicación, Nodo
    const entidadField = visibleColumns.find(c => c.columnName === 'entidadid');
    const ubicacionField = visibleColumns.find(c => c.columnName === 'ubicacionid');
    const nodoField = visibleColumns.find(c => c.columnName === 'nodoid');
    
    console.log('🔍 renderLocalizacionFields - Segunda fila:', {
      entidadField: entidadField?.columnName,
      ubicacionField: ubicacionField?.columnName,
      nodoField: nodoField?.columnName,
      visibleColumns: visibleColumns.map(c => c.columnName)
    });
    
    if (entidadField || ubicacionField || nodoField) {
      result.push(
        <div key="second-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {entidadField && renderLocalizacionField(entidadField, 'entidad')}
          {ubicacionField && renderLocalizacionField(ubicacionField, 'ubicacion')}
          {nodoField && renderLocalizacionField(nodoField, 'nodo')}
        </div>
      );
    }
    
    // Tercera fila: Latitud, Longitud, Referencia
    const latitudField = visibleColumns.find(c => c.columnName === 'latitud');
    const longitudField = visibleColumns.find(c => c.columnName === 'longitud');
    const referenciaField = visibleColumns.find(c => c.columnName === 'referencia');
    
    if (latitudField || longitudField || referenciaField) {
      result.push(
        <div key="third-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {latitudField && renderLocalizacionField(latitudField, 'coordenadas')}
          {longitudField && renderLocalizacionField(longitudField, 'coordenadas')}
          {referenciaField && renderLocalizacionField(referenciaField, 'coordenadas')}
        </div>
      );
    }
    
    // Cuarta fila: Status al extremo derecho
    const statusField = visibleColumns.find(c => c.columnName === 'statusid');
    if (statusField) {
      result.push(
        <div key="fourth-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div></div> {/* Espacio vacío */}
          <div></div> {/* Espacio vacío */}
          {renderField(statusField)}
        </div>
      );
    }
    
    return result;
  };

  // Función para obtener opciones de nodos filtradas para localización
  const getFilteredNodoOptions = () => {
    // Obtener todos los nodos disponibles
    const allNodos = getUniqueOptionsForField('nodoid');
    
    if (!formData.entidadid || !formData.ubicacionid) {
      return allNodos;
    }

    // Obtener datos de localizaciones existentes para filtrar nodos ya asignados
    // Esto se hace a través de getUniqueOptionsForField que internamente usa los datos cargados
    const localizacionesData = getUniqueOptionsForField('localizacionid');
    
    // Filtrar nodos que no estén ya asignados a una localización con la misma entidad y ubicación
    const filteredNodos = allNodos.filter(nodo => {
      // Verificar si el nodo ya está asignado a una localización con la misma entidad y ubicación
      // Como no tenemos acceso directo a los datos de localizaciones aquí, 
      // por ahora devolvemos todos los nodos disponibles
      // En una implementación más robusta, se podría hacer una consulta específica
      return true;
    });

    console.log('🔍 getFilteredNodoOptions Debug:', {
      entidadid: formData.entidadid,
      ubicacionid: formData.ubicacionid,
      totalNodos: allNodos.length,
      filteredNodos: filteredNodos.length,
      localizacionesCount: localizacionesData.length
    });

    return filteredNodos;
  };

  // Función para renderizar campos de localización con dependencias en cascada
  const renderLocalizacionField = (col: any, fieldType: 'entidad' | 'ubicacion' | 'nodo' | 'coordenadas'): React.ReactNode => {
    const displayName = getColumnDisplayName(col.columnName);
    if (!displayName) return null;
    
    const value = formData[col.columnName] || '';
    
    // Determinar si el campo debe estar deshabilitado
    const isDisabled = (() => {
      switch (fieldType) {
        case 'entidad':
          return false; // Entidad siempre habilitada
        case 'ubicacion':
          return !formData.entidadid; // Ubicación solo habilitada si hay entidad
        case 'nodo':
          return !formData.ubicacionid; // Nodo solo habilitado si hay ubicación
        case 'coordenadas':
          return !formData.nodoid; // Coordenadas solo habilitadas si hay nodo
        default:
          return false;
      }
    })();

    // Renderizar campo de entidad
    if (fieldType === 'entidad') {
      const options = getUniqueOptionsForField(col.columnName);
      return (
        <div key={col.columnName} className="mb-4">
          <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
            {displayName.toUpperCase()}
          </label>
          <SelectWithPlaceholder
            value={value}
            onChange={(newValue) => {
              const newFormData: any = {
                ...formData,
                [col.columnName]: newValue ? parseInt(newValue.toString()) : null
              };
              // Limpiar campos dependientes cuando cambia la entidad
              if (!newValue) {
                newFormData.ubicacionid = null;
                newFormData.nodoid = null;
                newFormData.latitud = '';
                newFormData.longitud = '';
                newFormData.referencia = '';
              }
              setFormData(newFormData);
            }}
            options={options}
            placeholder="Seleccionar entidad"
            disabled={isDisabled}
          />
        </div>
      );
    }

    // Renderizar campo de ubicación
    if (fieldType === 'ubicacion') {
      const options = getUniqueOptionsForField(col.columnName);
      return (
        <div key={col.columnName} className="mb-4">
          <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
            {displayName.toUpperCase()}
          </label>
          <SelectWithPlaceholder
            value={value}
            onChange={(newValue) => {
              const newFormData: any = {
                ...formData,
                [col.columnName]: newValue ? parseInt(newValue.toString()) : null
              };
              // Limpiar campos dependientes cuando cambia la ubicación
              if (!newValue) {
                newFormData.nodoid = null;
                newFormData.latitud = '';
                newFormData.longitud = '';
                newFormData.referencia = '';
              }
              setFormData(newFormData);
            }}
            options={options}
            placeholder="Seleccionar ubicación"
            disabled={isDisabled}
          />
        </div>
      );
    }

    // Renderizar campo de nodo
    if (fieldType === 'nodo') {
      // Filtrar nodos basado en los filtros contextuales y la entidad seleccionada
      const options = getFilteredNodoOptions();
      return (
        <div key={col.columnName} className="mb-4">
          <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
            {displayName.toUpperCase()}
          </label>
          <SelectWithPlaceholder
            value={value}
            onChange={(newValue) => {
              const newFormData: any = {
                ...formData,
                [col.columnName]: newValue ? parseInt(newValue.toString()) : null
              };
              // Limpiar campos dependientes cuando cambia el nodo
              if (!newValue) {
                newFormData.latitud = '';
                newFormData.longitud = '';
                newFormData.referencia = '';
              }
              setFormData(newFormData);
            }}
            options={options}
            placeholder="Seleccionar nodo"
            disabled={isDisabled}
          />
        </div>
      );
    }

    // Renderizar campos de coordenadas (latitud, longitud, referencia)
    if (fieldType === 'coordenadas') {
      return (
        <div key={col.columnName} className="mb-4">
          <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
            {displayName.toUpperCase()}
          </label>
          <input
            type={col.columnName === 'latitud' || col.columnName === 'longitud' ? 'number' : 'text'}
            value={value}
            onChange={(e) => setFormData({
              ...formData,
              [col.columnName]: col.columnName === 'latitud' || col.columnName === 'longitud' 
                ? parseFloat(e.target.value) || 0 
                : e.target.value
            })}
            placeholder={col.columnName === 'latitud' ? 'Ingrese latitud' : 
                       col.columnName === 'longitud' ? 'Ingrese longitud' : 
                       'Ingrese referencia'}
            disabled={isDisabled}
            className={`w-full px-3 py-2 bg-neutral-800 border rounded-lg text-white font-mono focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
              isDisabled 
                ? 'border-neutral-600 bg-neutral-700 cursor-not-allowed opacity-75' 
                : 'border-neutral-600'
            }`}
          />
        </div>
      );
    }

    return null;
  };

  // Función para renderizar un campo individual
  const renderField = (col: any): React.ReactNode => {
          const displayName = getColumnDisplayName(col.columnName);
          if (!displayName) return null;
          
          const value = formData[col.columnName] || '';
          
          // Campos automáticos - NO mostrar en formulario
          if (['usercreatedid', 'usermodifiedid', 'datecreated', 'datemodified'].includes(col.columnName)) {
            return null;
          }

          // Campo statusid como checkbox
          if (col.columnName === 'statusid') {
            return (
              <div key={col.columnName} className="mb-4">
                <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
                  {displayName.toUpperCase()}
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={value === 1}
                    onChange={(e) => setFormData({
                      ...formData,
                      [col.columnName]: e.target.checked ? 1 : 0
                    })}
                    className="w-5 h-5 text-orange-500 bg-neutral-800 border-neutral-600 rounded focus:ring-orange-500 focus:ring-2"
                  />
                  <span className="text-white font-mono tracking-wider">
                    {value === 1 ? 'ACTIVO' : 'INACTIVO'}
                  </span>
                </div>
              </div>
            );
          }

          // Campos de relación para empresa
          if (col.columnName === 'paisid' && selectedTable === 'empresa') {
            const options = getUniqueOptionsForField(col.columnName);
            const isRequired = isFieldRequired(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
                  {displayName.toUpperCase()}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder={`Seleccionar país${isRequired ? '*' : ''}`}
                />
              </div>
            );
          }

          // Campos de relación para fundo
          if (col.columnName === 'empresaid' && selectedTable === 'fundo') {
            const options = getUniqueOptionsForField(col.columnName);
            const isRequired = isFieldRequired(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
                  {displayName.toUpperCase()}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder={`Seleccionar empresa${isRequired ? '*' : ''}`}
                />
              </div>
            );
          }

          // Campos de relación para ubicacion
          if (col.columnName === 'fundoid' && selectedTable === 'ubicacion') {
            const options = getUniqueOptionsForField(col.columnName);
            const isRequired = isFieldRequired(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
                  {displayName.toUpperCase()}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder={`Seleccionar fundo${isRequired ? '*' : ''}`}
                />
              </div>
            );
          }

          // Campos de relación para localizacion
          if (col.columnName === 'ubicacionid' && selectedTable === 'localizacion') {
            const options = getUniqueOptionsForField(col.columnName);
            const isRequired = isFieldRequired(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
                  {displayName.toUpperCase()}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder={`Seleccionar ubicación${isRequired ? '*' : ''}`}
                />
              </div>
            );
          }

          if (col.columnName === 'nodoid' && selectedTable === 'localizacion') {
            const options = getUniqueOptionsForField(col.columnName);
            const isRequired = isFieldRequired(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
                  {displayName.toUpperCase()}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder={`Seleccionar nodo${isRequired ? '*' : ''}`}
                />
              </div>
            );
          }

          if (col.columnName === 'entidadid' && (selectedTable === 'localizacion' || selectedTable === 'tipo')) {
            const options = getUniqueOptionsForField(col.columnName);
            const isRequired = isFieldRequired(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
                  {displayName.toUpperCase()}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder={`Seleccionar entidad${isRequired ? '*' : ''}`}
                />
              </div>
            );
          }

          // Campos de relación para sensor
          if (col.columnName === 'nodoid' && selectedTable === 'sensor') {
            const options = getUniqueOptionsForField(col.columnName);
            const isRequired = isFieldRequired(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
                  {displayName.toUpperCase()}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder={`Seleccionar nodo${isRequired ? '*' : ''}`}
                />
              </div>
            );
          }

          if (col.columnName === 'tipoid' && selectedTable === 'sensor') {
            const options = getUniqueOptionsForField(col.columnName);
            const isRequired = isFieldRequired(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
                  {displayName.toUpperCase()}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder={`Seleccionar tipo${isRequired ? '*' : ''}`}
                />
              </div>
            );
          }

          // Campos de relación para metricasensor
          if (col.columnName === 'nodoid' && selectedTable === 'metricasensor') {
            const options = getUniqueOptionsForField(col.columnName);
            const isRequired = isFieldRequired(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
                  {displayName.toUpperCase()}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder={`Seleccionar nodo${isRequired ? '*' : ''}`}
                />
              </div>
            );
          }

          if (col.columnName === 'metricaid' && selectedTable === 'metricasensor') {
            const options = getUniqueOptionsForField(col.columnName);
            const isRequired = isFieldRequired(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
                  {displayName.toUpperCase()}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder={`Seleccionar métrica${isRequired ? '*' : ''}`}
                />
              </div>
            );
          }

          if (col.columnName === 'tipoid' && selectedTable === 'metricasensor') {
            const options = getUniqueOptionsForField(col.columnName);
            const isRequired = isFieldRequired(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
                  {displayName.toUpperCase()}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder={`Seleccionar tipo${isRequired ? '*' : ''}`}
                />
              </div>
            );
          }

          // Combobox para umbral - ubicacionid, criticidadid, nodoid, metricaid, tipoid
          if (col.columnName === 'ubicacionid' && selectedTable === 'umbral') {
            const options = getUniqueOptionsForField(col.columnName);
            const isRequired = isFieldRequired(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
                  {displayName.toUpperCase()}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder={`Seleccionar ubicación${isRequired ? '*' : ''}`}
                />
              </div>
            );
          }

          if (col.columnName === 'criticidadid' && selectedTable === 'umbral') {
            const options = getUniqueOptionsForField(col.columnName);
            const isRequired = isFieldRequired(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
                  {displayName.toUpperCase()}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder={`Seleccionar criticidad${isRequired ? '*' : ''}`}
                />
              </div>
            );
          }

          if (col.columnName === 'nodoid' && selectedTable === 'umbral') {
            const options = getUniqueOptionsForField(col.columnName);
            const isRequired = isFieldRequired(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
                  {displayName.toUpperCase()}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder={`Seleccionar nodo${isRequired ? '*' : ''}`}
                />
              </div>
            );
          }

          if (col.columnName === 'metricaid' && selectedTable === 'umbral') {
            const options = getUniqueOptionsForField(col.columnName);
            const isRequired = isFieldRequired(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
                  {displayName.toUpperCase()}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder={`Seleccionar métrica${isRequired ? '*' : ''}`}
                />
              </div>
            );
          }

          if (col.columnName === 'tipoid' && selectedTable === 'umbral') {
            const options = getUniqueOptionsForField(col.columnName);
            const isRequired = isFieldRequired(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
                  {displayName.toUpperCase()}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder={`Seleccionar tipo${isRequired ? '*' : ''}`}
                />
              </div>
            );
          }

          // Combobox para perfilumbral - perfilid, umbralid
          if (col.columnName === 'perfilid' && selectedTable === 'perfilumbral') {
            const options = getUniqueOptionsForField(col.columnName);
            const isRequired = isFieldRequired(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
                  {displayName.toUpperCase()}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder={`Seleccionar perfil${isRequired ? '*' : ''}`}
                />
              </div>
            );
          }

          if (col.columnName === 'umbralid' && selectedTable === 'perfilumbral') {
            const options = getUniqueOptionsForField(col.columnName);
            const isRequired = isFieldRequired(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
                  {displayName.toUpperCase()}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder={`Seleccionar umbral${isRequired ? '*' : ''}`}
                />
              </div>
            );
          }

          // Combobox para audit_log_umbral - umbralid, modified_by
          if (col.columnName === 'umbralid' && selectedTable === 'audit_log_umbral') {
            const options = getUniqueOptionsForField(col.columnName);
            const isRequired = isFieldRequired(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
                  {displayName.toUpperCase()}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder={`Seleccionar umbral${isRequired ? '*' : ''}`}
                />
              </div>
            );
          }

          if (col.columnName === 'modified_by' && selectedTable === 'audit_log_umbral') {
            const options = getUniqueOptionsForField(col.columnName);
            const isRequired = isFieldRequired(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
                  {displayName.toUpperCase()}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder={`Seleccionar usuario${isRequired ? '*' : ''}`}
                />
              </div>
            );
          }

          // Combobox para usuarioperfil - usuarioid, perfilid
          if (col.columnName === 'usuarioid' && selectedTable === 'usuarioperfil') {
            const options = getUniqueOptionsForField(col.columnName);
            const isRequired = isFieldRequired(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
                  {displayName.toUpperCase()}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder={`Seleccionar usuario${isRequired ? '*' : ''}`}
                />
              </div>
            );
          }

          if (col.columnName === 'perfilid' && selectedTable === 'usuarioperfil') {
            const options = getUniqueOptionsForField(col.columnName);
            const isRequired = isFieldRequired(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
                  {displayName.toUpperCase()}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder={`Seleccionar perfil${isRequired ? '*' : ''}`}
                />
              </div>
            );
          }

          // Combobox para contacto - usuarioid, medioid
          if (col.columnName === 'usuarioid' && selectedTable === 'contacto') {
            const options = getUniqueOptionsForField(col.columnName);
            const isRequired = isFieldRequired(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
                  {displayName.toUpperCase()}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder={`Seleccionar usuario${isRequired ? '*' : ''}`}
                />
              </div>
            );
          }

          if (col.columnName === 'medioid' && selectedTable === 'contacto') {
            const options = getUniqueOptionsForField(col.columnName);
            const isRequired = isFieldRequired(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
                  {displayName.toUpperCase()}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder={`Seleccionar medio${isRequired ? '*' : ''}`}
                />
              </div>
            );
          }

          // Campo de texto normal
          const isRequired = isFieldRequired(col.columnName);
          return (
            <div key={col.columnName} className="mb-4">
              <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
                {displayName.toUpperCase()}
              </label>
              <input
                type="text"
                value={value}
                onChange={(e) => setFormData({
                  ...formData,
                  [col.columnName]: e.target.value
                })}
                className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-neutral-400 font-mono"
                placeholder={`${displayName.toUpperCase()}${isRequired ? '*' : ''}`}
              />
            </div>
          );
  };

  return (
    <div>
      {/* Contenido del formulario */}
      <div>
        {['usuario', 'empresa', 'fundo', 'ubicacion', 'localizacion', 'entidad', 'tipo', 'nodo', 'sensor', 'metricasensor', 'metrica', 'umbral'].includes(selectedTable) ? (
          <div>
            {renderSpecialLayoutFields()}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {visibleColumns.map(col => renderField(col))}
          </div>
        )}
      </div>

      {/* Leyenda de campos obligatorios en esquina inferior izquierda */}
      <div className="absolute bottom-0 left-0 text-sm text-neutral-400 font-mono">
        (*) Campo obligatorio
      </div>

      {/* Botones de acción centrados */}
      <div className="flex justify-center items-center mt-8 space-x-4">
        <button
          onClick={onInsert}
          disabled={loading}
          className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-mono tracking-wider"
        >
          <span>➕</span>
          <span>{loading ? 'GUARDANDO...' : 'GUARDAR'}</span>
        </button>
        
        <button
          onClick={onCancel}
          className="px-6 py-2 bg-neutral-800 border border-neutral-600 text-white rounded-lg hover:bg-neutral-700 transition-colors font-medium flex items-center space-x-2 font-mono tracking-wider"
        >
          <span>❌</span>
          <span>CANCELAR</span>
        </button>
        
        {selectedTable === 'sensor' && onPasteFromClipboard && (
          <button
            onClick={onPasteFromClipboard}
            className="px-6 py-2 bg-neutral-800 border border-neutral-600 text-white rounded-lg hover:bg-neutral-700 transition-colors font-medium font-mono tracking-wider"
          >
            PEGAR DESDE PORTAPAPELES
          </button>
        )}
      </div>
    </div>
  );
};

export default NormalInsertForm;
