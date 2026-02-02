// ============================================================================
// USUARIO CANAL FORM FIELDS
// ============================================================================
// Componente específico para renderizar campos del formulario de Usuario Canal
// Muestra un grid de canales cuando se selecciona un usuario

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { UserSelector } from '../UserSelector';
import { useLanguage } from '../../../../contexts/LanguageContext';
import { getColumnDisplayNameTranslated } from '../../../../utils/systemParametersUtils';
import { JoySenseService } from '../../../../services/backend-api';

interface UsuarioCanalFormFieldsProps {
  visibleColumns: any[];
  formData: Record<string, any>;
  setFormData: (data: Record<string, any>) => void;
  updateField: (field: string, value: any) => void;
  getThemeColor: (type: 'text' | 'bg' | 'hover' | 'focus' | 'border') => string;
  getUniqueOptionsForField: (columnName: string) => Array<{value: any, label: string}>;
  contactosData?: any[];
  correosData?: any[];
  canalesData?: any[];
  codigotelefonosData?: any[];
}

interface CanalRow {
  canalid: number;
  canal: string;
  status: boolean;
  identificador: string;
}

export const UsuarioCanalFormFields: React.FC<UsuarioCanalFormFieldsProps> = ({
  visibleColumns,
  formData,
  setFormData,
  updateField,
  getThemeColor,
  getUniqueOptionsForField,
  contactosData = [],
  correosData = [],
  canalesData = [],
  codigotelefonosData = []
}) => {
  const { t } = useLanguage();
  
  // Estado para almacenar los datos del usuario seleccionado (login)
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<any>(null);
  
  // Estado para el grid de canales
  const [canalesGrid, setCanalesGrid] = useState<CanalRow[]>([]);

  // Cargar datos del usuario cuando se selecciona
  useEffect(() => {
    const loadUsuarioData = async () => {
      if (!formData.usuarioid) {
        console.log('[UsuarioCanalFormFields] No hay usuarioid, limpiando datos');
        setUsuarioSeleccionado(null);
        setCanalesGrid([]);
        return;
      }

      console.log('[UsuarioCanalFormFields] Cargando datos del usuario:', {
        usuarioid: formData.usuarioid,
        canalesDataLength: canalesData.length,
        contactosDataLength: contactosData.length,
        correosDataLength: correosData.length
      });

      try {
        const usuariosData = await JoySenseService.getTableData('usuario', 1000);
        const usuarios = Array.isArray(usuariosData) ? usuariosData : (usuariosData as any)?.data || [];
        const usuario = usuarios.find((u: any) => Number(u.usuarioid) === Number(formData.usuarioid));
        
        console.log('[UsuarioCanalFormFields] Usuario encontrado:', {
          usuario: usuario ? { usuarioid: usuario.usuarioid, login: usuario.login } : null,
          totalUsuarios: usuarios.length
        });
        
        if (usuario) {
          setUsuarioSeleccionado(usuario);
          
          // Inicializar el grid con todos los canales disponibles
          const canalesActivos = canalesData.filter((c: any) => c.statusid === 1);
          console.log('[UsuarioCanalFormFields] Canales activos:', {
            total: canalesActivos.length,
            canales: canalesActivos.map((c: any) => ({ canalid: c.canalid, canal: c.canal }))
          });
          
          // Buscar contacto del usuario (para WhatsApp)
          const contactoUsuario = contactosData.find((c: any) => 
            Number(c.usuarioid) === Number(formData.usuarioid) && c.statusid === 1
          );
          console.log('[UsuarioCanalFormFields] Contacto encontrado:', {
            contacto: contactoUsuario ? { usuarioid: contactoUsuario.usuarioid, celular: contactoUsuario.celular } : null,
            contactosDataSample: contactosData.slice(0, 3).map((c: any) => ({ usuarioid: c.usuarioid, statusid: c.statusid }))
          });
          
          // Buscar correo activo del usuario (para CORREO)
          const correoUsuario = correosData.find((c: any) => 
            Number(c.usuarioid) === Number(formData.usuarioid) && c.statusid === 1
          );
          console.log('[UsuarioCanalFormFields] Correo encontrado:', {
            correo: correoUsuario ? { usuarioid: correoUsuario.usuarioid, correo: correoUsuario.correo, statusid: correoUsuario.statusid } : null,
            correosDataSample: correosData.slice(0, 5).map((c: any) => ({ usuarioid: c.usuarioid, correo: c.correo, statusid: c.statusid })),
            buscandoUsuarioid: formData.usuarioid,
            tipoUsuarioid: typeof formData.usuarioid
          });
          
          const grid: CanalRow[] = canalesActivos.map((canal: any) => {
            const nombreCanalOriginal = canal.canal || '';
            const nombreCanal = nombreCanalOriginal.toLowerCase();
            
            console.log('[UsuarioCanalFormFields] Procesando canal:', {
              canalid: canal.canalid,
              nombreCanalOriginal,
              nombreCanalLowercase: nombreCanal,
              esWhatsapp: nombreCanal === 'whatsapp',
              esCorreo: nombreCanal === 'correo',
              esEmail: nombreCanal === 'email',
              esTelegram: nombreCanal === 'telegram'
            });
            
            // Calcular identificador según el canal
            let identificador = '';
            if (nombreCanal === 'whatsapp' && contactoUsuario?.celular) {
              identificador = contactoUsuario.celular;
              console.log('[UsuarioCanalFormFields] WhatsApp identificador calculado:', identificador);
            } else if (nombreCanal === 'correo' || nombreCanal === 'email') {
              console.log('[UsuarioCanalFormFields] Procesando canal CORREO/EMAIL:', {
                nombreCanalOriginal,
                nombreCanalLowercase: nombreCanal,
                correoUsuario: correoUsuario ? { correo: correoUsuario.correo, usuarioid: correoUsuario.usuarioid, statusid: correoUsuario.statusid } : null,
                tieneCorreo: !!correoUsuario?.correo,
                correoValue: correoUsuario?.correo
              });
              if (correoUsuario?.correo) {
                identificador = correoUsuario.correo;
                console.log('[UsuarioCanalFormFields] CORREO identificador calculado:', identificador);
              } else {
                console.log('[UsuarioCanalFormFields] CORREO: No se encontró correo activo para el usuario');
              }
            } else if (nombreCanal === 'telegram') {
              identificador = ''; // Dejar vacío por el momento
              console.log('[UsuarioCanalFormFields] TELEGRAM: identificador vacío');
            } else {
              console.log('[UsuarioCanalFormFields] Canal no reconocido:', nombreCanalOriginal);
            }
            
            return {
              canalid: canal.canalid,
              canal: canal.canal,
              status: false, // Por defecto no seleccionado
              identificador: identificador
            };
          });
          
          console.log('[UsuarioCanalFormFields] Grid final:', {
            totalCanales: grid.length,
            grid: grid.map((g: CanalRow) => ({ canalid: g.canalid, canal: g.canal, identificador: g.identificador }))
          });
          
          setCanalesGrid(grid);
        } else {
          console.log('[UsuarioCanalFormFields] Usuario no encontrado');
          setUsuarioSeleccionado(null);
          setCanalesGrid([]);
        }
      } catch (error) {
        console.error('[UsuarioCanalFormFields] Error cargando datos del usuario:', error);
        setUsuarioSeleccionado(null);
        setCanalesGrid([]);
      }
    };

    loadUsuarioData();
  }, [formData.usuarioid, canalesData, contactosData, correosData]);

  // Manejar cambio de status en el grid
  const handleStatusChange = useCallback((canalid: number, checked: boolean) => {
    setCanalesGrid(prev => prev.map(row => 
      row.canalid === canalid 
        ? { ...row, status: checked }
        : row
    ));
  }, []);

  // Manejar cambio de identificador en el grid
  const handleIdentificadorChange = useCallback((canalid: number, value: string) => {
    setCanalesGrid(prev => prev.map(row => 
      row.canalid === canalid 
        ? { ...row, identificador: value }
        : row
    ));
  }, []);

  // Actualizar formData cuando cambia el grid
  useEffect(() => {
    if (formData.usuarioid && canalesGrid.length > 0) {
      // Guardar el estado del grid en formData para que useInsertForm pueda acceder
      setFormData((prev: Record<string, any>) => ({
        ...prev,
        _canalesGrid: canalesGrid
      }));
    }
  }, [canalesGrid, formData.usuarioid, setFormData]);

  // Obtener campos visibles
  const usuarioidField = visibleColumns.find(c => c.columnName === 'usuarioid');

  return (
    <div className="space-y-6">
      {/* Campo Usuario */}
      {usuarioidField && (
        <div className="space-y-3">
          <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
            {getColumnDisplayNameTranslated('usuarioid', t)?.toUpperCase()} *
          </label>
          <UserSelector
            value={formData.usuarioid || null}
            onChange={(usuarioid: number | null) => {
              updateField('usuarioid', usuarioid);
            }}
            placeholder="BUSQUEDA"
            isRequired={true}
            themeColor="orange"
          />
        </div>
      )}

      {/* Grid de Canales - Solo mostrar si hay un usuario seleccionado */}
      {formData.usuarioid && canalesGrid.length > 0 && (
        <div className="space-y-3">
          <label className={`block text-lg font-bold mb-2 font-mono tracking-wider ${getThemeColor('text')}`}>
            CANALES DE NOTIFICACIÓN
          </label>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 dark:border-neutral-600">
              <thead>
                <tr className="bg-gray-100 dark:bg-neutral-800">
                  <th className="border border-gray-300 dark:border-neutral-600 px-2 py-2 text-center font-mono text-sm font-bold w-16">
                    STATUS
                  </th>
                  <th className="border border-gray-300 dark:border-neutral-600 px-4 py-2 text-left font-mono text-sm font-bold">
                    CANAL
                  </th>
                  <th className="border border-gray-300 dark:border-neutral-600 px-4 py-2 text-left font-mono text-sm font-bold">
                    IDENTIFICADOR
                  </th>
                </tr>
              </thead>
              <tbody>
                {canalesGrid.map((row) => (
                  <tr key={row.canalid} className="hover:bg-gray-50 dark:hover:bg-neutral-800/50">
                    <td className="border border-gray-300 dark:border-neutral-600 px-2 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={row.status}
                        onChange={(e) => handleStatusChange(row.canalid, e.target.checked)}
                        className="w-5 h-5 text-orange-600 bg-gray-200 dark:bg-neutral-800 border-gray-300 dark:border-neutral-600 rounded focus:ring-2 focus:ring-orange-500"
                      />
                    </td>
                    <td className="border border-gray-300 dark:border-neutral-600 px-4 py-2 font-mono text-sm text-gray-900 dark:text-white">
                      {row.canal}
                    </td>
                    <td className="border border-gray-300 dark:border-neutral-600 px-4 py-2">
                      <input
                        type="text"
                        value={row.identificador}
                        onChange={(e) => handleIdentificadorChange(row.canalid, e.target.value)}
                        disabled={!row.status}
                        className={`w-full px-3 py-2 bg-gray-200 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg font-mono text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                          !row.status ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        placeholder={
                          row.canal.toLowerCase() === 'whatsapp' 
                            ? 'Ej: +51960599778' 
                            : row.canal.toLowerCase() === 'correo'
                            ? 'Ej: usuario@demo.com'
                            : 'Identificador del canal'
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
