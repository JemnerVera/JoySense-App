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
import MultiSelectWithPlaceholder from '../MultiSelectWithPlaceholder';
import SelectWithPlaceholder from '../SelectWithPlaceholder';

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
  
  // Estados para datos de tabla cargados dinámicamente
  const [tablaData, setTablaData] = useState<any[]>([]);
  const [loadingTablaData, setLoadingTablaData] = useState(false);
  const [fuenteNombre, setFuenteNombre] = useState<string | null>(null);

  // Determinar tipo de origen (GEOGRAFÍA o TABLA) y cargar datos correspondientes
  useEffect(() => {
    if (!selectedOrigen || !selectedFuente || !origenesData.length || !fuentesData.length) {
      setGeografiaLevel(null);
      setFuenteNombre(null);
      setTablaData([]);
      return;
    }

    const origen = origenesData.find(o => o.origenid === selectedOrigen);
    const fuente = fuentesData.find(f => f.fuenteid === selectedFuente);
    
    if (!origen || !fuente) {
      setGeografiaLevel(null);
      setFuenteNombre(null);
      setTablaData([]);
      return;
    }

    const origenName = origen.origen?.toUpperCase() || '';
    const fuenteName = fuente.fuente?.toLowerCase() || '';
    setFuenteNombre(fuente.fuente || null);

    // Si es GEOGRAFÍA, determinar el nivel
    if (origenName === 'GEOGRAFÍA' || origenName === 'GEOGRAFIA') {
      if (fuenteName === 'pais') setGeografiaLevel('pais');
      else if (fuenteName === 'empresa') setGeografiaLevel('empresa');
      else if (fuenteName === 'fundo') setGeografiaLevel('fundo');
      else if (fuenteName === 'ubicacion') setGeografiaLevel('ubicacion');
      else setGeografiaLevel(null);
      setTablaData([]);
    } 
    // Si es TABLA, cargar datos de la tabla
    else if (origenName === 'TABLA') {
      setGeografiaLevel(null);
      // Cargar datos de la tabla dinámicamente
      const loadTablaData = async () => {
        setLoadingTablaData(true);
        try {
          const data = await JoySenseService.getTableData(fuenteName, 1000);
          setTablaData(Array.isArray(data) ? data : []);
        } catch (error) {
          console.error(`Error cargando datos de tabla ${fuenteName}:`, error);
          setTablaData([]);
          setMessage({ type: 'error', text: `Error al cargar datos de ${fuenteName}` });
        } finally {
          setLoadingTablaData(false);
        }
      };
      loadTablaData();
    } else {
      setGeografiaLevel(null);
      setTablaData([]);
    }
  }, [selectedOrigen, selectedFuente, origenesData, fuentesData]);

  // Cargar objetos según el tipo de origen (GEOGRAFÍA o TABLA)
  const objetosData = useMemo(() => {
    // Si es geografía, usar datos geográficos
    if (geografiaLevel) {
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
    }
    
    // Si es TABLA, usar datos cargados dinámicamente
    if (tablaData.length > 0 && fuenteNombre) {
      // Mapeo de nombres de tabla a campos ID y nombre
      const tableFieldMap: Record<string, { idField: string; nameField: string }> = {
        'nodo': { idField: 'nodoid', nameField: 'nodo' },
        'sensor': { idField: 'sensorid', nameField: 'sensor' },
        'usuario': { idField: 'usuarioid', nameField: 'login' },
        'perfil': { idField: 'perfilid', nameField: 'perfil' },
        'contacto': { idField: 'contactoid', nameField: 'celular' },
        'tipo': { idField: 'tipoid', nameField: 'tipo' },
        'metrica': { idField: 'metricaid', nameField: 'metrica' },
        'entidad': { idField: 'entidadid', nameField: 'entidad' },
        'localizacion': { idField: 'localizacionid', nameField: 'localizacion' },
        'umbral': { idField: 'umbralid', nameField: 'umbral' },
        'criticidad': { idField: 'criticidadid', nameField: 'criticidad' },
        'regla': { idField: 'reglaid', nameField: 'nombre' }
      };

      const fields = tableFieldMap[fuenteNombre.toLowerCase()] || { 
        idField: `${fuenteNombre.toLowerCase()}id`, 
        nameField: fuenteNombre.toLowerCase() 
      };

      return tablaData.map(item => ({
        id: item[fields.idField],
        nombre: item[fields.nameField] || `${fuenteNombre} ${item[fields.idField]}`,
        objetoid: item[fields.idField]
      }));
    }

    return [];
  }, [geografiaLevel, paisesData, empresasData, fundosData, ubicacionesData, tablaData, fuenteNombre]);

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
    if (!selectedOrigen || !origenesData.length) return [];
    
    const origen = origenesData.find(o => o.origenid === selectedOrigen);
    if (!origen) return [];
    
    const origenName = origen.origen?.toUpperCase() || '';
    
    // Fuentes de geografía
    const geografiaFuentes = ['pais', 'empresa', 'fundo', 'ubicacion'];
    
    // Filtrar fuentes según el origen
    return fuentesData
      .filter(f => {
        const fuenteName = f.fuente?.toLowerCase() || '';
        
        // Si el origen es GEOGRAFÍA, solo mostrar fuentes de geografía
        if (origenName === 'GEOGRAFÍA' || origenName === 'GEOGRAFIA') {
          return geografiaFuentes.includes(fuenteName);
        }
        
        // Si el origen es TABLA, excluir fuentes de geografía
        if (origenName === 'TABLA') {
          return !geografiaFuentes.includes(fuenteName);
        }
        
        // Por defecto, mostrar todas
        return true;
      })
      .map(f => ({
        value: f.fuenteid,
        label: f.fuente || `Fuente ${f.fuenteid}`
      }));
  }, [fuentesData, selectedOrigen, origenesData]);

  return (
    <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 300px)', paddingBottom: '200px' }}>
      {/* Mensaje */}
      {message && <div className="mb-4"><MessageDisplay message={message} /></div>}

      {/* Selección de Perfiles y Origen - Una sola fila */}
      <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 mb-4 flex-shrink-0" style={{ position: 'relative', zIndex: 10 }}>
        <h3 className="text-lg font-bold text-purple-500 font-mono tracking-wider mb-3">
          CONFIGURACIÓN INICIAL
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
          {/* Perfiles (múltiple) */}
          <div style={{ position: 'relative', zIndex: 30 }}>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Perfiles <span className="text-red-500">*</span>
            </label>
            <MultiSelectWithPlaceholder
              value={selectedPerfiles}
              onChange={setSelectedPerfiles}
              options={perfilOptions}
              placeholder="Seleccione perfiles"
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded text-neutral-300 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
              disabled={false}
            />
          </div>

          {/* Origen */}
          <div style={{ position: 'relative', zIndex: 30 }}>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Origen <span className="text-red-500">*</span>
            </label>
            <SelectWithPlaceholder
              value={selectedOrigen || null}
              onChange={(value) => {
                setSelectedOrigen(value ? Number(value) : null);
                setSelectedFuente(null); // Reset fuente cuando cambia origen
              }}
              options={origenOptions}
              placeholder="Seleccione un origen"
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded text-neutral-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono"
              disabled={false}
            />
          </div>

          {/* Fuente */}
          <div style={{ position: 'relative', zIndex: 30 }}>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Fuente <span className="text-red-500">*</span>
            </label>
            <SelectWithPlaceholder
              value={selectedFuente || null}
              onChange={(value) => setSelectedFuente(value ? Number(value) : null)}
              options={fuenteOptions}
              placeholder={selectedOrigen ? 'Seleccione una fuente' : 'Seleccione origen primero'}
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded text-neutral-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!selectedOrigen || fuenteOptions.length === 0}
            />
          </div>
        </div>
      </div>

      {/* Matriz de Permisos */}
      {((geografiaLevel || (tablaData.length > 0 && fuenteNombre)) && objetosData.length > 0) && (
        <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6 flex-1 flex flex-col min-h-0">
          <h3 className="text-xl font-bold text-purple-500 font-mono tracking-wider mb-4">
            ASIGNAR PERMISOS - {geografiaLevel ? geografiaLevel.toUpperCase() : (fuenteNombre?.toUpperCase() || '')}
          </h3>
          
          {loadingTablaData && (
            <div className="text-center py-8 text-neutral-400">
              Cargando datos de {fuenteNombre}...
            </div>
          )}

          <div className="overflow-auto flex-1">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-neutral-800">
                  <th className="border border-neutral-700 px-4 py-3 text-left text-neutral-300 font-semibold sticky left-0 bg-neutral-800 z-10">
                    {geografiaLevel ? geografiaLevel.toUpperCase() : (fuenteNombre?.toUpperCase() || 'OBJETO')}
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

