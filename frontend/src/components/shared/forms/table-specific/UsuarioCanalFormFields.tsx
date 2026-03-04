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
  isUpdateMode?: boolean;
}

interface CanalRow {
  canalid: number;
  canal: string;
  status: boolean;
  identificador: string;
  telegramCodigo?: string;
  generandoCodigo?: boolean;
  existente?: boolean;
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
  codigotelefonosData = [],
  isUpdateMode = false
}) => {
  const { t } = useLanguage();
  
  // Estado para almacenar los datos del usuario seleccionado (login)
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<any>(null);
  
  // Estado para el grid de canales
  const [canalesGrid, setCanalesGrid] = useState<CanalRow[]>([]);
  
  // Estados para Telegram
  const [telegramCodigoPorCanal, setTelegramCodigoPorCanal] = useState<Record<number, string>>({});
  const [generandoCodigoPorCanal, setGenerandoCodigoPorCanal] = useState<Record<number, boolean>>({});
  const [messagesTelegram, setMessagesTelegram] = useState<Record<number, string>>({});

  // Cargar datos del usuario cuando se selecciona
  useEffect(() => {
    const loadUsuarioData = async () => {
      if (!formData.usuarioid) {
        console.log('[UsuarioCanalFormFields] No hay usuarioid, limpiando datos');
        setUsuarioSeleccionado(null);
        setCanalesGrid([]);
        setTelegramCodigoPorCanal({});
        setMessagesTelegram({});
        return;
      }

      console.log('[UsuarioCanalFormFields] Cargando datos del usuario:', {
        usuarioid: formData.usuarioid,
        canalesDataLength: canalesData.length,
        contactosDataLength: contactosData.length,
        correosDataLength: correosData.length,
        isUpdateMode
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
          
          // Cargar canales existentes del usuario
          let canalesExistentes: any[] = [];
          try {
            const usuarioCanalData = await JoySenseService.getTableData('usuario_canal', 1000);
            canalesExistentes = Array.isArray(usuarioCanalData) ? usuarioCanalData : (usuarioCanalData as any)?.data || [];
            canalesExistentes = canalesExistentes.filter((uc: any) => 
              Number(uc.usuarioid) === Number(formData.usuarioid)
            );
            console.log('[UsuarioCanalFormFields] Canales existentes del usuario:', {
              total: canalesExistentes.length,
              canales: canalesExistentes.map((c: any) => ({ canalid: c.canalid, statusid: c.statusid, identificador: c.identificador }))
            });
          } catch (error) {
            console.error('[UsuarioCanalFormFields] Error cargando canales existentes:', error);
            canalesExistentes = [];
          }
          
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
            
            // Verificar si este canal ya existe para el usuario (solo si está ACTIVO)
            const canalExistente = canalesExistentes.find((uc: any) => 
              Number(uc.canalid) === Number(canal.canalid)
            );
            
            // Función helper para convertir status a booleano
            const parseStatusToBoolean = (value: any): boolean => {
              if (value === null || value === undefined) return false;
              if (typeof value === 'boolean') return value;
              if (typeof value === 'number') return value === 1;
              if (typeof value === 'string') {
                const lower = value.toLowerCase();
                return lower === '1' || lower === 'true' || lower === 'active';
              }
              return false;
            };
            
            const esExistente = canalExistente && parseStatusToBoolean(canalExistente.statusid);
            const estadoExistente = esExistente && parseStatusToBoolean(canalExistente.statusid);
            
            console.log('[UsuarioCanalFormFields] Procesando canal:', {
              canalid: canal.canalid,
              nombreCanalOriginal,
              nombreCanalLowercase: nombreCanal,
              esWhatsapp: nombreCanal === 'whatsapp',
              esCorreo: nombreCanal === 'correo',
              esEmail: nombreCanal === 'email',
              esTelegram: nombreCanal === 'telegram',
              esExistente,
              estadoExistente
            });
            
            // Calcular identificador según el canal
            let identificador = '';
            if (esExistente && canalExistente?.identificador) {
              // Usar el identificador existente solo si el canal está activo
              identificador = canalExistente.identificador;
              console.log('[UsuarioCanalFormFields] Usando identificador existente:', identificador);
            } else if (nombreCanal === 'whatsapp' && contactoUsuario?.celular && esExistente) {
              // Solo usar el celular del contacto si el canal existe como activo
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
              if (esExistente && correoUsuario?.correo) {
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
              status: esExistente ? estadoExistente : false,
              identificador: identificador,
              existente: esExistente
            };
          });
          
          console.log('[UsuarioCanalFormFields] Grid final:', {
            totalCanales: grid.length,
            grid: grid.map((g: CanalRow) => ({ canalid: g.canalid, canal: g.canal, identificador: g.identificador, existente: g.existente, status: g.status }))
          });
          
          setCanalesGrid(grid);
          
          // Cargar códigos de Telegram existentes
          const codigosTelegramInicial: Record<number, string> = {};
          canalesExistentes.forEach((uc: any) => {
            const canal = canalesActivos.find((c: any) => Number(c.canalid) === Number(uc.canalid));
            if (canal && (canal.canal || '').toLowerCase() === 'telegram') {
              if (uc.identificador) {
                codigosTelegramInicial[uc.canalid] = uc.identificador;
              }
            }
          });
          
          // Cargar desde codigotelefonosData si hay datos
          if (codigotelefonosData && codigotelefonosData.length > 0) {
            canalesExistentes.forEach((uc: any) => {
              const canal = canalesActivos.find((c: any) => Number(c.canalid) === Number(uc.canalid));
              if (canal && (canal.canal || '').toLowerCase() === 'telegram') {
                const codigoTelegram = codigotelefonosData.find((ct: any) => 
                  Number(ct.usuarioid) === Number(formData.usuarioid) && 
                  Number(ct.canalid) === Number(uc.canalid)
                );
                if (codigoTelegram?.codigo) {
                  codigosTelegramInicial[uc.canalid] = codigoTelegram.codigo;
                }
              }
            });
          }
          
          if (Object.keys(codigosTelegramInicial).length > 0) {
            console.log('[UsuarioCanalFormFields] Códigos Telegram existentes:', codigosTelegramInicial);
            setTelegramCodigoPorCanal(codigosTelegramInicial);
          }
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
  }, [formData.usuarioid, canalesData, contactosData, correosData, isUpdateMode]);

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

  // Generar código de Telegram
  const handleGenerarCodigoTelegram = useCallback(async (canalid: number, usuarioid: number) => {
    setGenerandoCodigoPorCanal(prev => ({ ...prev, [canalid]: true }));
    setMessagesTelegram(prev => ({ ...prev, [canalid]: '' }));
    
    try {
      console.log('[UsuarioCanalFormFields] Generando código Telegram para usuario:', usuarioid);
      
      // Llamar al método del servicio
      const codigo = await JoySenseService.crearCodigoTelegram(usuarioid, 30);
      
      console.log('[UsuarioCanalFormFields] Código Telegram generado:', { canalid, codigo });
      
      if (codigo) {
        setTelegramCodigoPorCanal(prev => ({ ...prev, [canalid]: codigo }));
        setMessagesTelegram(prev => ({ ...prev, [canalid]: 'Se envió un email con las instrucciones' }));
      } else {
        setMessagesTelegram(prev => ({ ...prev, [canalid]: 'Error: no se generó código' }));
      }
    } catch (error) {
      console.error('[UsuarioCanalFormFields] Error generando código Telegram:', error);
      setMessagesTelegram(prev => ({ ...prev, [canalid]: 'Error al generar código' }));
    } finally {
      setGenerandoCodigoPorCanal(prev => ({ ...prev, [canalid]: false }));
    }
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
    <div className="space-y-4">
      {/* Campo Usuario - Solo mostrar en modo creación o si no hay usuario seleccionado */}
      {usuarioidField && !isUpdateMode && (
        <div className="space-y-2">
          <label className={`block text-base font-bold font-mono tracking-wider ${getThemeColor('text')}`}>
            {getColumnDisplayNameTranslated('usuarioid', t)?.toUpperCase()} *
          </label>
          <div className="max-w-sm">
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
        </div>
      )}

      {/* Grid de Canales - Solo mostrar si hay un usuario seleccionado */}
      {formData.usuarioid && canalesGrid.length > 0 && (
        <div className="space-y-2">
          <label className={`block text-base font-bold font-mono tracking-wider ${getThemeColor('text')}`}>
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
                {canalesGrid.map((row) => {
                  const isTelegram = row.canal.toLowerCase() === 'telegram';
                  const telegramCodigo = telegramCodigoPorCanal[row.canalid];
                  const generando = generandoCodigoPorCanal[row.canalid];
                  const mensaje = messagesTelegram[row.canalid];
                  const isDisabled = row.existente && !isUpdateMode;
                  const isCheckedAndExisting = row.existente && row.status && !isUpdateMode;
                  
                  // Definir qué canales pueden editar identificador en modo actualización
                  const isWhatsApp = row.canalid === 1;
                  const isEmail = row.canalid === 3;
                  // Solo editable si: modo actualizar Y el canal existe Y es WhatsApp o Email
                  const canEditIdentificador = isUpdateMode && row.existente && (isWhatsApp || isEmail);
                  
                  // En modo actualizar, si el canal no existe, mostrar mensaje de usar Crear
                  const showUseCreateMessage = isUpdateMode && !row.existente;
                  
                  return (
                    <tr key={row.canalid} className="hover:bg-gray-50 dark:hover:bg-neutral-800/50">
                      <td className="border border-gray-300 dark:border-neutral-600 px-2 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={row.status}
                          onChange={(e) => handleStatusChange(row.canalid, e.target.checked)}
                          disabled={showUseCreateMessage}
                          className={`w-5 h-5 rounded focus:ring-2 focus:ring-orange-500 appearance-none border-2 ${
                            isCheckedAndExisting 
                              ? 'bg-orange-600 border-orange-600 checked:bg-orange-600 checked:border-orange-600' 
                              : row.status && !showUseCreateMessage
                              ? 'bg-orange-600 border-orange-600 checked:bg-orange-600 checked:border-orange-600'
                              : 'bg-gray-200 dark:bg-neutral-800 border-gray-300 dark:border-neutral-600 checked:bg-orange-600 checked:border-orange-600'
                          } ${showUseCreateMessage ? 'opacity-50 cursor-not-allowed' : ''}`}
                          style={row.status && !showUseCreateMessage ? { backgroundColor: '#ea580c', borderColor: '#ea580c' } : showUseCreateMessage ? { opacity: 0.5 } : {}}
                        />
                      </td>
                      <td className="border border-gray-300 dark:border-neutral-600 px-4 py-2 font-mono text-sm text-gray-900 dark:text-white">
                        {row.canal}
                      </td>
                      <td className="border border-gray-300 dark:border-neutral-600 px-4 py-2 align-top">
                        {isTelegram ? (
                          <div className="space-y-1">
                            {!row.status ? (
                              <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                                Habilita el canal
                              </div>
                            ) : row.existente && telegramCodigo ? (
                              <div className="relative">
                                <input
                                  type="text"
                                  value={telegramCodigo || row.identificador || 'Código generado'}
                                  readOnly
                                  className="w-full px-3 py-2 bg-gray-200 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg font-mono text-sm text-gray-600 dark:text-gray-300 opacity-75"
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" title="Canal existente - solo lectura">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                  </svg>
                                </span>
                              </div>
                            ) : isUpdateMode && !telegramCodigo ? (
                              <div className="text-xs text-orange-600 dark:text-orange-400 italic">
                                Genera un código para enlazar Telegram
                              </div>
                            ) : (
                              <>
                                {!telegramCodigo ? (
                                  <button
                                    type="button"
                                    onClick={() => handleGenerarCodigoTelegram(row.canalid, formData.usuarioid)}
                                    disabled={generando}
                                    className="px-2 py-1 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white font-mono text-xs rounded font-bold transition-colors whitespace-nowrap"
                                    title="Se enviará un código por email. No necesitas guardar el formulario."
                                  >
                                    {generando ? 'GENERANDO...' : 'GENERAR CÓDIGO'}
                                  </button>
                                ) : (
                                  <div className="space-y-0.5">
                                    <div className="p-1 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded">
                                      <input
                                        type="text"
                                        value={telegramCodigo}
                                        readOnly
                                        className="w-full px-1 py-0.5 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded font-mono text-xs text-green-900 dark:text-green-300 text-center font-bold"
                                      />
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        navigator.clipboard.writeText(telegramCodigo);
                                        alert('Código copiado al portapapeles');
                                      }}
                                      className="w-full px-1.5 py-0.5 bg-blue-600 hover:bg-blue-700 text-white font-mono text-xs rounded font-semibold transition-colors"
                                    >
                                      COPIAR
                                    </button>
                                  </div>
                                )}
                                {mensaje && (
                                  <div className="text-xs text-orange-600 dark:text-orange-400 italic">
                                    {mensaje}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        ) : showUseCreateMessage ? (
                          <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                            Usa Crear para agregar este canal
                          </div>
                        ) : (
                          <div className="relative">
                            <input
                              type="text"
                              value={row.identificador}
                              onChange={(e) => handleIdentificadorChange(row.canalid, e.target.value)}
                              disabled={!row.status || isDisabled || !canEditIdentificador || showUseCreateMessage}
                              className={`w-full px-3 py-2 bg-gray-200 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded-lg font-mono text-sm text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 ${
                                (!row.status || isDisabled || !canEditIdentificador || showUseCreateMessage) ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                              placeholder={
                                row.canal.toLowerCase() === 'whatsapp' 
                                  ? 'Ej: +51987654321' 
                                  : row.canal.toLowerCase() === 'correo'
                                  ? 'Ej: usuario@demo.com'
                                  : 'Identificador del canal'
                              }
                            />
                            {(isDisabled || !canEditIdentificador || showUseCreateMessage) && (
                              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400" title="Canal existente - solo lectura">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                                </svg>
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
