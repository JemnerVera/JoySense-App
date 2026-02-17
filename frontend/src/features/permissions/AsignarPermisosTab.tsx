/**
 * AsignarPermisosTab - Componente para asignación masiva de permisos
 * Permite seleccionar múltiples perfiles, origen y fuentes, y asignar permisos
 * mediante una matriz tipo Power BI con pestañas para cada combinación
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { JoySenseService } from '../../services/backend-api';
import { MessageDisplay } from '../system-parameters/MessageDisplay';
import { DualListbox, SelectWithPlaceholder } from '../../components/shared/selectors';
import { 
  getGeografiaLevelOrder, 
  areFuentesConsecutive, 
  getChildObjects,
  getObjectHierarchy,
  filterObjectsByParentHierarchy,
  FUENTE_TO_LEVEL
} from '../../utils/geografiaHierarchy';
import { useUserGeographyPermissions } from '../../hooks/useUserGeographyPermissions';
import { filterObjectsByUserPermissions, userCanAssignPermissionToObject } from '../../utils/permissionValidation';

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
  nodosData?: any[];
  localizacionesData?: any[];
  permisosTipo?: 'permisos-geo' | 'permisos-conf';
  onSuccess?: () => void;
}

interface PermisoMatrix {
  [objetoid: string]: {
    puede_ver: boolean;
    puede_insertar: boolean;
    puede_actualizar: boolean;
  };
}

interface TabConfig {
  key: string; // Formato: "perfilid-origenid-fuenteid"
  perfilid: number;
  origenid: number;
  fuenteid: number;
  perfilNombre: string;
  origenNombre: string;
  fuenteNombre: string;
}

type GeografiaLevel = 'pais' | 'empresa' | 'fundo' | 'ubicacion' | 'nodo' | 'localizacion' | null;

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
  nodosData = [],
  localizacionesData = [],
  permisosTipo,
  onSuccess
}: AsignarPermisosTabProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  // Obtener permisos del usuario actual para todos los niveles geográficos
  const { permissions: userGeographyPermissions, loading: loadingUserPermissions } = 
    useUserGeographyPermissions();
  
  // Opciones de cascade
  const [cascadeOptions, setCascadeOptions] = useState({
    enabled: false,
    fromRoot: false, // true = desde inicio, false = desde nivel actual
  });

  // Función helper para obtener el origen inicial según el tipo de permisos
  const getInitialOrigen = useCallback((): number | null => {
    if (!permisosTipo || !origenesData.length) {
      return null;
    }

    // Buscar el origen esperado (case insensitive, con o sin tilde)
    const origenEncontrado = origenesData.find(o => {
      const nombre = (o.origen || '').toUpperCase().trim();
      if (permisosTipo === 'permisos-geo') {
        return nombre === 'GEOGRAFÍA' || nombre === 'GEOGRAFIA';
      } else {
        return nombre === 'TABLA';
      }
    });

    return origenEncontrado ? origenEncontrado.origenid : null;
  }, [permisosTipo, origenesData]);

  // Inicializar el estado directamente con el valor correcto
  const [selectedOrigen, setSelectedOrigen] = useState<number | null>(() => getInitialOrigen());
  
  // Estados
  const [selectedPerfiles, setSelectedPerfiles] = useState<number[]>([]);
  const [selectedFuentes, setSelectedFuentes] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null); // Formato: "perfilid-origenid-fuenteid"
  const [geografiaLevel, setGeografiaLevel] = useState<GeografiaLevel>(null);
  const [permisoMatrix, setPermisoMatrix] = useState<PermisoMatrix>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning' | 'info'; text: string } | null>(null);
  const [existingPermisos, setExistingPermisos] = useState<any[]>([]); // Permisos existentes cargados
  const [loadingPermisos, setLoadingPermisos] = useState(false);
  
  // Estados para datos de tabla cargados dinámicamente
  const [tablaData, setTablaData] = useState<Record<number, any[]>>({}); // Múltiples fuentes pueden tener datos
  const [loadingTablaData, setLoadingTablaData] = useState<Record<number, boolean>>({});
  const [fuenteNombre, setFuenteNombre] = useState<string | null>(null);

  // Actualizar el origen cuando cambia el tipo de permisos o los datos de origen
  useEffect(() => {
    const nuevoOrigen = getInitialOrigen();
    if (nuevoOrigen !== null) {
      // Solo actualizar si el origen actual es diferente al esperado
      setSelectedOrigen(prev => {
        if (prev !== nuevoOrigen) {
          return nuevoOrigen;
        }
        return prev;
      });
    }
  }, [permisosTipo, origenesData, getInitialOrigen]); // Removido selectedOrigen de dependencias

  // Generar pestañas basadas en las selecciones
  const tabs = useMemo(() => {
    if (selectedPerfiles.length === 0 || !selectedOrigen || selectedFuentes.length === 0) {
      return [];
    }

    const tabsList: TabConfig[] = [];
    
    selectedPerfiles.forEach(perfilid => {
      selectedFuentes.forEach(fuenteid => {
        const perfil = perfilesData.find(p => p.perfilid === perfilid);
        const origen = origenesData.find(o => o.origenid === selectedOrigen);
        const fuente = fuentesData.find(f => f.fuenteid === fuenteid);
        
        if (perfil && origen && fuente) {
          tabsList.push({
            key: `${perfilid}-${selectedOrigen}-${fuenteid}`,
            perfilid,
            origenid: selectedOrigen,
            fuenteid,
            perfilNombre: perfil.perfil || `Perfil ${perfilid}`,
            origenNombre: origen.origen || `Origen ${selectedOrigen}`,
            fuenteNombre: fuente.fuente || `Fuente ${fuenteid}`
          });
        }
      });
    });

    return tabsList;
  }, [selectedPerfiles, selectedOrigen, selectedFuentes, perfilesData, origenesData, fuentesData]);

  // Establecer la primera pestaña como activa cuando se generan las pestañas
  useEffect(() => {
    if (tabs.length > 0) {
      // Si no hay pestaña activa o la pestaña activa ya no existe, seleccionar la primera
      if (!activeTab || !tabs.find(t => t.key === activeTab)) {
        setActiveTab(tabs[0].key);
      }
    } else {
      setActiveTab(null);
    }
  }, [tabs, activeTab]);

  // Obtener la configuración de la pestaña activa
  const activeTabConfig = useMemo(() => {
    return tabs.find(t => t.key === activeTab) || null;
  }, [tabs, activeTab]);

  // Determinar tipo de origen (GEOGRAFÍA o TABLA) y cargar datos correspondientes
  useEffect(() => {
    if (!activeTabConfig || !origenesData.length || !fuentesData.length) {
      setGeografiaLevel(null);
      setFuenteNombre(null);
      return;
    }

    const origen = origenesData.find(o => o.origenid === activeTabConfig.origenid);
    const fuente = fuentesData.find(f => f.fuenteid === activeTabConfig.fuenteid);
    
    if (!origen || !fuente) {
      setGeografiaLevel(null);
      setFuenteNombre(null);
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
      else if (fuenteName === 'nodo') setGeografiaLevel('nodo');
      else if (fuenteName === 'localizacion') setGeografiaLevel('localizacion');
      else setGeografiaLevel(null);
    } 
    // Si es TABLA, cargar datos de la tabla
    else if (origenName === 'TABLA') {
      setGeografiaLevel(null);
      // Cargar datos de la tabla dinámicamente solo si no están cargados
      if (!tablaData[activeTabConfig.fuenteid] && !loadingTablaData[activeTabConfig.fuenteid]) {
        const loadTablaData = async () => {
          setLoadingTablaData(prev => ({ ...prev, [activeTabConfig.fuenteid]: true }));
          try {
            const data = await JoySenseService.getTableData(fuenteName, 1000);
            setTablaData(prev => ({ ...prev, [activeTabConfig.fuenteid]: Array.isArray(data) ? data : [] }));
          } catch (error) {
            setTablaData(prev => ({ ...prev, [activeTabConfig.fuenteid]: [] }));
            setMessage({ type: 'error', text: `Error al cargar datos de ${fuenteName}` });
          } finally {
            setLoadingTablaData(prev => ({ ...prev, [activeTabConfig.fuenteid]: false }));
          }
        };
        loadTablaData();
      }
    } else {
      setGeografiaLevel(null);
    }
  }, [activeTabConfig, origenesData, fuentesData, tablaData, loadingTablaData]);

  // Cargar permisos existentes cuando cambia la pestaña activa
  // También cargar permisos de niveles superiores para filtrar objetos
  useEffect(() => {
    if (!activeTabConfig) {
      setExistingPermisos([]);
      return;
    }

    const loadExistingPermisos = async () => {
      setLoadingPermisos(true);
      try {
        // Cargar todos los permisos que coincidan con la combinación
        const allPermisos = await JoySenseService.getTableData('permiso', 10000);
        
        // Filtrar permisos del nivel actual
        const filtered = Array.isArray(allPermisos) 
          ? allPermisos.filter((p: any) => 
              p.perfilid === activeTabConfig.perfilid &&
              p.origenid === activeTabConfig.origenid &&
              p.fuenteid === activeTabConfig.fuenteid &&
              p.statusid === 1
            )
          : [];

        // Si es geografía, también cargar permisos de niveles superiores para filtrar
        if (geografiaLevel) {
          const currentOrder = getGeografiaLevelOrder(geografiaLevel);
          const parentLevels = ['pais', 'empresa', 'fundo', 'ubicacion', 'nodo', 'localizacion']
            .filter(level => getGeografiaLevelOrder(level) < currentOrder);

          parentLevels.forEach(parentLevel => {
            const parentFuente = fuentesData.find(f => 
              f.fuente?.toLowerCase() === parentLevel.toLowerCase()
            );

            if (parentFuente) {
              const parentPermisos = allPermisos.filter((p: any) => 
                p.perfilid === activeTabConfig.perfilid &&
                p.origenid === activeTabConfig.origenid &&
                p.fuenteid === parentFuente.fuenteid &&
                p.objetoid !== null &&
                p.statusid === 1
              );

              // Agregar permisos padre a la lista (solo para referencia, no se muestran en la matriz)
              filtered.push(...parentPermisos);
            }
          });
        }

        setExistingPermisos(filtered);
      } catch (error) {
        setExistingPermisos([]);
      } finally {
        setLoadingPermisos(false);
      }
    };

    loadExistingPermisos();
  }, [activeTabConfig, geografiaLevel, fuentesData]);

  // Detectar permisos padre existentes para filtrar objetos
  const parentPermisos = useMemo(() => {
    if (!activeTabConfig || !geografiaLevel) return [];

    const currentOrder = getGeografiaLevelOrder(geografiaLevel);
    const parentLevels = ['pais', 'empresa', 'fundo', 'ubicacion', 'nodo', 'localizacion']
      .filter(level => getGeografiaLevelOrder(level) < currentOrder);

    const parentPermisosList: Array<{ level: string; objetoid: number; fuenteid: number }> = [];

    parentLevels.forEach(parentLevel => {
      const parentFuente = fuentesData.find(f => 
        f.fuente?.toLowerCase() === parentLevel.toLowerCase()
      );

      if (parentFuente) {
        const permisosPadre = existingPermisos.filter((p: any) => 
          p.perfilid === activeTabConfig.perfilid &&
          p.origenid === activeTabConfig.origenid &&
          p.fuenteid === parentFuente.fuenteid &&
          p.objetoid !== null &&
          p.statusid === 1
        );

        permisosPadre.forEach((p: any) => {
          parentPermisosList.push({
            level: parentLevel,
            objetoid: p.objetoid,
            fuenteid: parentFuente.fuenteid
          });
        });
      }
    });

    return parentPermisosList;
  }, [activeTabConfig, geografiaLevel, existingPermisos, fuentesData]);

  // Cargar objetos según el tipo de origen (GEOGRAFÍA o TABLA)
  const objetosData = useMemo(() => {
    if (!activeTabConfig || loadingUserPermissions) return [];

    // Si es geografía, usar datos geográficos
    if (geografiaLevel) {
      let objetos: Array<{ id: number; nombre: string; objetoid: number }> = [];

      switch (geografiaLevel) {
        case 'pais':
          objetos = paisesData.map(p => ({
            id: p.paisid,
            nombre: p.pais || `País ${p.paisid}`,
            objetoid: p.paisid
          }));
          break;
        case 'empresa':
          objetos = empresasData.map(e => ({
            id: e.empresaid,
            nombre: e.empresa || `Empresa ${e.empresaid}`,
            objetoid: e.empresaid
          }));
          break;
        case 'fundo':
          objetos = fundosData.map(f => ({
            id: f.fundoid,
            nombre: f.fundo || `Fundo ${f.fundoid}`,
            objetoid: f.fundoid
          }));
          break;
        case 'ubicacion':
          objetos = ubicacionesData.map(u => ({
            id: u.ubicacionid,
            nombre: u.ubicacion || `Ubicación ${u.ubicacionid}`,
            objetoid: u.ubicacionid
          }));
          break;
        case 'nodo':
          objetos = nodosData.map(n => ({
            id: n.nodoid,
            nombre: n.nodo || `Nodo ${n.nodoid}`,
            objetoid: n.nodoid
          }));
          break;
        case 'localizacion':
          objetos = localizacionesData.map(l => ({
            id: l.localizacionid,
            nombre: l.localizacion || `Localización ${l.localizacionid}`,
            objetoid: l.localizacionid
          }));
          break;
        default:
          return [];
      }

      // Filtrar objetos según permisos del usuario y jerarquía de permisos padre
      if (userGeographyPermissions[geografiaLevel]?.puede_ver) {
        const filtered = filterObjectsByUserPermissions(
          objetos,
          geografiaLevel,
          userGeographyPermissions,
          parentPermisos,
          {
            paisesData,
            empresasData,
            fundosData,
            ubicacionesData,
            nodosData,
            localizacionesData
          }
        );
        return filtered;
      }

      // Si el usuario no tiene permiso para este nivel, no mostrar nada
      return [];
    }
    
    // Si es TABLA, usar datos cargados dinámicamente
    if (tablaData[activeTabConfig.fuenteid] && tablaData[activeTabConfig.fuenteid].length > 0 && fuenteNombre) {
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

      return tablaData[activeTabConfig.fuenteid].map(item => ({
        id: item[fields.idField],
        nombre: item[fields.nameField] || `${fuenteNombre} ${item[fields.idField]}`,
        objetoid: item[fields.idField]
      }));
    }

    return [];
  }, [
    geografiaLevel, 
    paisesData, 
    empresasData, 
    fundosData, 
    ubicacionesData, 
    nodosData, 
    localizacionesData, 
    tablaData, 
    fuenteNombre, 
    activeTabConfig, 
    parentPermisos, 
    existingPermisos, 
    fuentesData,
    userGeographyPermissions,
    loadingUserPermissions
  ]);

  // Inicializar matriz de permisos cuando cambian los objetos o los permisos existentes
  useEffect(() => {
    if (objetosData.length > 0 && activeTabConfig) {
      const newMatrix: PermisoMatrix = {};
      
      objetosData.forEach(obj => {
        // Buscar permiso existente para este objeto
        const existingPermiso = existingPermisos.find((p: any) => 
          p.objetoid === obj.objetoid || p.objetoid === null
        );
        
        // Si existe un permiso, usar sus valores; si no, inicializar en false
        newMatrix[obj.objetoid] = {
          puede_ver: existingPermiso?.puede_ver || false,
          puede_insertar: existingPermiso?.puede_insertar || false,
          puede_actualizar: existingPermiso?.puede_actualizar || false
        };
      });
      
      setPermisoMatrix(newMatrix);
    } else {
      setPermisoMatrix({});
    }
  }, [objetosData, existingPermisos, activeTabConfig]);

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

  // Funciones helper para cascade
  const createCascadeFromCurrent = async (
    objetosData: Array<{ id: number; nombre: string; objetoid: number }>,
    permisoMatrix: PermisoMatrix,
    geografiaLevel: GeografiaLevel,
    activeTabConfig: TabConfig,
    userGeographyPermissions: Record<string, { allowedObjects: number[]; puede_ver: boolean; puede_insertar?: boolean; puede_actualizar?: boolean }>,
    existingPermisos: any[],
    fuentesData: any[],
    permisosToUpsert: any[],
    userId: number,
    now: string,
    data: {
      paisesData?: any[];
      empresasData?: any[];
      fundosData?: any[];
      ubicacionesData?: any[];
      nodosData?: any[];
      localizacionesData?: any[];
    }
  ) => {
    if (!geografiaLevel) return;

    const lowerLevels = ['pais', 'empresa', 'fundo', 'ubicacion', 'nodo', 'localizacion']
      .filter(level => getGeografiaLevelOrder(level) > getGeografiaLevelOrder(geografiaLevel));

    // Para cada objeto seleccionado, crear permisos para sus hijos
    objetosData.forEach(obj => {
      const permisos = permisoMatrix[obj.objetoid];
      
      // Solo crear cascada si el objeto tiene al menos un permiso activo
      if (!permisos || (!permisos.puede_ver && !permisos.puede_insertar && !permisos.puede_actualizar)) {
        return;
      }

      // Crear permisos para cada nivel inferior
      lowerLevels.forEach(lowerLevel => {
        // Verificar que el usuario tenga permiso para este nivel
        if (!userGeographyPermissions[lowerLevel]?.puede_ver) {
          return; // Usuario no tiene permiso para este nivel, saltar
        }

        const childObjects = getChildObjects(geografiaLevel, obj.objetoid, lowerLevel, data);

        // Obtener el fuenteid del nivel inferior
        const lowerFuente = fuentesData.find(f => 
          f.fuente?.toLowerCase() === lowerLevel.toLowerCase()
        );

        if (lowerFuente && childObjects.length > 0) {
          childObjects.forEach(childObj => {
            // Obtener el ID del objeto hijo según el nivel
            let childObjetoid: number | null = null;
            if (lowerLevel === 'empresa') childObjetoid = childObj.empresaid;
            else if (lowerLevel === 'fundo') childObjetoid = childObj.fundoid;
            else if (lowerLevel === 'ubicacion') childObjetoid = childObj.ubicacionid;
            else if (lowerLevel === 'nodo') childObjetoid = childObj.nodoid;
            else if (lowerLevel === 'localizacion') childObjetoid = childObj.localizacionid;
            
            if (!childObjetoid) return;
            
            // Verificar que el usuario puede asignar permiso a este objeto hijo
            if (!userCanAssignPermissionToObject(childObjetoid, lowerLevel, userGeographyPermissions)) {
              return; // Usuario no tiene permiso para este objeto, saltar
            }
            
            // Verificar si ya existe un permiso para este objeto hijo
            const existingChildPermiso = existingPermisos.find((p: any) => 
              p.perfilid === activeTabConfig.perfilid &&
              p.origenid === activeTabConfig.origenid &&
              p.fuenteid === lowerFuente.fuenteid &&
              p.objetoid === childObjetoid
            );

            if (!existingChildPermiso) {
              // Crear permiso para el objeto hijo con los mismos permisos del padre
              permisosToUpsert.push({
                perfilid: activeTabConfig.perfilid,
                origenid: activeTabConfig.origenid,
                fuenteid: lowerFuente.fuenteid,
                objetoid: childObjetoid,
                puede_ver: permisos.puede_ver,
                puede_insertar: permisos.puede_insertar,
                puede_actualizar: permisos.puede_actualizar,
                statusid: 1,
                usercreatedid: userId,
                datecreated: now,
                usermodifiedid: userId,
                datemodified: now
              });
            }
          });
        }
      });
    });
  };

  const createCascadeFromRoot = async (
    objetosData: Array<{ id: number; nombre: string; objetoid: number }>,
    permisoMatrix: PermisoMatrix,
    geografiaLevel: GeografiaLevel,
    activeTabConfig: TabConfig,
    userGeographyPermissions: Record<string, { allowedObjects: number[]; puede_ver: boolean; puede_insertar?: boolean; puede_actualizar?: boolean }>,
    existingPermisos: any[],
    fuentesData: any[],
    permisosToUpsert: any[],
    userId: number,
    now: string,
    data: {
      paisesData?: any[];
      empresasData?: any[];
      fundosData?: any[];
      ubicacionesData?: any[];
      nodosData?: any[];
      localizacionesData?: any[];
    }
  ) => {
    if (!geografiaLevel) return;

    // Obtener la jerarquía completa desde pais hacia abajo
    const allLevels = ['pais', 'empresa', 'fundo', 'ubicacion', 'nodo', 'localizacion'];
    const currentLevelOrder = getGeografiaLevelOrder(geografiaLevel);

    // Para cada objeto seleccionado
    objetosData.forEach(obj => {
      const permisos = permisoMatrix[obj.objetoid];
      
      // Solo crear cascada si el objeto tiene al menos un permiso activo
      if (!permisos || (!permisos.puede_ver && !permisos.puede_insertar && !permisos.puede_actualizar)) {
        return;
      }

      // Obtener la jerarquía completa del objeto actual
      const objectHierarchy = getObjectHierarchy(geografiaLevel, obj.objetoid, data);

      // Crear permisos desde pais hacia abajo hasta el nivel actual
      for (let i = 0; i < currentLevelOrder; i++) {
        const level = allLevels[i];
        const levelOrder = getGeografiaLevelOrder(level);

        // Verificar que el usuario tenga permiso para este nivel
        if (!userGeographyPermissions[level]?.puede_ver) {
          continue; // Usuario no tiene permiso para este nivel, saltar
        }

        // Obtener el objetoid del nivel en la jerarquía
        let levelObjetoid: number | null = null;
        switch (level) {
          case 'pais': levelObjetoid = objectHierarchy.paisid || null; break;
          case 'empresa': levelObjetoid = objectHierarchy.empresaid || null; break;
          case 'fundo': levelObjetoid = objectHierarchy.fundoid || null; break;
          case 'ubicacion': levelObjetoid = objectHierarchy.ubicacionid || null; break;
          case 'nodo': levelObjetoid = objectHierarchy.nodoid || null; break;
          case 'localizacion': levelObjetoid = objectHierarchy.localizacionid || null; break;
        }

        if (!levelObjetoid) continue;

        // Verificar que el usuario puede asignar permiso a este objeto
        if (!userCanAssignPermissionToObject(levelObjetoid, level, userGeographyPermissions)) {
          continue; // Usuario no tiene permiso para este objeto, saltar
        }

        // Obtener el fuenteid del nivel
        const levelFuente = fuentesData.find(f => 
          f.fuente?.toLowerCase() === level.toLowerCase()
        );

        if (!levelFuente) continue;

        // Verificar si ya existe un permiso para este objeto
        const existingPermiso = existingPermisos.find((p: any) => 
          p.perfilid === activeTabConfig.perfilid &&
          p.origenid === activeTabConfig.origenid &&
          p.fuenteid === levelFuente.fuenteid &&
          p.objetoid === levelObjetoid
        );

        if (!existingPermiso) {
          // Crear permiso para este nivel con los mismos permisos del objeto seleccionado
          permisosToUpsert.push({
            perfilid: activeTabConfig.perfilid,
            origenid: activeTabConfig.origenid,
            fuenteid: levelFuente.fuenteid,
            objetoid: levelObjetoid,
            puede_ver: permisos.puede_ver,
            puede_insertar: permisos.puede_insertar,
            puede_actualizar: permisos.puede_actualizar,
            statusid: 1,
            usercreatedid: userId,
            datecreated: now,
            usermodifiedid: userId,
            datemodified: now
          });
        }
      }

      // También crear cascade para niveles inferiores (si aplica)
      const lowerLevels = allLevels.filter(level => 
        getGeografiaLevelOrder(level) > currentLevelOrder
      );

      for (const lowerLevel of lowerLevels) {
        // Verificar que el usuario tenga permiso para este nivel
        if (!userGeographyPermissions[lowerLevel]?.puede_ver) {
          continue;
        }

        const childObjects = getChildObjects(geografiaLevel, obj.objetoid, lowerLevel, data);
        const lowerFuente = fuentesData.find(f => 
          f.fuente?.toLowerCase() === lowerLevel.toLowerCase()
        );

        if (lowerFuente && childObjects.length > 0) {
          childObjects.forEach(childObj => {
            let childObjetoid: number | null = null;
            if (lowerLevel === 'empresa') childObjetoid = childObj.empresaid;
            else if (lowerLevel === 'fundo') childObjetoid = childObj.fundoid;
            else if (lowerLevel === 'ubicacion') childObjetoid = childObj.ubicacionid;
            else if (lowerLevel === 'nodo') childObjetoid = childObj.nodoid;
            else if (lowerLevel === 'localizacion') childObjetoid = childObj.localizacionid;
            
            if (!childObjetoid) return;
            
            // Verificar que el usuario puede asignar permiso a este objeto hijo
            if (!userCanAssignPermissionToObject(childObjetoid, lowerLevel, userGeographyPermissions)) {
              return;
            }
            
            const existingChildPermiso = existingPermisos.find((p: any) => 
              p.perfilid === activeTabConfig.perfilid &&
              p.origenid === activeTabConfig.origenid &&
              p.fuenteid === lowerFuente.fuenteid &&
              p.objetoid === childObjetoid
            );

            if (!existingChildPermiso) {
              permisosToUpsert.push({
                perfilid: activeTabConfig.perfilid,
                origenid: activeTabConfig.origenid,
                fuenteid: lowerFuente.fuenteid,
                objetoid: childObjetoid,
                puede_ver: permisos.puede_ver,
                puede_insertar: permisos.puede_insertar,
                puede_actualizar: permisos.puede_actualizar,
                statusid: 1,
                usercreatedid: userId,
                datecreated: now,
                usermodifiedid: userId,
                datemodified: now
              });
            }
          });
        }
      }
    });
  };

  // Guardar permisos
  const handleGuardar = useCallback(async () => {
    if (!activeTabConfig) {
      setMessage({ type: 'warning', text: 'Por favor seleccione una pestaña activa' });
      return;
    }

    if (objetosData.length === 0) {
      setMessage({ type: 'warning', text: 'No hay objetos para asignar permisos' });
      return;
    }

    // Verificar que al menos un permiso esté seleccionado
    const hasAnyPermission = Object.values(permisoMatrix).some(p => 
      p.puede_ver || p.puede_insertar || p.puede_actualizar
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

      // Verificar si todos los objetos tienen todos los permisos marcados (usar objetoid=null)
      const allObjectsHaveAllPermissions = objetosData.every((obj: { id: number; nombre: string; objetoid: number }) => {
        const permisos = permisoMatrix[obj.objetoid];
        return permisos?.puede_ver && permisos?.puede_insertar && 
               permisos?.puede_actualizar;
      });

      // Crear array de permisos a insertar/actualizar
      const permisosToUpsert: any[] = [];

      // Si todos los objetos tienen todos los permisos, crear permiso global (objetoid=null)
      if (allObjectsHaveAllPermissions && objetosData.length > 0) {
        const firstPermisos = permisoMatrix[objetosData[0].objetoid];
        const existingGlobalPermiso = existingPermisos.find((p: any) => 
          p.objetoid === null
        );

        if (existingGlobalPermiso) {
          permisosToUpsert.push({
            ...existingGlobalPermiso,
            puede_ver: firstPermisos.puede_ver,
            puede_insertar: firstPermisos.puede_insertar,
            puede_actualizar: firstPermisos.puede_actualizar,
            usermodifiedid: userId,
            datemodified: now
          });
        } else {
            permisosToUpsert.push({
              perfilid: activeTabConfig.perfilid,
              origenid: activeTabConfig.origenid,
              fuenteid: activeTabConfig.fuenteid,
              objetoid: null, // Permiso global
              puede_ver: firstPermisos.puede_ver,
              puede_insertar: firstPermisos.puede_insertar,
              puede_actualizar: firstPermisos.puede_actualizar,
              statusid: 1,
              usercreatedid: userId,
              datecreated: now,
              usermodifiedid: userId,
              datemodified: now
            });
        }
      } else {
        // Crear permisos específicos para cada objeto
        objetosData.forEach(obj => {
          const permisos = permisoMatrix[obj.objetoid];
          
          // Buscar permiso existente
          const existingPermiso = existingPermisos.find((p: any) => 
            p.objetoid === obj.objetoid
          );
          
          // Solo crear/actualizar permiso si al menos uno está activo
          if (permisos.puede_ver || permisos.puede_insertar || permisos.puede_actualizar) {
            if (existingPermiso) {
              // Actualizar permiso existente
              permisosToUpsert.push({
                ...existingPermiso,
                puede_ver: permisos.puede_ver,
                puede_insertar: permisos.puede_insertar,
                puede_actualizar: permisos.puede_actualizar,
                usermodifiedid: userId,
                datemodified: now
              });
            } else {
              // Crear nuevo permiso
              permisosToUpsert.push({
                perfilid: activeTabConfig.perfilid,
                origenid: activeTabConfig.origenid,
                fuenteid: activeTabConfig.fuenteid,
                objetoid: obj.objetoid,
                puede_ver: permisos.puede_ver,
                puede_insertar: permisos.puede_insertar,
                puede_actualizar: permisos.puede_actualizar,
                statusid: 1,
                usercreatedid: userId,
                datecreated: now,
                usermodifiedid: userId,
                datemodified: now
              });
            }
          } else if (existingPermiso) {
            // Si no hay permisos activos pero existe un permiso, desactivarlo
            permisosToUpsert.push({
              ...existingPermiso,
              statusid: 0,
              usermodifiedid: userId,
              datemodified: now
            });
          }
        });
      }

      // CASCADA MEJORADA para geografía
      // Solo si está habilitado y no todos los objetos tienen todos los permisos
      if (geografiaLevel && cascadeOptions.enabled && !allObjectsHaveAllPermissions) {
        if (cascadeOptions.fromRoot) {
          // Cascade desde el inicio de la jerarquía (desde pais hacia abajo)
          await createCascadeFromRoot(
            objetosData as Array<{ id: number; nombre: string; objetoid: number }>,
            permisoMatrix,
            geografiaLevel,
            activeTabConfig,
            userGeographyPermissions,
            existingPermisos,
            fuentesData,
            permisosToUpsert,
            userId,
            now,
            {
              paisesData,
              empresasData,
              fundosData,
              ubicacionesData,
              nodosData,
              localizacionesData
            }
          );
        } else {
          // Cascade desde el nivel actual (solo niveles inferiores)
          await createCascadeFromCurrent(
            objetosData as Array<{ id: number; nombre: string; objetoid: number }>,
            permisoMatrix,
            geografiaLevel,
            activeTabConfig,
            userGeographyPermissions,
            existingPermisos,
            fuentesData,
            permisosToUpsert,
            userId,
            now,
            {
              paisesData,
              empresasData,
              fundosData,
              ubicacionesData,
              nodosData,
              localizacionesData
            }
          );
        }
      }

      // Insertar/actualizar permisos
      const results = await Promise.all(
        permisosToUpsert.map(permiso => {
          if (permiso.permisoid) {
            // Actualizar
            return JoySenseService.updateTableRow('permiso', permiso.permisoid, permiso);
          } else {
            // Insertar
            return JoySenseService.insertTableRow('permiso', permiso);
          }
        })
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
        // Recargar permisos existentes
        const allPermisos = await JoySenseService.getTableData('permiso', 10000);
        const filtered = Array.isArray(allPermisos) 
          ? allPermisos.filter((p: any) => 
              p.perfilid === activeTabConfig.perfilid &&
              p.origenid === activeTabConfig.origenid &&
              p.fuenteid === activeTabConfig.fuenteid &&
              p.statusid === 1
            )
          : [];
        setExistingPermisos(filtered);
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
  }, [
    activeTabConfig, 
    objetosData, 
    permisoMatrix, 
    existingPermisos, 
    user, 
    onSuccess,
    cascadeOptions,
    userGeographyPermissions,
    geografiaLevel,
    fuentesData,
    paisesData,
    empresasData,
    fundosData,
    ubicacionesData,
    nodosData,
    localizacionesData
  ]);

  // Opciones para los dropdowns
  const perfilOptions = useMemo(() => {
    return perfilesData.map(p => ({
      value: p.perfilid,
      label: p.perfil || `Perfil ${p.perfilid}`
    }));
  }, [perfilesData]);

  const origenOptions = useMemo(() => {
    // Filtrar opciones de origen según el tipo de permisos
    let filteredOrigenes = origenesData;
    if (permisosTipo) {
      filteredOrigenes = origenesData.filter(o => {
        const nombre = (o.origen || '').toUpperCase().trim();
        if (permisosTipo === 'permisos-geo') {
          return nombre === 'GEOGRAFÍA' || nombre === 'GEOGRAFIA';
        } else if (permisosTipo === 'permisos-conf') {
          return nombre === 'TABLA';
        }
        return true;
      });
    }
    
    return filteredOrigenes.map(o => ({
      value: o.origenid,
      label: o.origen || `Origen ${o.origenid}`
    }));
  }, [origenesData, permisosTipo]);

  // Opciones de fuentes (filtradas por origen si está seleccionado y ordenadas por jerarquía)
  const fuenteOptions = useMemo(() => {
    if (!selectedOrigen) return [];

    const origen = origenesData.find(o => o.origenid === selectedOrigen);
    const origenName = origen?.origen?.toLowerCase() || '';

    const filtered = fuentesData.filter(f => {
      const fuenteName = f.fuente?.toLowerCase() || '';
      // Normalizar: 'geografía' o 'geografia' (con o sin tilde)
      if (origenName === 'geografía' || origenName === 'geografia') {
        return ['pais', 'empresa', 'fundo', 'ubicacion', 'nodo', 'localizacion'].includes(fuenteName);
      } else if (origenName === 'tabla') {
        return !['pais', 'empresa', 'fundo', 'ubicacion', 'nodo', 'localizacion'].includes(fuenteName);
      }
      return true;
    });

    // Ordenar por jerarquía geográfica
    const geografiaFuentes = filtered.filter(f => {
      const fuenteName = f.fuente?.toLowerCase() || '';
      return ['pais', 'empresa', 'fundo', 'ubicacion', 'nodo', 'localizacion'].includes(fuenteName);
    });
    
    const otrasFuentes = filtered.filter(f => {
      const fuenteName = f.fuente?.toLowerCase() || '';
      return !['pais', 'empresa', 'fundo', 'ubicacion', 'nodo', 'localizacion'].includes(fuenteName);
    });

    // Ordenar fuentes geográficas por jerarquía
    const geografiaOrdenadas = geografiaFuentes.sort((a, b) => {
      const levelA = FUENTE_TO_LEVEL[a.fuente?.toLowerCase() || ''] || '';
      const levelB = FUENTE_TO_LEVEL[b.fuente?.toLowerCase() || ''] || '';
      return getGeografiaLevelOrder(levelA) - getGeografiaLevelOrder(levelB);
    });

    // Combinar: primero geografía ordenada, luego otras fuentes
    return [...geografiaOrdenadas, ...otrasFuentes].map(f => ({
      value: f.fuenteid,
      label: f.fuente || `Fuente ${f.fuenteid}`
    }));
  }, [fuentesData, selectedOrigen, origenesData]);

  // Validar que las fuentes seleccionadas sean consecutivas
  useEffect(() => {
    if (selectedFuentes.length === 0 || !selectedOrigen) return;

    const origen = origenesData.find(o => o.origenid === selectedOrigen);
    const origenName = origen?.origen?.toLowerCase() || '';

    // Solo validar si es geografía
    if (origenName === 'geografía' || origenName === 'geografia') {
      const fuenteNames = selectedFuentes
        .map(fuenteid => {
          const fuente = fuentesData.find(f => f.fuenteid === fuenteid);
          return fuente?.fuente?.toLowerCase() || '';
        })
        .filter(Boolean);

      const validation = areFuentesConsecutive(fuenteNames);
      
      if (!validation.valid) {
        setMessage({
          type: 'warning',
          text: validation.message || 'Las fuentes seleccionadas deben ser consecutivas en la jerarquía'
        });
      } else if (message?.type === 'warning' && message.text?.includes('consecutivas')) {
        // Limpiar el mensaje de advertencia si ahora es válido
        setMessage(null);
      }
    }
  }, [selectedFuentes, selectedOrigen, origenesData, fuentesData, message]);

  return (
    <div className="flex flex-col" style={{ minHeight: 'calc(100vh - 300px)', paddingBottom: '200px' }}>
      {/* Mensaje */}
      {message && <div className="mb-4"><MessageDisplay message={message} /></div>}

      {/* Selección de Perfiles, Origen y Fuentes - Una sola fila */}
      <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 mb-4 flex-shrink-0" style={{ position: 'relative', zIndex: 50 }}>
        <div className="grid grid-cols-1 gap-4" style={{ position: 'relative', zIndex: 50 }}>
          {/* Perfiles (múltiple) */}
          <div style={{ position: 'relative', zIndex: 100 }}>
            <label className="block text-sm font-bold mb-2 font-mono text-orange-500">PERFILES</label>
            <DualListbox
              value={selectedPerfiles}
              onChange={setSelectedPerfiles}
              options={perfilOptions}
              placeholder="Seleccione perfiles"
              disabled={false}
              canFilter={true}
              themeColor="orange"
              availableLabel="DISPONIBLES"
              selectedLabel="SELECCIONADOS"
            />
          </div>

          {/* Origen */}
          <div style={{ position: 'relative', zIndex: 100 }}>
            <label className="block text-sm font-bold mb-2 font-mono text-orange-500">ORIGEN</label>
            <SelectWithPlaceholder
              value={selectedOrigen || null}
              onChange={(value) => {
                const newValue = value ? Number(value) : null;
                setSelectedOrigen(newValue);
                setSelectedFuentes([]); // Reset fuentes cuando cambia origen
              }}
              options={origenOptions}
              placeholder="Seleccione un origen"
              className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded text-neutral-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 font-mono"
              disabled={false}
              allowExternalChange={true}
              themeColor="orange"
            />
          </div>

          {/* Fuentes (múltiple) */}
          <div style={{ position: 'relative', zIndex: 100 }}>
            <label className="block text-sm font-bold mb-2 font-mono text-orange-500">FUENTES</label>
            <DualListbox
              value={selectedFuentes}
              onChange={setSelectedFuentes}
              options={fuenteOptions}
              placeholder={selectedOrigen ? 'Seleccione fuentes' : 'Seleccione origen primero'}
              disabled={!selectedOrigen || fuenteOptions.length === 0}
              canFilter={true}
              themeColor="orange"
              availableLabel="DISPONIBLES"
              selectedLabel="SELECCIONADOS"
            />
          </div>
        </div>
      </div>

      {/* Opciones de Cascade - Solo mostrar si es geografía */}
      {activeTabConfig && geografiaLevel && objetosData.length > 0 && (
        <div className="bg-neutral-800 border border-neutral-700 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-neutral-300 cursor-pointer">
              <input
                type="checkbox"
                checked={cascadeOptions.enabled}
                onChange={(e) => setCascadeOptions(prev => ({ ...prev, enabled: e.target.checked }))}
                className="w-4 h-4 text-orange-600 bg-neutral-800 border-neutral-600 rounded focus:ring-orange-500 cursor-pointer"
              />
              <span className="font-mono text-sm">Habilitar cascade</span>
            </label>

            {cascadeOptions.enabled && (
              <label className="flex items-center gap-2 text-neutral-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cascadeOptions.fromRoot}
                  onChange={(e) => setCascadeOptions(prev => ({ ...prev, fromRoot: e.target.checked }))}
                  className="w-4 h-4 text-orange-600 bg-neutral-800 border-neutral-600 rounded focus:ring-orange-500 cursor-pointer"
                />
                <span className="font-mono text-sm">Cascade desde inicio de jerarquía</span>
              </label>
            )}
          </div>
          {cascadeOptions.enabled && (
            <p className="text-xs text-neutral-400 mt-2 ml-6">
              {cascadeOptions.fromRoot 
                ? 'Se crearán permisos desde el nivel más alto (pais) hacia abajo para todos los objetos seleccionados'
                : 'Se crearán permisos solo para los niveles inferiores al nivel actual'}
            </p>
          )}
        </div>
      )}

      {/* Matriz de Permisos */}
      {activeTabConfig && ((geografiaLevel || (tablaData[activeTabConfig.fuenteid] && tablaData[activeTabConfig.fuenteid].length > 0 && fuenteNombre)) && objetosData.length > 0) && (
        <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6 flex-1 flex flex-col min-h-0">
          {/* Pestañas de combinaciones - Solo mostrar si hay más de 1 combinación */}
          {tabs.length > 1 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2 justify-center">
                {tabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-4 py-2 rounded-lg font-mono text-sm transition-colors ${
                      activeTab === tab.key
                        ? 'bg-orange-600 text-white'
                        : 'bg-neutral-800 text-neutral-300 hover:bg-neutral-700'
                    }`}
                  >
                    {tab.fuenteNombre.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {loadingTablaData[activeTabConfig.fuenteid] && (
            <div className="text-center py-8 text-neutral-400">
              Cargando datos de {fuenteNombre}...
            </div>
          )}

          {loadingPermisos && (
            <div className="text-center py-8 text-neutral-400">
              Cargando permisos existentes...
            </div>
          )}

          {!loadingTablaData[activeTabConfig.fuenteid] && !loadingPermisos && (
            <>
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
                            className="text-xs text-orange-400 hover:text-orange-300 mt-1"
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
                            className="text-xs text-orange-400 hover:text-orange-300 mt-1"
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
                            className="text-xs text-orange-400 hover:text-orange-300 mt-1"
                          >
                            (Todos)
                          </button>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {objetosData.map(obj => {
                      // Verificar si el objeto ya tiene permiso asignado
                      const existingPermiso = existingPermisos.find((p: any) => 
                        p.objetoid === obj.objetoid && p.statusid === 1
                      );
                      const hasExistingPermission = !!existingPermiso;
                      
                      return (
                      <tr key={obj.id} className={`hover:bg-neutral-800 ${hasExistingPermission ? 'bg-neutral-800/50' : ''}`}>
                        <td className="border border-neutral-700 px-4 py-3 text-neutral-300 sticky left-0 bg-neutral-900 z-10">
                          <div className="flex items-center gap-2">
                            {hasExistingPermission && (
                              <span className="text-xs text-orange-400" title="Ya tiene permiso asignado">
                                ✓
                              </span>
                            )}
                            {obj.nombre}
                          </div>
                        </td>
                        <td className="border border-neutral-700 px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={permisoMatrix[obj.objetoid]?.puede_ver || false}
                            onChange={() => handlePermisoToggle(String(obj.objetoid), 'puede_ver')}
                            className="w-5 h-5 text-orange-600 bg-neutral-800 border-neutral-600 rounded focus:ring-orange-500 cursor-pointer"
                          />
                        </td>
                        <td className="border border-neutral-700 px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={permisoMatrix[obj.objetoid]?.puede_insertar || false}
                            onChange={() => handlePermisoToggle(String(obj.objetoid), 'puede_insertar')}
                            className="w-5 h-5 text-orange-600 bg-neutral-800 border-neutral-600 rounded focus:ring-orange-500 cursor-pointer"
                          />
                        </td>
                        <td className="border border-neutral-700 px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            checked={permisoMatrix[obj.objetoid]?.puede_actualizar || false}
                            onChange={() => handlePermisoToggle(String(obj.objetoid), 'puede_actualizar')}
                            className="w-5 h-5 text-orange-600 bg-neutral-800 border-neutral-600 rounded focus:ring-orange-500 cursor-pointer"
                          />
                        </td>
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Botón Guardar */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleGuardar}
                  disabled={loading}
                  className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Guardando...' : 'Guardar Permisos'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
