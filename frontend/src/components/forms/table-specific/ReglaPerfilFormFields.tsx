// ============================================================================
// REGLA PERFIL FORM FIELDS
// ============================================================================
// Componente específico para renderizar campos del formulario de ReglaPerfil

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getColumnDisplayNameTranslated } from '../../../utils/systemParametersUtils';
import SelectWithPlaceholder from '../../selectors/SelectWithPlaceholder';

interface ReglaPerfilFormFieldsProps {
  visibleColumns: any[];
  formData: Record<string, any>;
  setFormData: (data: Record<string, any>) => void;
  renderField: (col: any) => React.ReactNode;
  getThemeColor: (type: 'text' | 'bg' | 'hover' | 'focus' | 'border') => string;
  getUniqueOptionsForField?: (columnName: string) => Array<{value: any, label: string}>;
  reglasData?: any[]; // Datos de reglas disponibles
  perfilesData?: any[]; // Datos de perfiles disponibles
  existingPerfiles?: any[]; // Para modo UPDATE: perfiles existentes de la regla
  isUpdateMode?: boolean; // Si es true, estamos en modo UPDATE
}

export const ReglaPerfilFormFields: React.FC<ReglaPerfilFormFieldsProps> = ({
  visibleColumns,
  formData,
  setFormData,
  renderField,
  getThemeColor,
  getUniqueOptionsForField,
  reglasData = [],
  perfilesData = [],
  existingPerfiles = [],
  isUpdateMode = false
}) => {
  const { t } = useLanguage();

  // Estado para los perfiles seleccionados (perfilid -> statusid)
  const [perfilesStatus, setPerfilesStatus] = useState<Record<number, number>>({});
  
  // Ref para rastrear si ya se inicializó para evitar loops
  const initializedRef = useRef<number | null>(null);
  const lastPerfilesStatusRef = useRef<string>('');

  // Obtener el campo reglaid
  const reglaidField = visibleColumns.find(c => c.columnName === 'reglaid');
  const reglaid = formData.reglaid;

  // Obtener opciones de reglas
  const reglaOptions = useMemo(() => {
    if (!getUniqueOptionsForField) return [];
    return getUniqueOptionsForField('reglaid');
  }, [getUniqueOptionsForField, reglasData]);

  // Cuando se selecciona una regla, inicializar los perfiles
  useEffect(() => {
    // Solo inicializar si cambió el reglaid o si no se ha inicializado
    if (reglaid && initializedRef.current !== reglaid) {
      const initialStatus: Record<number, number> = {};
      
      if (isUpdateMode && existingPerfiles.length > 0) {
        // En modo UPDATE: cargar perfiles existentes
        existingPerfiles.forEach((row: any) => {
          initialStatus[row.perfilid] = row.statusid || 0;
        });
        // Inicializar perfiles no existentes como inactivos
        perfilesData.forEach((perfil: any) => {
          if (!initialStatus.hasOwnProperty(perfil.perfilid)) {
            initialStatus[perfil.perfilid] = 0;
          }
        });
      } else {
        // En modo CREATE: inicializar todos los perfiles como inactivos
        perfilesData.forEach((perfil: any) => {
          initialStatus[perfil.perfilid] = 0; // Por defecto inactivo
        });
      }
      
      setPerfilesStatus(initialStatus);
      initializedRef.current = reglaid;
      
      // Limpiar perfilid del formData ya que ahora usamos la tabla (solo si existe)
      if (formData.perfilid) {
        setFormData((prev: Record<string, any>) => ({
          ...prev,
          perfilid: null
        }));
      }
    } else if (!reglaid) {
      // Si no hay regla seleccionada, limpiar los perfiles
      setPerfilesStatus({});
      initializedRef.current = null;
    }
  }, [reglaid, isUpdateMode]); // Remover formData y otras dependencias que cambian constantemente

  // Manejar cambio de checkbox de perfil
  const handlePerfilToggle = (perfilid: number) => {
    setPerfilesStatus(prev => ({
      ...prev,
      [perfilid]: prev[perfilid] === 1 ? 0 : 1
    }));
  };

  // Obtener perfiles activos para el formData (esto se usará al insertar)
  useEffect(() => {
    // Serializar perfilesStatus para comparar
    const perfilesStatusStr = JSON.stringify(perfilesStatus);
    
    // Solo actualizar si realmente cambió
    if (perfilesStatusStr === lastPerfilesStatusRef.current) {
      return;
    }
    
    lastPerfilesStatusRef.current = perfilesStatusStr;
    
    // Actualizar formData con los perfiles seleccionados
    const perfilesActivos = Object.entries(perfilesStatus)
      .filter(([_, statusid]) => statusid === 1)
      .map(([perfilid, _]) => parseInt(perfilid));
    
    // Usar función de actualización para evitar depender de formData
    setFormData((prev: Record<string, any>) => ({
      ...prev,
      _perfilesSeleccionados: perfilesActivos,
      _perfilesStatus: perfilesStatus
    }));
  }, [perfilesStatus, setFormData]);

  // Filtrar perfiles activos
  const perfilesActivos = useMemo(() => {
    return perfilesData.filter((p: any) => p.statusid === 1);
  }, [perfilesData]);

  return (
    <div>
      {/* Campo REGLA con SelectWithPlaceholder */}
      {reglaidField && (
        <div className="mb-6">
          <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
            {getColumnDisplayNameTranslated('reglaid', t)?.toUpperCase() || 'REGLA'}{reglaidField.required ? '*' : ''}
          </label>
          <SelectWithPlaceholder
            value={reglaid || null}
            onChange={(value) => {
              setFormData({
                ...formData,
                reglaid: value ? Number(value) : null
              });
            }}
            options={reglaOptions}
            placeholder={`${t('buttons.select')} REGLA`}
            themeColor="orange"
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded text-neutral-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-mono"
          />
        </div>
      )}

      {/* Tabla de perfiles (solo se muestra si hay una regla seleccionada) */}
      {reglaid && perfilesActivos.length > 0 && (
        <div className="mb-6">
          <div className="bg-gray-100 dark:bg-neutral-800 rounded-lg border border-gray-300 dark:border-neutral-600 overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-200 dark:bg-neutral-700 border-b border-gray-300 dark:border-neutral-600">
                  <th className="px-4 py-3 text-left font-mono font-bold text-gray-800 dark:text-white">
                    PERFIL
                  </th>
                  <th className="px-4 py-3 text-left font-mono font-bold text-gray-800 dark:text-white">
                    STATUS
                  </th>
                </tr>
              </thead>
              <tbody>
                {perfilesActivos.map((perfil: any) => {
                  const isChecked = perfilesStatus[perfil.perfilid] === 1;
                  return (
                    <tr
                      key={perfil.perfilid}
                      className="border-b border-gray-300 dark:border-neutral-600 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-colors"
                    >
                      <td className="px-4 py-3 text-gray-800 dark:text-white font-mono">
                        {perfil.perfil || `Perfil ${perfil.perfilid}`}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handlePerfilToggle(perfil.perfilid)}
                            className={`w-5 h-5 ${getThemeColor('text')} bg-neutral-800 border-neutral-600 rounded focus:ring-2 ${getThemeColor('focus')} cursor-pointer`}
                          />
                          <span className="ml-2 text-gray-800 dark:text-white font-mono text-sm">
                            {isChecked ? t('create.active') : t('create.inactive')}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mensaje cuando no hay regla seleccionada */}
      {!reglaid && (
        <div className="mb-6 p-4 bg-gray-100 dark:bg-neutral-800 rounded-lg border border-gray-300 dark:border-neutral-600">
          <p className="text-gray-600 dark:text-neutral-400 font-mono text-sm text-center">
            Selecciona una regla para ver los perfiles disponibles
          </p>
        </div>
      )}

      {/* Renderizar otros campos que no sean los especiales */}
      {(() => {
        const specialFields = ['reglaid', 'perfilid', 'statusid'];
        const otherFields = visibleColumns.filter(c => !specialFields.includes(c.columnName));
        return otherFields.map(col => renderField(col));
      })()}
    </div>
  );
};

