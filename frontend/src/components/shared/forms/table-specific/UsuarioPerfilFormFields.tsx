// ============================================================================
// USUARIO PERFIL FORM FIELDS
// ============================================================================
// Componente específico para renderizar campos del formulario de UsuarioPerfil

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { UserSelector } from '../UserSelector';
import { getColumnDisplayNameTranslated } from '../../../../utils/systemParametersUtils';
import { JoySenseService } from '../../../../services/backend-api';

interface UsuarioPerfilFormFieldsProps {
  visibleColumns: any[];
  formData: Record<string, any>;
  setFormData: (data: Record<string, any>) => void;
  renderField: (col: any) => React.ReactNode;
  getThemeColor: (type: 'text' | 'bg' | 'hover' | 'focus' | 'border') => string;
  getUniqueOptionsForField?: (columnName: string) => Array<{value: any, label: string}>;
  perfilesData?: any[]; // Datos de perfiles disponibles
  existingPerfiles?: any[]; // Para modo UPDATE: perfiles existentes del usuario
  isUpdateMode?: boolean; // Si es true, estamos en modo UPDATE
}

export const UsuarioPerfilFormFields: React.FC<UsuarioPerfilFormFieldsProps> = ({
  visibleColumns,
  formData,
  setFormData,
  renderField,
  getThemeColor,
  getUniqueOptionsForField,
  perfilesData = [],
  existingPerfiles = [],
  isUpdateMode = false
}) => {
  const { t } = useLanguage();

  // Estado para los perfiles seleccionados (perfilid -> statusid)
  const [perfilesStatus, setPerfilesStatus] = useState<Record<number, number>>({});
  
  // Estado para los perfiles existentes cargados dinámicamente
  const [perfilesExistentes, setPerfilesExistentes] = useState<any[]>([]);
  const [loadingPerfiles, setLoadingPerfiles] = useState(false);
  
  // Ref para rastrear si ya se inicializó para evitar loops
  const initializedRef = useRef<number | null>(null);
  const lastPerfilesStatusRef = useRef<string>('');

  // Obtener el campo usuarioid
  const usuarioidField = visibleColumns.find(c => c.columnName === 'usuarioid');
  const usuarioid = formData.usuarioid;

  // Cargar dinámicamente los perfiles existentes del usuario seleccionado
  useEffect(() => {
    const loadExistingPerfiles = async () => {
      if (!usuarioid) {
        setPerfilesExistentes([]);
        return;
      }

      setLoadingPerfiles(true);
      try {
        const usuarioperfilData = await JoySenseService.getTableData('usuarioperfil', 1000);
        const data = Array.isArray(usuarioperfilData) ? usuarioperfilData : (usuarioperfilData as any)?.data || [];
        
        // Filtrar los perfiles que pertenecen al usuario seleccionado
        const perfilesDelUsuario = data.filter((up: any) => 
          Number(up.usuarioid) === Number(usuarioid)
        );
        
        setPerfilesExistentes(perfilesDelUsuario);
        console.log('[UsuarioPerfilFormFields] Perfiles existentes cargados:', {
          usuarioid,
          totalPerfiles: perfilesDelUsuario.length,
          perfiles: perfilesDelUsuario.map((p: any) => ({ perfilid: p.perfilid, statusid: p.statusid }))
        });
      } catch (error) {
        console.error('[UsuarioPerfilFormFields] Error cargando perfiles existentes:', error);
        setPerfilesExistentes([]);
      } finally {
        setLoadingPerfiles(false);
      }
    };

    loadExistingPerfiles();
  }, [usuarioid]);

  // Cuando se selecciona un usuario, inicializar los perfiles
  useEffect(() => {
    // Solo inicializar si cambió el usuarioid o si no se ha inicializado
    if (usuarioid && initializedRef.current !== usuarioid && !loadingPerfiles) {
      const initialStatus: Record<number, number> = {};
      
      // Usar perfiles existentes del prop (modo UPDATE) o cargados dinámicamente (modo CREATE)
      const perfilesAUsar = existingPerfiles.length > 0 ? existingPerfiles : perfilesExistentes;
      
      if (perfilesAUsar.length > 0) {
        // Cargar perfiles existentes
        perfilesAUsar.forEach((row: any) => {
          initialStatus[row.perfilid] = row.statusid || 0;
        });
      }
      
      // Inicializar perfiles no existentes como inactivos
      perfilesData.forEach((perfil: any) => {
        if (!initialStatus.hasOwnProperty(perfil.perfilid)) {
          initialStatus[perfil.perfilid] = 0;
        }
      });
      
      setPerfilesStatus(initialStatus);
      initializedRef.current = usuarioid;
      
      // Limpiar perfilid del formData ya que ahora usamos la tabla (solo si existe)
      setFormData((prev: Record<string, any>) => {
        if (prev.perfilid) {
          return {
            ...prev,
            perfilid: null
          };
        }
        return prev;
      });
    } else if (!usuarioid) {
      // Si no hay usuario seleccionado, limpiar los perfiles
      setPerfilesStatus({});
      initializedRef.current = null;
    }
  }, [usuarioid, loadingPerfiles, perfilesExistentes]);

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

  // Filtrar y ordenar perfiles activos por perfilid ascendente
  const perfilesActivos = useMemo(() => {
    return perfilesData
      .filter((p: any) => p.statusid === 1)
      .sort((a: any, b: any) => a.perfilid - b.perfilid);
  }, [perfilesData]);

  // Obtener perfiles que fueron activos (no editables)
  // Usa existingPerfiles si viene del prop (modo UPDATE) o perfilesExistentes si se cargó dinámicamente
  const perfilesActualesActivos = useMemo(() => {
    const perfilesAUsar = existingPerfiles.length > 0 ? existingPerfiles : perfilesExistentes;
    return new Set(
      perfilesAUsar
        .filter((p: any) => p.statusid === 1)
        .map((p: any) => p.perfilid)
    );
  }, [existingPerfiles, perfilesExistentes]);

  return (
    <div>
      {/* Campo USUARIO con UserSelector */}
      {usuarioidField && (
        <div className="mb-6">
          <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
            {getColumnDisplayNameTranslated('usuarioid', t)?.toUpperCase() || 'USUARIO'}{usuarioidField.required ? '*' : ''}
          </label>
          <UserSelector
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
                  // Verificar si este perfil ya está activo en la BD (tanto en CREATE como en UPDATE)
                  const esPerfilActualmentActivo = perfilesActualesActivos.has(perfil.perfilid);
                  // Deshabilitar checkbox si el perfil ya está activo en la BD
                  const isCheckboxDisabled = esPerfilActualmentActivo;
                  
                  return (
                    <tr
                      key={perfil.perfilid}
                      className={`border-b border-gray-300 dark:border-neutral-600 transition-colors ${
                        esPerfilActualmentActivo
                          ? 'bg-orange-50 dark:bg-orange-950/20 hover:bg-orange-100 dark:hover:bg-orange-950/30'
                          : 'hover:bg-gray-50 dark:hover:bg-neutral-700'
                      }`}
                    >
                      <td className={`px-4 py-3 font-mono ${
                        esPerfilActualmentActivo
                          ? 'text-orange-800 dark:text-orange-400 font-bold'
                          : 'text-gray-800 dark:text-white'
                      }`}>
                        <div className="flex items-center gap-2">
                          {perfil.perfil || `Perfil ${perfil.perfilid}`}
                          {esPerfilActualmentActivo && (
                            <span title="Este perfil está actualmente activo y no puede ser modificado" className="text-lg">
                              🔒
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => !isCheckboxDisabled && handlePerfilToggle(perfil.perfilid)}
                            disabled={isCheckboxDisabled}
                            className={`w-5 h-5 rounded focus:ring-2 ${getThemeColor('focus')} ${
                              isCheckboxDisabled
                                ? 'opacity-60 cursor-not-allowed bg-gray-300 dark:bg-neutral-700 border-gray-400 dark:border-neutral-600'
                                : `${getThemeColor('text')} bg-neutral-800 border-neutral-600 cursor-pointer`
                            }`}
                          />
                          <span className={`font-mono text-sm ${
                            isCheckboxDisabled
                              ? 'text-gray-600 dark:text-gray-400 font-semibold'
                              : 'text-gray-800 dark:text-white'
                          }`}>
                            {esPerfilActualmentActivo 
                              ? '✓ ACTIVO' 
                              : (isChecked ? t('create.active') : t('create.inactive'))
                            }
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

