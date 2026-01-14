// ============================================================================
// USUARIO PERFIL FORM FIELDS
// ============================================================================
// Componente específico para renderizar campos del formulario de UsuarioPerfil

import React, { useState, useEffect, useMemo } from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { UsuarioEmpresaSelector } from '../UsuarioEmpresaSelector';
import { getColumnDisplayNameTranslated } from '../../../utils/systemParametersUtils';

interface UsuarioPerfilFormFieldsProps {
  visibleColumns: any[];
  formData: Record<string, any>;
  setFormData: (data: Record<string, any>) => void;
  renderField: (col: any) => React.ReactNode;
  getThemeColor: (type: 'text' | 'bg' | 'hover' | 'focus' | 'border') => string;
  getUniqueOptionsForField?: (columnName: string) => Array<{value: any, label: string}>;
  perfilesData?: any[]; // Datos de perfiles disponibles
}

export const UsuarioPerfilFormFields: React.FC<UsuarioPerfilFormFieldsProps> = ({
  visibleColumns,
  formData,
  setFormData,
  renderField,
  getThemeColor,
  getUniqueOptionsForField,
  perfilesData = []
}) => {
  const { t } = useLanguage();

  // Estado para los perfiles seleccionados (perfilid -> statusid)
  const [perfilesStatus, setPerfilesStatus] = useState<Record<number, number>>({});

  // Obtener el campo usuarioid
  const usuarioidField = visibleColumns.find(c => c.columnName === 'usuarioid');
  const usuarioid = formData.usuarioid;

  // Cuando se selecciona un usuario, inicializar los perfiles
  useEffect(() => {
    if (usuarioid) {
      // Inicializar todos los perfiles como inactivos (statusid = 0)
      const initialStatus: Record<number, number> = {};
      perfilesData.forEach((perfil: any) => {
        initialStatus[perfil.perfilid] = 0; // Por defecto inactivo
      });
      setPerfilesStatus(initialStatus);
      
      // Limpiar perfilid del formData ya que ahora usamos la tabla
      if (formData.perfilid) {
        setFormData({
          ...formData,
          perfilid: null
        });
      }
    } else {
      // Si no hay usuario seleccionado, limpiar los perfiles
      setPerfilesStatus({});
    }
  }, [usuarioid, perfilesData]); // Solo cuando cambia el usuario o los perfiles

  // Manejar cambio de checkbox de perfil
  const handlePerfilToggle = (perfilid: number) => {
    setPerfilesStatus(prev => ({
      ...prev,
      [perfilid]: prev[perfilid] === 1 ? 0 : 1
    }));
  };

  // Obtener perfiles activos para el formData (esto se usará al insertar)
  useEffect(() => {
    // Actualizar formData con los perfiles seleccionados
    // Esto se manejará en el componente padre al insertar
    const perfilesActivos = Object.entries(perfilesStatus)
      .filter(([_, statusid]) => statusid === 1)
      .map(([perfilid, _]) => parseInt(perfilid));
    
    // Guardar en formData para que el componente padre pueda acceder
    setFormData({
      ...formData,
      _perfilesSeleccionados: perfilesActivos,
      _perfilesStatus: perfilesStatus
    });
  }, [perfilesStatus]);

  // Filtrar perfiles activos
  const perfilesActivos = useMemo(() => {
    return perfilesData.filter((p: any) => p.statusid === 1);
  }, [perfilesData]);

  return (
    <div>
      {/* Campo USUARIO con UsuarioEmpresaSelector */}
      {usuarioidField && (
        <div className="mb-6">
          <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
            {getColumnDisplayNameTranslated('usuarioid', t)?.toUpperCase() || 'USUARIO'}{usuarioidField.required ? '*' : ''}
          </label>
          <UsuarioEmpresaSelector
            value={usuarioid || null}
            onChange={(usuarioid: number | null) => {
              setFormData({
                ...formData,
                usuarioid: usuarioid
              });
            }}
            placeholder="BUSQUEDA"
            isRequired={usuarioidField.required}
            themeColor="orange"
          />
        </div>
      )}

      {/* Tabla de perfiles (solo se muestra si hay un usuario seleccionado) */}
      {usuarioid && perfilesActivos.length > 0 && (
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

      {/* Mensaje cuando no hay usuario seleccionado */}
      {!usuarioid && (
        <div className="mb-6 p-4 bg-gray-100 dark:bg-neutral-800 rounded-lg border border-gray-300 dark:border-neutral-600">
          <p className="text-gray-600 dark:text-neutral-400 font-mono text-sm text-center">
            Selecciona un usuario para ver los perfiles disponibles
          </p>
        </div>
      )}

      {/* Renderizar otros campos que no sean los especiales */}
      {(() => {
        const specialFields = ['usuarioid', 'perfilid', 'statusid'];
        const otherFields = visibleColumns.filter(c => !specialFields.includes(c.columnName));
        return otherFields.map(col => renderField(col));
      })()}
    </div>
  );
};

