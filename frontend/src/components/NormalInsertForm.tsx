import React from 'react';
import SelectWithPlaceholder from './SelectWithPlaceholder';
import ReplicateButton from './ReplicateButton';

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
  onReplicateClick
}) => {

  // Función para renderizar campos con layout específico
  const renderSpecialLayoutFields = (): React.ReactNode[] => {
    if (selectedTable === 'umbral') {
      return renderUmbralFields();
    } else if (selectedTable === 'empresa') {
      return renderEmpresaFields();
    } else if (selectedTable === 'fundo') {
      return renderFundoFields();
    } else if (selectedTable === 'ubicacion') {
      return renderUbicacionFields();
    } else if (selectedTable === 'localizacion') {
      return renderLocalizacionFields();
    } else if (selectedTable === 'tipo') {
      return renderTipoFields();
    } else if (selectedTable === 'usuario') {
      return renderStatusRightFields();
    } else {
      return visibleColumns.map(col => renderField(col));
    }
  };

  // Función para renderizar campos de umbral con layout específico
  const renderUmbralFields = (): React.ReactNode[] => {

    // Definir el orden específico para umbral
    const umbralFieldOrder = ['ubicacionid', 'nodoid', 'metricaid', 'criticidadid', 'minimo', 'maximo', 'umbral', 'tipoid', 'statusid'];
    
    const result: React.ReactNode[] = [];
    
    // Primera fila: Ubicación, Nodo, Métrica
    const firstRowFields = ['ubicacionid', 'nodoid', 'metricaid'];
    const firstRow = firstRowFields.map(fieldName => {
      const col = visibleColumns.find(c => c.columnName === fieldName);
      return col ? renderField(col) : null;
    }).filter(Boolean);
    
    if (firstRow.length > 0) {
      result.push(
        <div key="first-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {firstRow}
        </div>
      );
    }

    // Segunda fila: Criticidad, Valor Mínimo, Valor Máximo (con contenedor especial)
    const secondRowFields = ['criticidadid', 'minimo', 'maximo'];
    const criticidadField = visibleColumns.find(c => c.columnName === 'criticidadid');
    const minimoField = visibleColumns.find(c => c.columnName === 'minimo');
    const maximoField = visibleColumns.find(c => c.columnName === 'maximo');
    
    if (criticidadField || minimoField || maximoField) {
      result.push(
        <div key="second-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {criticidadField && renderField(criticidadField)}
          <div className="bg-gray-600 bg-opacity-40 p-3 rounded-lg border border-gray-500">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {minimoField && renderField(minimoField)}
              {maximoField && renderField(maximoField)}
            </div>
          </div>
        </div>
      );
    }

    // Tercera fila: Nombre Umbral, Tipo, Status
    const thirdRowFields = ['umbral', 'tipoid', 'statusid'];
    const thirdRow = thirdRowFields.map(fieldName => {
      const col = visibleColumns.find(c => c.columnName === fieldName);
      return col ? renderField(col) : null;
    }).filter(Boolean);
    
    if (thirdRow.length > 0) {
      result.push(
        <div key="third-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {thirdRow}
        </div>
      );
    }

    return result;
  };

  // Función para renderizar campos de Empresa con layout específico
  const renderEmpresaFields = (): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    
    // Primera fila: País, Empresa, Abreviatura
    const paisField = visibleColumns.find(c => c.columnName === 'paisid');
    const empresaField = visibleColumns.find(c => c.columnName === 'empresa');
    const abreviaturaField = visibleColumns.find(c => c.columnName === 'empresabrev');
    
    if (paisField || empresaField || abreviaturaField) {
      result.push(
        <div key="first-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {paisField && renderField(paisField)}
          {empresaField && renderField(empresaField)}
          {abreviaturaField && renderField(abreviaturaField)}
        </div>
      );
    }
    
    // Segunda fila: Status al extremo derecho
    const statusField = visibleColumns.find(c => c.columnName === 'statusid');
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

  // Función para renderizar campos de Fundo con layout específico
  const renderFundoFields = (): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    
    // Primera fila: Empresa, Fundo, Abreviatura
    const empresaField = visibleColumns.find(c => c.columnName === 'empresaid');
    const fundoField = visibleColumns.find(c => c.columnName === 'fundo');
    const abreviaturaField = visibleColumns.find(c => c.columnName === 'fundobrev');
    
    if (empresaField || fundoField || abreviaturaField) {
      result.push(
        <div key="first-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {empresaField && renderField(empresaField)}
          {fundoField && renderField(fundoField)}
          {abreviaturaField && renderField(abreviaturaField)}
        </div>
      );
    }
    
    // Segunda fila: Status al extremo derecho
    const statusField = visibleColumns.find(c => c.columnName === 'statusid');
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

  // Función para renderizar campos de Ubicación con layout específico
  const renderUbicacionFields = (): React.ReactNode[] => {
    const result: React.ReactNode[] = [];
    
    // Primera fila: Fundo, Ubicación, Abreviatura
    const fundoField = visibleColumns.find(c => c.columnName === 'fundoid');
    const ubicacionField = visibleColumns.find(c => c.columnName === 'ubicacion');
    const abreviaturaField = visibleColumns.find(c => c.columnName === 'ubicacionabrev');
    
    if (fundoField || ubicacionField || abreviaturaField) {
      result.push(
        <div key="first-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {fundoField && renderField(fundoField)}
          {ubicacionField && renderField(ubicacionField)}
          {abreviaturaField && renderField(abreviaturaField)}
        </div>
      );
    }
    
    // Segunda fila: Status al extremo derecho
    const statusField = visibleColumns.find(c => c.columnName === 'statusid');
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
    
    // Primera fila: Entidad, Ubicación, Nodo
    const entidadField = visibleColumns.find(c => c.columnName === 'entidadid');
    const ubicacionField = visibleColumns.find(c => c.columnName === 'ubicacionid');
    const nodoField = visibleColumns.find(c => c.columnName === 'nodoid');
    
    if (entidadField || ubicacionField || nodoField) {
      result.push(
        <div key="first-row" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {entidadField && renderField(entidadField)}
          {ubicacionField && renderField(ubicacionField)}
          {nodoField && renderField(nodoField)}
        </div>
      );
    }
    
    // Segunda fila: Status al extremo derecho
    const statusField = visibleColumns.find(c => c.columnName === 'statusid');
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
                <label className="block text-lg font-bold text-white mb-2">
                  {displayName}
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={value === 1}
                    onChange={(e) => setFormData({
                      ...formData,
                      [col.columnName]: e.target.checked ? 1 : 0
                    })}
                    className="w-5 h-5 text-green-600 bg-gray-700 border-gray-600 rounded focus:ring-green-500 focus:ring-2"
                  />
                  <span className="text-white">
                    {value === 1 ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>
            );
          }

          // Campos de relación para empresa
          if (col.columnName === 'paisid' && selectedTable === 'empresa') {
            const options = getUniqueOptionsForField(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className="block text-lg font-bold text-white mb-2">
                  {displayName}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder="Seleccionar país"
                />
              </div>
            );
          }

          // Campos de relación para fundo
          if (col.columnName === 'empresaid' && selectedTable === 'fundo') {
            const options = getUniqueOptionsForField(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className="block text-lg font-bold text-white mb-2">
                  {displayName}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder="Seleccionar empresa"
                />
              </div>
            );
          }

          // Campos de relación para ubicacion
          if (col.columnName === 'fundoid' && selectedTable === 'ubicacion') {
            const options = getUniqueOptionsForField(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className="block text-lg font-bold text-white mb-2">
                  {displayName}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder="Seleccionar fundo"
                />
              </div>
            );
          }

          // Campos de relación para localizacion
          if (col.columnName === 'ubicacionid' && selectedTable === 'localizacion') {
            const options = getUniqueOptionsForField(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className="block text-lg font-bold text-white mb-2">
                  {displayName}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder="Seleccionar ubicación"
                />
              </div>
            );
          }

          if (col.columnName === 'nodoid' && selectedTable === 'localizacion') {
            const options = getUniqueOptionsForField(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className="block text-lg font-bold text-white mb-2">
                  {displayName}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder="Seleccionar nodo"
                />
              </div>
            );
          }

          if (col.columnName === 'entidadid' && (selectedTable === 'localizacion' || selectedTable === 'tipo')) {
            const options = getUniqueOptionsForField(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className="block text-lg font-bold text-white mb-2">
                  {displayName}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder="Seleccionar entidad"
                />
              </div>
            );
          }

          // Campos de relación para sensor
          if (col.columnName === 'nodoid' && selectedTable === 'sensor') {
            const options = getUniqueOptionsForField(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className="block text-lg font-bold text-white mb-2">
                  {displayName}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder="Seleccionar nodo"
                />
              </div>
            );
          }

          if (col.columnName === 'tipoid' && selectedTable === 'sensor') {
            const options = getUniqueOptionsForField(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className="block text-lg font-bold text-white mb-2">
                  {displayName}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder="Seleccionar tipo"
                />
              </div>
            );
          }

          // Campos de relación para metricasensor
          if (col.columnName === 'nodoid' && selectedTable === 'metricasensor') {
            const options = getUniqueOptionsForField(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className="block text-lg font-bold text-white mb-2">
                  {displayName}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder="Seleccionar nodo"
                />
              </div>
            );
          }

          if (col.columnName === 'metricaid' && selectedTable === 'metricasensor') {
            const options = getUniqueOptionsForField(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className="block text-lg font-bold text-white mb-2">
                  {displayName}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder="Seleccionar métrica"
                />
              </div>
            );
          }

          if (col.columnName === 'tipoid' && selectedTable === 'metricasensor') {
            const options = getUniqueOptionsForField(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className="block text-lg font-bold text-white mb-2">
                  {displayName}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder="Seleccionar tipo"
                />
              </div>
            );
          }

          // Combobox para umbral - ubicacionid, criticidadid, nodoid, metricaid, tipoid
          if (col.columnName === 'ubicacionid' && selectedTable === 'umbral') {
            const options = getUniqueOptionsForField(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className="block text-lg font-bold text-white mb-2">
                  {displayName}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder="Seleccionar ubicación"
                />
              </div>
            );
          }

          if (col.columnName === 'criticidadid' && selectedTable === 'umbral') {
            const options = getUniqueOptionsForField(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className="block text-lg font-bold text-white mb-2">
                  {displayName}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder="Seleccionar criticidad"
                />
              </div>
            );
          }

          if (col.columnName === 'nodoid' && selectedTable === 'umbral') {
            const options = getUniqueOptionsForField(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className="block text-lg font-bold text-white mb-2">
                  {displayName}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder="Seleccionar nodo"
                />
              </div>
            );
          }

          if (col.columnName === 'metricaid' && selectedTable === 'umbral') {
            const options = getUniqueOptionsForField(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className="block text-lg font-bold text-white mb-2">
                  {displayName}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder="Seleccionar métrica"
                />
              </div>
            );
          }

          if (col.columnName === 'tipoid' && selectedTable === 'umbral') {
            const options = getUniqueOptionsForField(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className="block text-lg font-bold text-white mb-2">
                  {displayName}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder="Seleccionar tipo"
                />
              </div>
            );
          }

          // Combobox para perfilumbral - perfilid, umbralid
          if (col.columnName === 'perfilid' && selectedTable === 'perfilumbral') {
            const options = getUniqueOptionsForField(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className="block text-lg font-bold text-white mb-2">
                  {displayName}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder="Seleccionar perfil"
                />
              </div>
            );
          }

          if (col.columnName === 'umbralid' && selectedTable === 'perfilumbral') {
            const options = getUniqueOptionsForField(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className="block text-lg font-bold text-white mb-2">
                  {displayName}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder="Seleccionar umbral"
                />
              </div>
            );
          }

          // Combobox para audit_log_umbral - umbralid, modified_by
          if (col.columnName === 'umbralid' && selectedTable === 'audit_log_umbral') {
            const options = getUniqueOptionsForField(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className="block text-lg font-bold text-white mb-2">
                  {displayName}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder="Seleccionar umbral"
                />
              </div>
            );
          }

          if (col.columnName === 'modified_by' && selectedTable === 'audit_log_umbral') {
            const options = getUniqueOptionsForField(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className="block text-lg font-bold text-white mb-2">
                  {displayName}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder="Seleccionar usuario"
                />
              </div>
            );
          }

          // Combobox para usuarioperfil - usuarioid, perfilid
          if (col.columnName === 'usuarioid' && selectedTable === 'usuarioperfil') {
            const options = getUniqueOptionsForField(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className="block text-lg font-bold text-white mb-2">
                  {displayName}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder="Seleccionar usuario"
                />
              </div>
            );
          }

          if (col.columnName === 'perfilid' && selectedTable === 'usuarioperfil') {
            const options = getUniqueOptionsForField(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className="block text-lg font-bold text-white mb-2">
                  {displayName}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder="Seleccionar perfil"
                />
              </div>
            );
          }

          // Combobox para contacto - usuarioid, medioid
          if (col.columnName === 'usuarioid' && selectedTable === 'contacto') {
            const options = getUniqueOptionsForField(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className="block text-lg font-bold text-white mb-2">
                  {displayName}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder="Seleccionar usuario"
                />
              </div>
            );
          }

          if (col.columnName === 'medioid' && selectedTable === 'contacto') {
            const options = getUniqueOptionsForField(col.columnName);
            return (
              <div key={col.columnName} className="mb-4">
                <label className="block text-lg font-bold text-white mb-2">
                  {displayName}
                </label>
                <SelectWithPlaceholder
                  value={value}
                  onChange={(newValue) => setFormData({
                    ...formData,
                    [col.columnName]: newValue ? parseInt(newValue.toString()) : null
                  })}
                  options={options}
                  placeholder="Seleccionar medio"
                />
              </div>
            );
          }

          // Campo de texto normal
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
                placeholder={`INGRESE ${displayName.toUpperCase()}`}
              />
            </div>
          );
  };

  return (
    <div>
      {['usuario', 'empresa', 'fundo', 'ubicacion', 'localizacion', 'tipo', 'umbral'].includes(selectedTable) ? (
        <div>
          {renderSpecialLayoutFields()}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {visibleColumns.map(col => renderField(col))}
        </div>
      )}

      <div className="flex justify-center items-center mt-8 space-x-4">
        <button
          onClick={onInsert}
          disabled={loading}
          className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-mono tracking-wider"
        >
          <span>➕</span>
          <span>{loading ? 'SAVING...' : 'SAVE'}</span>
        </button>
        
        {/* Botón de replicar para nodo */}
        {selectedTable === 'nodo' && onReplicateClick && (
          <ReplicateButton
            onClick={onReplicateClick}
          />
        )}
        
        <button
          onClick={onCancel}
          className="px-6 py-2 bg-neutral-800 border border-neutral-600 text-white rounded-lg hover:bg-neutral-700 transition-colors font-medium flex items-center space-x-2 font-mono tracking-wider"
        >
          <span>❌</span>
          <span>CANCEL</span>
        </button>
        
        {selectedTable === 'sensor' && onPasteFromClipboard && (
          <button
            onClick={onPasteFromClipboard}
            className="px-6 py-2 bg-neutral-800 border border-neutral-600 text-white rounded-lg hover:bg-neutral-700 transition-colors font-medium font-mono tracking-wider"
          >
            PASTE FROM CLIPBOARD
          </button>
        )}
      </div>
    </div>
  );
};

export default NormalInsertForm;