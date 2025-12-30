/**
 * AsignarPermisosTab - Componente para asignación masiva de permisos
 * Permite seleccionar múltiples perfiles, origen y fuente, y asignar permisos
 * mediante una matriz tipo Power BI
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { JoySenseService } from '../../services/backend-api';
import { MessageDisplay } from '../SystemParameters/MessageDisplay';

// ============================================================================
// INTERFACES
// ============================================================================

interface AsignarPermisosTabProps {
  perfilesData?: any[];
  origenesData?: any[];
  fuentesData?: any[];
  paisesData?: any[];
  empresasData?: any[];
  fundosData?: any[];
  ubicacionesData?: any[];
  onSuccess?: () => void;
}

interface PermisoMatrix {
  [objetoid: string]: {
    puede_ver: boolean;
    puede_insertar: boolean;
    puede_actualizar: boolean;
    puede_eliminar: boolean;
  };
}

type GeografiaLevel = 'pais' | 'empresa' | 'fundo' | 'ubicacion' | null;

// ============================================================================
// COMPONENT
// ============================================================================

export function AsignarPermisosTab({
  perfilesData = [],
  origenesData = [],
  fuentesData = [],
  paisesData = [],
  empresasData = [],
  fundosData = [],
  ubicacionesData = [],
  onSuccess
}: AsignarPermisosTabProps) {
  const { t } = useLanguage();
  const { user } = useAuth();

  // Estados
  const [selectedPerfiles, setSelectedPerfiles] = useState<number[]>([]);
  const [selectedOrigen, setSelectedOrigen] = useState<number | null>(null);
  const [selectedFuente, setSelectedFuente] = useState<number | null>(null);
  const [geografiaLevel, setGeografiaLevel] = useState<GeografiaLevel>(null);
  const [permisoMatrix, setPermisoMatrix] = useState<PermisoMatrix>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; text: string } | null>(null);

  // Determinar nivel de geografía según fuente seleccionada
  useEffect(() => {
    if (!selectedFuente || !fuentesData.length) {
      setGeografiaLevel(null);
      return;
    }

    const fuente = fuentesData.find(f => f.fuenteid === selectedFuente);
    if (!fuente) {
      setGeografiaLevel(null);
      return;
    }

    const fuenteName = fuente.fuente?.toLowerCase() || '';
    if (fuenteName === 'pais') setGeografiaLevel('pais');
    else if (fuenteName === 'empresa') setGeografiaLevel('empresa');
    else if (fuenteName === 'fundo') setGeografiaLevel('fundo');
    else if (fuenteName === 'ubicacion') setGeografiaLevel('ubicacion');
    else setGeografiaLevel(null);
  }, [selectedFuente, fuentesData]);

  // Cargar objetos según el nivel de geografía seleccionado
  const objetosData = useMemo(() => {
    if (!geografiaLevel) return [];

    switch (geografiaLevel) {
      case 'pais':
        return paisesData.map(p => ({
          id: p.paisid,
          nombre: p.pais || `País ${p.paisid}`,
          objetoid: p.paisid
        }));
      case 'empresa':
        return empresasData.map(e => ({
          id: e.empresaid,
          nombre: e.empresa || `Empresa ${e.empresaid}`,
          objetoid: e.empresaid
        }));
      case 'fundo':
        return fundosData.map(f => ({
          id: f.fundoid,
          nombre: f.fundo || `Fundo ${f.fundoid}`,
          objetoid: f.fundoid
        }));
      case 'ubicacion':
        return ubicacionesData.map(u => ({
          id: u.ubicacionid,
          nombre: u.ubicacion || `Ubicación ${u.ubicacionid}`,
          objetoid: u.ubicacionid
        }));
      default:
        return [];
    }
  }, [geografiaLevel, paisesData, empresasData, fundosData, ubicacionesData]);

  // Inicializar matriz de permisos cuando cambian los objetos
  useEffect(() => {
    if (objetosData.length > 0) {
      const newMatrix: PermisoMatrix = {};
      objetosData.forEach(obj => {
        newMatrix[obj.objetoid] = {
          puede_ver: false,
          puede_insertar: false,
          puede_actualizar: false,
          puede_eliminar: false
        };
      });
      setPermisoMatrix(newMatrix);
    } else {
      setPermisoMatrix({});
    }
  }, [objetosData]);

  // Handler para toggle de permisos
  const handlePermisoToggle = useCallback((objetoid: string, permiso: keyof PermisoMatrix[string]) => {
    setPermisoMatrix(prev => ({
      ...prev,
      [objetoid]: {
        ...prev[objetoid],
        [permiso]: !prev[objetoid]?.[permiso]
      }
    }));
  }, []);

  // Handler para seleccionar/deseleccionar todos los permisos de una columna
  const handleSelectAllColumn = useCallback((permiso: keyof PermisoMatrix[string]) => {
    setPermisoMatrix(prev => {
      const newMatrix = { ...prev };
      const allSelected = Object.values(prev).every(p => p[permiso]);
      
      Object.keys(newMatrix).forEach(objetoid => {
        newMatrix[objetoid] = {
          ...newMatrix[objetoid],
          [permiso]: !allSelected
        };
      });
      
      return newMatrix;
    });
  }, []);

  // Guardar permisos
  const handleGuardar = useCallback(async () => {
    if (selectedPerfiles.length === 0) {
      setMessage({ type: 'warning', text: 'Por favor seleccione al menos un perfil' });
      return;
    }

    if (!selectedOrigen) {
      setMessage({ type: 'warning', text: 'Por favor seleccione un origen' });
      return;
    }

    if (!selectedFuente) {
      setMessage({ type: 'warning', text: 'Por favor seleccione una fuente' });
      return;
    }

    if (objetosData.length === 0) {
      setMessage({ type: 'warning', text: 'No hay objetos para asignar permisos' });
      return;
    }

    // Verificar que al menos un permiso esté seleccionado
    const hasAnyPermission = Object.values(permisoMatrix).some(p => 
      p.puede_ver || p.puede_insertar || p.puede_actualizar || p.puede_eliminar
    );

    if (!hasAnyPermission) {
      setMessage({ type: 'warning', text: 'Por favor seleccione al menos un permiso' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const userId = user?.user_metadata?.usuarioid || 1;
      const now = new Date().toISOString();

      // Crear array de permisos a insertar
      const permisosToInsert: any[] = [];

      selectedPerfiles.forEach(perfilid => {
        objetosData.forEach(obj => {
          const permisos = permisoMatrix[obj.objetoid];
          
          // Solo crear permiso si al menos uno está activo
          if (permisos.puede_ver || permisos.puede_insertar || permisos.puede_actualizar || permisos.puede_eliminar) {
            permisosToInsert.push({
              perfilid,
              origenid: selectedOrigen,
              fuenteid: selectedFuente,
              objetoid: obj.objetoid,
              puede_ver: permisos.puede_ver,
              puede_insertar: permisos.puede_insertar,
              puede_actualizar: permisos.puede_actualizar,
              puede_eliminar: permisos.puede_eliminar,
              statusid: 1,
              usercreatedid: userId,
              datecreated: now,
              usermodifiedid: userId,
              datemodified: now
            });
          }
        });
      });

      // Insertar permisos de forma masiva
      const results = await Promise.all(
        permisosToInsert.map(permiso => 
          JoySenseService.insertTableRow('permiso', permiso)
        )
      );

      const errors = results.filter(r => !r || (r as any).error);
      if (errors.length > 0) {
        setMessage({ 
          type: 'error', 
          text: `Error al guardar algunos permisos: ${errors.length} de ${results.length} fallaron` 
        });
      } else {
        setMessage({ 
          type: 'success', 
          text: `Se guardaron ${results.length} permisos correctamente` 
        });
        onSuccess?.();
      }
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.message || 'Error al guardar permisos' 
      });
    } finally {
      setLoading(false);
    }
  }, [selectedPerfiles, selectedOrigen, selectedFuente, objetosData, permisoMatrix, user, onSuccess]);

  // Opciones de perfiles
  const perfilOptions = useMemo(() => {
    return perfilesData.map(p => ({
      value: p.perfilid,
      label: p.perfil || `Perfil ${p.perfilid}`
    }));
  }, [perfilesData]);

  // Opciones de orígenes
  const origenOptions = useMemo(() => {
    return origenesData.map(o => ({
      value: o.origenid,
      label: o.origen || `Origen ${o.origenid}`
    }));
  }, [origenesData]);

  // Opciones de fuentes (filtradas por origen si está seleccionado)
  const fuenteOptions = useMemo(() => {
    if (!selectedOrigen) return [];
    
    return fuentesData
      .filter(f => {
        // Filtrar por origen si es necesario (asumiendo que hay relación)
        return true; // Por ahora mostrar todas
      })
      .map(f => ({
        value: f.fuenteid,
        label: f.fuente || `Fuente ${f.fuenteid}`
      }));
  }, [fuentesData, selectedOrigen]);

  return (
    <div className="p-6 space-y-6">
      {/* Mensaje */}
      {message && <MessageDisplay message={message} />}

      {/* Selección de Perfiles y Origen */}
      <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6 space-y-4">
        <h3 className="text-xl font-bold text-purple-500 font-mono tracking-wider mb-4">
          CONFIGURACIÓN INICIAL
        </h3>

        {/* Perfiles (múltiple) */}
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            Perfiles <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2 max-h-40 overflow-y-auto border border-neutral-700 rounded p-2">
            {perfilOptions.map(option => (
              <label key={option.value} className="flex items-center space-x-2 cursor-pointer hover:bg-neutral-800 p-2 rounded">
                <input
                  type="checkbox"
                  checked={selectedPerfiles.includes(option.value)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedPerfiles([...selectedPerfiles, option.value]);
                    } else {
                      setSelectedPerfiles(selectedPerfiles.filter(p => p !== option.value));
                    }
                  }}
                  className="w-4 h-4 text-purple-600 bg-neutral-800 border-neutral-600 rounded focus:ring-purple-500"
                />
                <span className="text-neutral-300">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Origen */}
        <div>
          <label className="block text-sm font-medium text-neutral-300 mb-2">
            Origen <span className="text-red-500">*</span>
          </label>
          <select
            value={selectedOrigen || ''}
            onChange={(e) => {
              setSelectedOrigen(Number(e.target.value));
              setSelectedFuente(null); // Reset fuente cuando cambia origen
            }}
            className="w-full px-4 py-2 bg-neutral-800 border border-neutral-600 rounded text-neutral-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="">Seleccione un origen</option>
            {origenOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Fuente */}
        {selectedOrigen && (
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Fuente <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedFuente || ''}
              onChange={(e) => setSelectedFuente(Number(e.target.value))}
              className="w-full px-4 py-2 bg-neutral-800 border border-neutral-600 rounded text-neutral-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Seleccione una fuente</option>
              {fuenteOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Matriz de Permisos */}
      {geografiaLevel && objetosData.length > 0 && (
        <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6">
          <h3 className="text-xl font-bold text-purple-500 font-mono tracking-wider mb-4">
            ASIGNAR PERMISOS - {geografiaLevel.toUpperCase()}
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-neutral-800">
                  <th className="border border-neutral-700 px-4 py-3 text-left text-neutral-300 font-semibold sticky left-0 bg-neutral-800 z-10">
                    {geografiaLevel.toUpperCase()}
                  </th>
                  <th className="border border-neutral-700 px-4 py-3 text-center text-neutral-300 font-semibold">
                    <div className="flex flex-col items-center">
                      <span>PUEDE VER</span>
                      <button
                        onClick={() => handleSelectAllColumn('puede_ver')}
                        className="text-xs text-purple-400 hover:text-purple-300 mt-1"
                      >
                        (Todos)
                      </button>
                    </div>
                  </th>
                  <th className="border border-neutral-700 px-4 py-3 text-center text-neutral-300 font-semibold">
                    <div className="flex flex-col items-center">
                      <span>PUEDE INSERTAR</span>
                      <button
                        onClick={() => handleSelectAllColumn('puede_insertar')}
                        className="text-xs text-purple-400 hover:text-purple-300 mt-1"
                      >
                        (Todos)
                      </button>
                    </div>
                  </th>
                  <th className="border border-neutral-700 px-4 py-3 text-center text-neutral-300 font-semibold">
                    <div className="flex flex-col items-center">
                      <span>PUEDE ACTUALIZAR</span>
                      <button
                        onClick={() => handleSelectAllColumn('puede_actualizar')}
                        className="text-xs text-purple-400 hover:text-purple-300 mt-1"
                      >
                        (Todos)
                      </button>
                    </div>
                  </th>
                  <th className="border border-neutral-700 px-4 py-3 text-center text-neutral-300 font-semibold">
                    <div className="flex flex-col items-center">
                      <span>PUEDE ELIMINAR</span>
                      <button
                        onClick={() => handleSelectAllColumn('puede_eliminar')}
                        className="text-xs text-purple-400 hover:text-purple-300 mt-1"
                      >
                        (Todos)
                      </button>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {objetosData.map(obj => (
                  <tr key={obj.id} className="hover:bg-neutral-800">
                    <td className="border border-neutral-700 px-4 py-3 text-neutral-300 sticky left-0 bg-neutral-900 z-10">
                      {obj.nombre}
                    </td>
                    <td className="border border-neutral-700 px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={permisoMatrix[obj.objetoid]?.puede_ver || false}
                        onChange={() => handlePermisoToggle(String(obj.objetoid), 'puede_ver')}
                        className="w-5 h-5 text-purple-600 bg-neutral-800 border-neutral-600 rounded focus:ring-purple-500 cursor-pointer"
                      />
                    </td>
                    <td className="border border-neutral-700 px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={permisoMatrix[obj.objetoid]?.puede_insertar || false}
                        onChange={() => handlePermisoToggle(String(obj.objetoid), 'puede_insertar')}
                        className="w-5 h-5 text-purple-600 bg-neutral-800 border-neutral-600 rounded focus:ring-purple-500 cursor-pointer"
                      />
                    </td>
                    <td className="border border-neutral-700 px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={permisoMatrix[obj.objetoid]?.puede_actualizar || false}
                        onChange={() => handlePermisoToggle(String(obj.objetoid), 'puede_actualizar')}
                        className="w-5 h-5 text-purple-600 bg-neutral-800 border-neutral-600 rounded focus:ring-purple-500 cursor-pointer"
                      />
                    </td>
                    <td className="border border-neutral-700 px-4 py-3 text-center">
                      <input
                        type="checkbox"
                        checked={permisoMatrix[obj.objetoid]?.puede_eliminar || false}
                        onChange={() => handlePermisoToggle(String(obj.objetoid), 'puede_eliminar')}
                        className="w-5 h-5 text-purple-600 bg-neutral-800 border-neutral-600 rounded focus:ring-purple-500 cursor-pointer"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Botón Guardar */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleGuardar}
              disabled={loading}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Guardando...' : 'Guardar Permisos'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

