// ============================================================================
// IMPORTS
// ============================================================================

import React, { useState, useEffect, useMemo, memo } from 'react';
import SelectWithPlaceholder from './SelectWithPlaceholder';
import { useLanguage } from '../contexts/LanguageContext';
import { JoySenseService } from '../services/backend-api';

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

interface MassiveUmbralFormProps {
  getUniqueOptionsForField: (field: string, filters?: any) => any[];
  onApply: (data: any[]) => void;
  onCancel: () => void;
  loading?: boolean;
  paisSeleccionado?: string;
  empresaSeleccionada?: string;
  fundoSeleccionado?: string;
  getPaisName?: (paisId: string) => string;
  getEmpresaName?: (empresaId: string) => string;
  getFundoName?: (fundoId: string) => string;
  onFormDataChange?: (formData: any) => void;
  localizacionesData?: any[];
}

interface SelectedNode {
  nodoid: number;
  nodo: string;
  selected: boolean;
  datecreated?: string;
  ubicacionid?: number;
}

interface SelectedTipo {
  tipoid: number;
  tipo: string;
  selected: boolean;
}

interface MetricaData {
  metricaid: number;
  metrica: string;
  unidad: string;
  selected: boolean;
  expanded: boolean;
  umbralesPorTipo: {
    [tipoid: number]: Array<{
      minimo: string;
      maximo: string;
      criticidadid: number | null;
      umbral: string;
    }>;
  };
}

interface FormData {
  fundoid: number | null;
  entidadid: number | null;
  metricasData: MetricaData[];
}

interface UmbralDataToApply {
  ubicacionid: number;
  nodoid: number;
  tipoid: number;
  metricaid: number;
  criticidadid: number;
  umbral: string;
  minimo: number;
  maximo: number;
  statusid: number;
}

// ============================================================================
// COMPONENT DECLARATION
// ============================================================================

export const MassiveUmbralForm = memo(function MassiveUmbralForm({
  getUniqueOptionsForField,
  onApply,
  onCancel,
  loading = false,
  paisSeleccionado,
  empresaSeleccionada,
  fundoSeleccionado,
  getPaisName,
  getEmpresaName,
  getFundoName,
  onFormDataChange,
  localizacionesData
}: MassiveUmbralFormProps) {
  const { t } = useLanguage();

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [formData, setFormData] = useState<FormData>({
    fundoid: null,
    entidadid: null,
    metricasData: []
  });

  const [selectedNodes, setSelectedNodes] = useState<SelectedNode[]>([]);
  const [allNodesSelected, setAllNodesSelected] = useState(false);
  const [assignedSensorTypes, setAssignedSensorTypes] = useState<SelectedTipo[]>([]);
  const [nodeSensorTypes, setNodeSensorTypes] = useState<{[nodoid: number]: SelectedTipo[]}>({});
  const [hasShownInconsistencyWarning, setHasShownInconsistencyWarning] = useState(false);
  
  // Estados para replicación
  const [replicateMode, setReplicateMode] = useState(false);
  const [sourceNodeId, setSourceNodeId] = useState<number | null>(null);
  const [sourceUmbrales, setSourceUmbrales] = useState<any[]>([]);
  const [loadingSourceUmbrales, setLoadingSourceUmbrales] = useState(false);
  const [selectedUmbralesToReplicate, setSelectedUmbralesToReplicate] = useState<Map<string, number[]>>(new Map()); // key: "metricaid-tipoid", value: umbralid[]
  const [showReplicationModal, setShowReplicationModal] = useState(false);
  const [criticidadesData, setCriticidadesData] = useState<any[]>([]);
  const modalClosedManuallyRef = React.useRef(false);
  const previousSourceNodeIdRef = React.useRef<number | null>(null);

  // Obtener opciones para los dropdowns
  const fundosOptions = useMemo(() => 
    getUniqueOptionsForField('fundoid'), [getUniqueOptionsForField]
  );

  const entidadesOptions = useMemo(() => 
    getUniqueOptionsForField('entidadid'), [getUniqueOptionsForField]
  );

  // Métricas filtradas por nodos seleccionados (solo las que existen en metricasensor)
  const metricasOptions = useMemo(() => {
    const selectedNodesFiltered = selectedNodes.filter((node: SelectedNode) => node.selected);
    if (selectedNodesFiltered.length === 0) {
      return [];
    }
    
    // Obtener métricas que existen en metricasensor para los nodos seleccionados
    const nodoids = selectedNodesFiltered.map((node: SelectedNode) => node.nodoid);
    return getUniqueOptionsForField('metricaid', { nodoids: nodoids.join(',') });
  }, [getUniqueOptionsForField, selectedNodes]);

  const criticidadesOptions = useMemo(() => 
    getUniqueOptionsForField('criticidadid'), [getUniqueOptionsForField]
  );

  // Cargar nodos cuando se selecciona un fundo y entidad
  useEffect(() => {
    if (formData.fundoid && formData.entidadid) {
      // Obtener nodos que tienen sensor pero NO tienen metricasensor (para umbral)
      // Filtrar por fundo y entidad
      const nodosOptions = getUniqueOptionsForField('nodoid', { 
        fundoid: formData.fundoid.toString(),
        entidadid: formData.entidadid.toString()
      });
      const nodesData: SelectedNode[] = nodosOptions.map(option => ({
        nodoid: parseInt(option.value.toString()),
        nodo: option.label,
        selected: false,
        datecreated: option.datecreated || undefined,
        ubicacionid: option.ubicacionid || undefined
      }));
      setSelectedNodes(nodesData);
      setAllNodesSelected(false);
      setAssignedSensorTypes([]); // Limpiar tipos asignados
    } else {
      setSelectedNodes([]);
      setAllNodesSelected(false);
      setAssignedSensorTypes([]);
    }
  }, [formData.fundoid, formData.entidadid, getUniqueOptionsForField]);

  // Inicializar métricas cuando se cargan las opciones o cambian los nodos seleccionados
  // Solo inicializar si no hay métricas existentes o si hay nuevas métricas que no están en el estado
  useEffect(() => {
    if (metricasOptions.length > 0) {
      setFormData(prev => {
        // Si ya hay métricas en el estado, preservar los datos existentes
        if (prev.metricasData.length > 0) {
          // Crear un mapa de métricas existentes por metricaid para preservar los umbrales
          const existingMetricasMap = new Map(
            prev.metricasData.map(m => [m.metricaid, m])
          );
          
          // Crear nuevas métricas solo para las que no existen
          const newMetricasData: MetricaData[] = metricasOptions.map(option => {
            const metricaid = parseInt(option.value.toString());
            const existing = existingMetricasMap.get(metricaid);
            
            // Si existe, preservar todos sus datos (umbrales, selección, expansión)
            if (existing) {
              return existing;
            }
            
            // Si no existe, crear nueva métrica
            return {
              metricaid,
              metrica: option.label,
              unidad: option.unidad || '',
              selected: true, // ✅ Seleccionadas por defecto
              expanded: false,
              umbralesPorTipo: {}
            };
          });
          
          return { ...prev, metricasData: newMetricasData };
        } else {
          // Si no hay métricas existentes, inicializar todas
          const initialMetricasData: MetricaData[] = metricasOptions.map(option => ({
            metricaid: parseInt(option.value.toString()),
            metrica: option.label,
            unidad: option.unidad || '',
            selected: true, // ✅ Seleccionadas por defecto
            expanded: false,
            umbralesPorTipo: {}
          }));
          return { ...prev, metricasData: initialMetricasData };
        }
      });
    } else {
      // Solo limpiar si realmente no hay métricas disponibles Y no hay datos importantes
      setFormData(prev => {
        // Solo limpiar si no hay umbrales configurados
        const hasUmbrales = prev.metricasData.some(m => 
          Object.values(m.umbralesPorTipo).some(umbrales => 
            Array.isArray(umbrales) && umbrales.some(u => 
              u.minimo || u.maximo || u.criticidadid || u.umbral
            )
          )
        );
        
        // Si hay umbrales configurados, no limpiar (preservar el trabajo del usuario)
        if (hasUmbrales) {
          return prev;
        }
        
        return { ...prev, metricasData: [] };
      });
    }
  }, [metricasOptions]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  // Manejar selección de nodos
  const handleNodeSelection = (nodoid: number, selected: boolean) => {
    setSelectedNodes(prev =>
      prev.map(node =>
        node.nodoid === nodoid ? { ...node, selected } : node
      )
    );
  };

  // Manejar selección de todos los nodos
  const handleSelectAllNodes = (selected: boolean) => {
    setSelectedNodes(prev =>
      prev.map(node => ({ ...node, selected }))
    );
    setAllNodesSelected(selected);
  };

  // Actualizar estado de "seleccionar todo" cuando cambian las selecciones individuales
  useEffect(() => {
    if (selectedNodes.length > 0) {
      const allSelected = selectedNodes.every(node => node.selected);
      const someSelected = selectedNodes.some(node => node.selected);
      setAllNodesSelected(allSelected);
    } else {
      setAllNodesSelected(false);
    }
  }, [selectedNodes]);

  // Cargar tipos de sensores asignados cuando se seleccionan nodos y entidad
  useEffect(() => {
    const selectedNodesData = selectedNodes.filter(node => node.selected);
    if (selectedNodesData.length > 0 && formData.entidadid) {
      // Obtener tipos de sensores específicos para los nodos seleccionados
      const nodoIds = selectedNodesData.map(node => node.nodoid);
      
      // Obtener tipos de sensores filtrados por los nodos seleccionados y entidad
      const tiposOptions = getUniqueOptionsForField('tipoid', { 
        entidadid: formData.entidadid.toString(),
        nodoids: nodoIds // Filtrar por nodos específicos
      });
      
      const assignedTypes: SelectedTipo[] = tiposOptions.map(option => ({
        tipoid: parseInt(option.value.toString()),
        tipo: option.label,
        selected: true // Todos los tipos asignados están siempre seleccionados (solo lectura)
      }));

setAssignedSensorTypes(assignedTypes);
      
      // Cargar tipos de sensores por nodo individual para validación
      const nodeTypesMap: {[nodoid: number]: SelectedTipo[]} = {};
      for (const node of selectedNodesData) {
        const nodeTiposOptions = getUniqueOptionsForField('tipoid', {
          entidadid: formData.entidadid.toString(),
          nodoids: [node.nodoid]
        });
        
        nodeTypesMap[node.nodoid] = nodeTiposOptions.map(option => ({
          tipoid: parseInt(option.value.toString()),
          tipo: option.label,
          selected: true
        }));
      }
      
      setNodeSensorTypes(nodeTypesMap);
    } else {
      setAssignedSensorTypes([]);
      setNodeSensorTypes({});
      // Resetear el flag cuando no hay nodos seleccionados
      const selectedNodesData = selectedNodes.filter(node => node.selected);
      if (selectedNodesData.length === 0) {
        setHasShownInconsistencyWarning(false);
      }
    }
  }, [selectedNodes, formData.entidadid, getUniqueOptionsForField]);

  // Los tipos de sensores asignados son solo informativos (solo lectura)
  // No se pueden editar ya que se asignan en sense.sensor, no en sense.umbral

  // Función para verificar si todos los nodos seleccionados tienen los mismos tipos de sensores
  const validateNodeSensorTypes = () => {
    const selectedNodesData = selectedNodes.filter(node => node.selected);
    if (selectedNodesData.length <= 1) return { isValid: true, message: '', groupedNodes: {}, nodoAnalysis: [] };

    const nodeTypes = selectedNodesData.map(node => {
      const types = nodeSensorTypes[node.nodoid] || [];
      return {
        nodoid: node.nodoid,
        nodo: node.nodo,
        types: types.map(t => t.tipo).sort(),
        count: types.length,
        typesKey: types.map(t => t.tipo).sort().join('|') // Clave única para agrupar
      };
    });

    // Agrupar nodos por cantidad y tipos de sensores
    const groupedNodes: {[key: string]: {count: number, types: string[], nodos: any[]}} = {};
    
    nodeTypes.forEach(nt => {
      const key = `${nt.count}-${nt.typesKey}`;
      if (!groupedNodes[key]) {
        groupedNodes[key] = {
          count: nt.count,
          types: nt.types,
          nodos: []
        };
      }
      groupedNodes[key].nodos.push(nt);
    });

    // Si solo hay un grupo, todos los nodos son consistentes
    if (Object.keys(groupedNodes).length === 1) {
      return { isValid: true, message: '', groupedNodes: {}, nodoAnalysis: [] };
    }

    // Crear mensaje agrupado (mantener para compatibilidad)
    const message = Object.values(groupedNodes).map(group => {
      const nodosStr = group.nodos.map(n => n.nodo).join(', ');
      const tipoStr = group.count !== 1 ? 'tipos' : 'tipo';
      return `Nodo${group.nodos.length > 1 ? 's' : ''} ${nodosStr} posee${group.nodos.length > 1 ? 'n' : ''} ${group.count.toString().padStart(2, '0')} ${tipoStr} de sensor.`;
    }).join('\n');

    return { isValid: false, message, groupedNodes, nodoAnalysis: nodeTypes };
  };

  const validationResult = useMemo(() => validateNodeSensorTypes(), [selectedNodes, nodeSensorTypes]);
  
  // Actualizar el flag cuando se detectan inconsistencias
  useEffect(() => {
    const selectedNodesData = selectedNodes.filter(node => node.selected);
    if (selectedNodesData.length > 1 && !validationResult.isValid && validationResult.groupedNodes && Object.keys(validationResult.groupedNodes).length > 0) {
      setHasShownInconsistencyWarning(true);
    } else if (selectedNodesData.length <= 1 || validationResult.isValid) {
      // Solo resetear si todos los nodos son consistentes o hay 1 o menos nodos
      setHasShownInconsistencyWarning(false);
    }
    // No resetear el flag si hay múltiples nodos pero nodeSensorTypes está vacío temporalmente
  }, [selectedNodes, validationResult]);

  // Manejar toggle de métrica (expandir/contraer)
  const handleMetricaToggle = (metricaid: number) => {
    setFormData(prev => ({
      ...prev,
      metricasData: prev.metricasData.map(metrica =>
        metrica.metricaid === metricaid
          ? { ...metrica, expanded: !metrica.expanded }
          : metrica
      )
    }));
  };

  // Manejar selección de métrica
  const handleMetricaSelection = (metricaid: number, selected: boolean) => {
    setFormData(prev => ({
      ...prev,
      metricasData: prev.metricasData.map(metrica =>
        metrica.metricaid === metricaid
          ? { ...metrica, selected }
          : metrica
      )
    }));
  };

  // Manejar cambio de umbral por tipo (ahora con arrays)
  const handleUmbralChange = (metricaid: number, tipoid: number, umbralIndex: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      metricasData: prev.metricasData.map(metrica => {
        if (metrica.metricaid === metricaid) {
          const updatedUmbralesPorTipo = { ...metrica.umbralesPorTipo };
          // Crear una copia del array para evitar mutaciones del estado anterior
          const umbralesDelTipo = [...(updatedUmbralesPorTipo[tipoid] || [])];
          
          // Asegurar que el array tenga al menos un elemento en el índice especificado
          while (umbralesDelTipo.length <= umbralIndex) {
            umbralesDelTipo.push({
              minimo: '',
              maximo: '',
              criticidadid: null,
              umbral: ''
            });
          }
          
          // Actualizar el umbral específico creando un nuevo objeto
          umbralesDelTipo[umbralIndex] = {
            ...umbralesDelTipo[umbralIndex],
            [field]: field === 'criticidadid' ? (value ? parseInt(value) : null) : value
          };
          
          updatedUmbralesPorTipo[tipoid] = umbralesDelTipo;
          return { ...metrica, umbralesPorTipo: updatedUmbralesPorTipo };
        }
        return metrica;
      })
    }));
  };

  // Agregar un nuevo umbral para un tipo específico
  const handleAddUmbral = (metricaid: number, tipoid: number) => {
    setFormData(prev => ({
      ...prev,
      metricasData: prev.metricasData.map(metrica => {
        if (metrica.metricaid === metricaid) {
          const updatedUmbralesPorTipo = { ...metrica.umbralesPorTipo };
          const umbralesDelTipo = updatedUmbralesPorTipo[tipoid] || [];
          
          updatedUmbralesPorTipo[tipoid] = [
            ...umbralesDelTipo,
            {
              minimo: '',
              maximo: '',
              criticidadid: null,
              umbral: ''
            }
          ];
          
          return { ...metrica, umbralesPorTipo: updatedUmbralesPorTipo };
        }
        return metrica;
      })
    }));
  };

  // Eliminar un umbral específico
  const handleRemoveUmbral = (metricaid: number, tipoid: number, umbralIndex: number) => {
    setFormData(prev => ({
      ...prev,
      metricasData: prev.metricasData.map(metrica => {
        if (metrica.metricaid === metricaid) {
          const updatedUmbralesPorTipo = { ...metrica.umbralesPorTipo };
          const umbralesDelTipo = updatedUmbralesPorTipo[tipoid] || [];
          
          if (umbralesDelTipo.length > umbralIndex) {
            updatedUmbralesPorTipo[tipoid] = umbralesDelTipo.filter((_, index) => index !== umbralIndex);
          }
          
          return { ...metrica, umbralesPorTipo: updatedUmbralesPorTipo };
        }
        return metrica;
      })
    }));
  };

  // Reportar cambios al sistema de detección (solo cambios significativos)
  useEffect(() => {
    if (onFormDataChange) {
      const massiveFormData = {
        fundoid: formData.fundoid,
        entidadid: formData.entidadid,
        selectedMetricas: formData.metricasData.filter(m => m.selected),
        selectedNodes: selectedNodes.filter(node => node.selected),
        assignedSensorTypes: assignedSensorTypes,
        hasData: formData.fundoid !== null || 
                 formData.entidadid !== null || 
                 formData.metricasData.some(m => m.selected) || 
                 selectedNodes.some(node => node.selected) ||
                 formData.metricasData.some(m => 
                   m.selected && Object.values(m.umbralesPorTipo).some(umbrales => 
                     Array.isArray(umbrales) && umbrales.some(u => 
                       u.minimo && u.maximo && u.criticidadid && u.umbral
                     )
                   )
                 )
      };
      onFormDataChange(massiveFormData);
    }
  }, [formData.fundoid, formData.entidadid, formData.metricasData.map(m => m.selected).join(','), selectedNodes.map(n => n.selected).join(','), assignedSensorTypes.length, onFormDataChange]);

  // Obtener nodos seleccionados
  const getSelectedNodes = () => {
    return selectedNodes.filter(node => node.selected);
  };

  // Validar formulario
  const isFormValid = () => {
    const hasNodes = getSelectedNodes().length > 0;
    const hasAssignedTipos = assignedSensorTypes.length > 0;
    const hasMetricas = formData.metricasData.some(metrica => {
      if (!metrica.selected) return false;
      return Object.values(metrica.umbralesPorTipo).some(umbrales => {
        if (!Array.isArray(umbrales)) return false;
        return umbrales.some(umbral => 
          umbral.minimo && umbral.maximo && umbral.criticidadid && umbral.umbral
        );
      });
    });
    const hasValidNodeTypes = validationResult.isValid;
    
    return formData.fundoid && 
           formData.entidadid && 
           hasNodes && 
           hasAssignedTipos && 
           hasMetricas &&
           hasValidNodeTypes;
  };

  // Manejar aplicación de cambios
  const handleApply = () => {
    if (!isFormValid()) return;

    const selectedNodesData = getSelectedNodes();
    const dataToApply: UmbralDataToApply[] = [];

    // Crear datos para cada combinación de nodo-tipo-métrica
    // Solo procesar tipos que están realmente asignados a cada nodo específico
    for (const node of selectedNodesData) {
      
      // Obtener tipos específicos para este nodo
      if (formData.entidadid) {
        const tiposDelNodo = getUniqueOptionsForField('tipoid', { 
          entidadid: formData.entidadid.toString(),
          nodoids: [node.nodoid] // Solo este nodo específico
        });

for (const tipoOption of tiposDelNodo) {
          const tipo = {
            tipoid: parseInt(tipoOption.value.toString()),
            tipo: tipoOption.label,
            selected: true
          };
          
          for (const metrica of formData.metricasData) {
            // Solo procesar métricas seleccionadas
            if (metrica.selected) {
              // Verificar si esta combinación nodo-tipo-métrica existe en metricasensor
              const existeEnMetricasensor = getUniqueOptionsForField('metricaid', { 
                nodoids: [node.nodoid].join(',') 
              }).some(m => m.value === metrica.metricaid);
              
              if (!existeEnMetricasensor) {
                continue;
              }
              
              const umbralesDelTipo = metrica.umbralesPorTipo[tipo.tipoid];
              const umbralesArray = Array.isArray(umbralesDelTipo) ? umbralesDelTipo : (umbralesDelTipo ? [umbralesDelTipo] : []);
              
              // Procesar cada umbral válido
              umbralesArray.forEach(umbralTipo => {
                // Solo incluir si el umbral tiene todos los campos requeridos
                if (umbralTipo && umbralTipo.minimo && umbralTipo.maximo && umbralTipo.criticidadid && umbralTipo.umbral) {
                  // Obtener ubicacionid desde la tabla localizacion
                  const localizacion = localizacionesData?.find(loc => loc.nodoid === node.nodoid);
                  if (!localizacion || !localizacion.ubicacionid) {
                    console.error('❌ Nodo sin localización o ubicacionid:', { 
                      nodo: node.nodo, 
                      nodoid: node.nodoid, 
                      localizacion: localizacion 
                    });
                    return; // Saltar este umbral si no tiene localización
                  }
                  
                  const umbralData = {
                    ubicacionid: localizacion.ubicacionid,
                    nodoid: node.nodoid,
                    tipoid: tipo.tipoid,
                    metricaid: metrica.metricaid,
                    criticidadid: umbralTipo.criticidadid,
                    umbral: umbralTipo.umbral,
                    minimo: parseFloat(umbralTipo.minimo),
                    maximo: parseFloat(umbralTipo.maximo),
                    statusid: 1 // Activo por defecto
                  };
                  
                  dataToApply.push(umbralData);
                }
              });
            }
          }
        }
      }
    }

    onApply(dataToApply);
  };

  // Cargar criticidades
  useEffect(() => {
    const loadCriticidades = async () => {
      try {
        const criticidades = await JoySenseService.getTableData('criticidad', 1000);
        setCriticidadesData(criticidades || []);
      } catch (error) {
        console.error('Error cargando criticidades:', error);
        setCriticidadesData([]);
      }
    };
    loadCriticidades();
  }, []);

  // Mapa de criticidad ID a nombre
  const criticidadMap = useMemo(() => {
    const map = new Map<number, string>();
    criticidadesData.forEach((c: any) => {
      if (c.criticidadid && c.criticidad) {
        map.set(c.criticidadid, c.criticidad);
      }
    });
    return map;
  }, [criticidadesData]);

  // Mapa de criticidad ID a grado (para ordenamiento)
  const criticidadGradoMap = useMemo(() => {
    const map = new Map<number, number>();
    criticidadesData.forEach((c: any) => {
      if (c.criticidadid && c.grado !== undefined) {
        map.set(c.criticidadid, c.grado || 999); // Si no tiene grado, usar 999 para ponerlo al final
      }
    });
    return map;
  }, [criticidadesData]);

  // Organizar umbrales por métrica y tipo para mostrar en la UI
  const umbralesOrganizados = useMemo(() => {
    if (!sourceUmbrales.length) return {};

    const metricasOptions = getUniqueOptionsForField('metricaid');
    const tiposOptions = formData.entidadid 
      ? getUniqueOptionsForField('tipoid', { entidadid: formData.entidadid.toString() })
      : [];

    const organizados: { [metricaid: number]: { metrica: string; tipos: { [tipoid: number]: { tipo: string; umbrales: any[] } } } } = {};

    sourceUmbrales.forEach((umbral: any) => {
      const metricaOption = metricasOptions.find((m: any) => parseInt(m.value.toString()) === umbral.metricaid);
      const tipoOption = tiposOptions.find((t: any) => parseInt(t.value.toString()) === umbral.tipoid);

      if (!metricaOption || !tipoOption) return;

      const metricaid = umbral.metricaid;
      const tipoid = umbral.tipoid;

      if (!organizados[metricaid]) {
        organizados[metricaid] = {
          metrica: metricaOption.label || `Métrica ${metricaid}`,
          tipos: {}
        };
      }

      if (!organizados[metricaid].tipos[tipoid]) {
        organizados[metricaid].tipos[tipoid] = {
          tipo: tipoOption.label || `Tipo ${tipoid}`,
          umbrales: []
        };
      }

      organizados[metricaid].tipos[tipoid].umbrales.push(umbral);
    });

    // Ordenar umbrales por grado de criticidad (ascendente: grado 1 primero, grado 4 último)
    Object.keys(organizados).forEach(metricaid => {
      Object.keys(organizados[parseInt(metricaid)].tipos).forEach(tipoid => {
        organizados[parseInt(metricaid)].tipos[parseInt(tipoid)].umbrales.sort((a: any, b: any) => {
          const gradoA = criticidadGradoMap.get(a.criticidadid) || 999;
          const gradoB = criticidadGradoMap.get(b.criticidadid) || 999;
          return gradoA - gradoB; // Orden ascendente: 1, 2, 3, 4
        });
      });
    });

    return organizados;
  }, [sourceUmbrales, formData.entidadid, getUniqueOptionsForField, criticidadGradoMap]);

  // Función para manejar la selección de umbrales (múltiples por métrica-tipo)
  const handleUmbralToggle = (metricaid: number, tipoid: number, umbralid: number) => {
    setSelectedUmbralesToReplicate(prev => {
      const newMap = new Map(prev);
      const key = `${metricaid}-${tipoid}`;
      const currentSelection = newMap.get(key) || [];
      
      if (currentSelection.includes(umbralid)) {
        // Deseleccionar: remover de la lista
        const updated = currentSelection.filter(id => id !== umbralid);
        if (updated.length === 0) {
          newMap.delete(key);
        } else {
          newMap.set(key, updated);
        }
      } else {
        // Seleccionar: agregar a la lista
        newMap.set(key, [...currentSelection, umbralid]);
      }
      
      return newMap;
    });
  };

  // Función para seleccionar todos los umbrales
  const handleSelectAllUmbrales = () => {
    const allSelected = new Map<string, number[]>();
    
    Object.entries(umbralesOrganizados).forEach(([metricaid, data]) => {
      Object.entries(data.tipos).forEach(([tipoid, tipoData]) => {
        const key = `${metricaid}-${tipoid}`;
        const umbralids = tipoData.umbrales.map((u: any) => u.umbralid);
        allSelected.set(key, umbralids);
      });
    });
    
    setSelectedUmbralesToReplicate(allSelected);
  };

  // Función para aplicar los umbrales seleccionados al formulario
  const handleApplySelectedUmbrales = () => {
    const totalSelected = Array.from(selectedUmbralesToReplicate.values()).flat().length;
    if (totalSelected === 0) return;

    // Obtener todos los umbralids seleccionados
    const allUmbralids = Array.from(selectedUmbralesToReplicate.values()).flat();
    const umbralesSeleccionados = sourceUmbrales.filter((u: any) => 
      allUmbralids.includes(u.umbralid)
    );

    // Agrupar umbrales por métrica y tipo (ahora como arrays)
    const umbralesPorMetrica: { [metricaid: number]: { [tipoid: number]: any[] } } = {};
    
    umbralesSeleccionados.forEach((umbral: any) => {
      if (!umbralesPorMetrica[umbral.metricaid]) {
        umbralesPorMetrica[umbral.metricaid] = {};
      }
      if (!umbralesPorMetrica[umbral.metricaid][umbral.tipoid]) {
        umbralesPorMetrica[umbral.metricaid][umbral.tipoid] = [];
      }
      umbralesPorMetrica[umbral.metricaid][umbral.tipoid].push({
        minimo: umbral.minimo?.toString() || '',
        maximo: umbral.maximo?.toString() || '',
        criticidadid: umbral.criticidadid || null,
        umbral: umbral.umbral || ''
      });
    });

    // Actualizar el formulario con los umbrales seleccionados
    setFormData(prev => ({
      ...prev,
      metricasData: prev.metricasData.map(metrica => {
        const umbralesReplicados = umbralesPorMetrica[metrica.metricaid] || {};
        const updatedUmbralesPorTipo = { ...metrica.umbralesPorTipo };
        
        // Aplicar umbrales replicados solo para tipos que existen en assignedSensorTypes
        assignedSensorTypes.forEach(tipo => {
          if (umbralesReplicados[tipo.tipoid]) {
            // Si ya hay umbrales, agregar a la lista. Si no, crear nueva lista.
            const existingUmbrales = updatedUmbralesPorTipo[tipo.tipoid] || [];
            const newUmbrales = umbralesReplicados[tipo.tipoid];
            
            // Combinar y ordenar por grado de criticidad
            const combinedUmbrales = [...existingUmbrales, ...newUmbrales];
            combinedUmbrales.sort((a, b) => {
              const gradoA = criticidadGradoMap.get(a.criticidadid || 0) || 999;
              const gradoB = criticidadGradoMap.get(b.criticidadid || 0) || 999;
              return gradoA - gradoB; // Orden ascendente: 1, 2, 3, 4
            });
            
            updatedUmbralesPorTipo[tipo.tipoid] = combinedUmbrales;
          }
        });

        return {
          ...metrica,
          selected: Object.keys(umbralesReplicados).length > 0 ? true : metrica.selected,
          umbralesPorTipo: updatedUmbralesPorTipo
        };
      })
    }));

    // Limpiar selección y cerrar modal
    setSelectedUmbralesToReplicate(new Map());
    setShowReplicationModal(false);
    modalClosedManuallyRef.current = true;
  };

  // Cargar umbrales cuando se selecciona un nodo fuente (sin aplicar automáticamente)
  useEffect(() => {
    const loadUmbralesFromSource = async () => {
      if (!sourceNodeId) {
        setSourceUmbrales([]);
        previousSourceNodeIdRef.current = null;
        modalClosedManuallyRef.current = false;
        return;
      }

      // Solo abrir modal si el sourceNodeId cambió (nuevo nodo seleccionado)
      const isNewNodeSelection = previousSourceNodeIdRef.current !== sourceNodeId;
      
      // Si es una nueva selección de nodo, resetear el flag de cierre manual
      if (isNewNodeSelection) {
        modalClosedManuallyRef.current = false;
      }
      
      previousSourceNodeIdRef.current = sourceNodeId;

      try {
        setLoadingSourceUmbrales(true);
        // Obtener umbrales del nodo fuente usando getTableData con filtro
        const allUmbrales = await JoySenseService.getTableData('umbral', 1000);
        const umbralesDelNodo = allUmbrales.filter((u: any) => 
          u.nodoid === sourceNodeId && u.statusid === 1 // Solo umbrales activos
        );
        setSourceUmbrales(umbralesDelNodo);

        // Filtrar umbrales compatibles con el nodo destino (solo cargar, no aplicar)
        if (umbralesDelNodo.length > 0) {
          // Obtener tipos y métricas de los nodos destino seleccionados
          const selectedNodesData = selectedNodes.filter(node => node.selected);
          if (selectedNodesData.length > 0) {
            const [allSensors, allMetricaSensors] = await Promise.all([
              JoySenseService.getTableData('sensor', 1000),
              JoySenseService.getTableData('metricasensor', 1000)
            ]);

            const targetNodeIds = selectedNodesData.map(n => n.nodoid);
            const targetSensors = allSensors.filter((s: any) => targetNodeIds.includes(s.nodoid));
            const targetMetricaSensors = allMetricaSensors.filter((ms: any) => targetNodeIds.includes(ms.nodoid));

            // Obtener tipos y métricas del nodo destino
            const targetTipos = new Set(targetSensors.map((s: any) => s.tipoid));
            const targetMetricas = new Set(targetMetricaSensors.map((ms: any) => ms.metricaid));

            // Filtrar umbrales: solo los que coincidan con tipos Y métricas del nodo destino
            const umbralesCompatibles = umbralesDelNodo.filter((umbral: any) => 
              targetTipos.has(umbral.tipoid) && targetMetricas.has(umbral.metricaid)
            );

            // Actualizar sourceUmbrales para mostrar solo los compatibles
            setSourceUmbrales(umbralesCompatibles);
            // Limpiar selección previa
            setSelectedUmbralesToReplicate(new Map());
            // Solo abrir modal si es una nueva selección de nodo y hay umbrales disponibles
            if (umbralesCompatibles.length > 0 && isNewNodeSelection && !modalClosedManuallyRef.current) {
              setShowReplicationModal(true);
              modalClosedManuallyRef.current = false; // Resetear el flag
            }
          } else {
            setSourceUmbrales(umbralesDelNodo);
            setSelectedUmbralesToReplicate(new Map());
            // Solo abrir modal si es una nueva selección de nodo y hay umbrales disponibles
            if (umbralesDelNodo.length > 0 && isNewNodeSelection && !modalClosedManuallyRef.current) {
              setShowReplicationModal(true);
              modalClosedManuallyRef.current = false; // Resetear el flag
            }
          }
        } else {
          setSourceUmbrales([]);
          setSelectedUmbralesToReplicate(new Map());
        }
      } catch (error) {
        console.error('Error cargando umbrales del nodo fuente:', error);
        setSourceUmbrales([]);
      } finally {
        setLoadingSourceUmbrales(false);
      }
    };

    loadUmbralesFromSource();
  }, [sourceNodeId, selectedNodes, assignedSensorTypes]);

  // Resetear el flag cuando se cierra el modal manualmente
  const handleCloseModal = () => {
    setShowReplicationModal(false);
    setSelectedUmbralesToReplicate(new Map());
    modalClosedManuallyRef.current = true;
  };

  // Estado para almacenar nodos fuente compatibles
  const [compatibleSourceNodes, setCompatibleSourceNodes] = useState<any[]>([]);
  const [loadingCompatibleNodes, setLoadingCompatibleNodes] = useState(false);

  // Cargar nodos fuente compatibles basados en los nodos destino seleccionados
  useEffect(() => {
    const loadCompatibleSourceNodes = async () => {
      const selectedNodesData = selectedNodes.filter(node => node.selected);
      
      if (selectedNodesData.length === 0 || !formData.fundoid || !formData.entidadid) {
        setCompatibleSourceNodes([]);
        return;
      }

      try {
        setLoadingCompatibleNodes(true);
        
        // Obtener sensores y metricasensores de los nodos destino seleccionados
        const [allSensors, allMetricaSensors, allUmbrales] = await Promise.all([
          JoySenseService.getTableData('sensor', 1000),
          JoySenseService.getTableData('metricasensor', 1000),
          JoySenseService.getTableData('umbral', 1000)
        ]);

        // Obtener tipos de sensores y métricas de los nodos destino
        const targetNodeIds = selectedNodesData.map(n => n.nodoid);
        
        // Crear perfiles de configuración para cada nodo destino
        // Un perfil es la combinación de tipos y métricas de un nodo
        const targetNodeProfiles = targetNodeIds.map(nodoid => {
          const nodeSensors = allSensors.filter((s: any) => s.nodoid === nodoid);
          const nodeMetricaSensors = allMetricaSensors.filter((ms: any) => ms.nodoid === nodoid);
          
          const tipos = Array.from(new Set(nodeSensors.map((s: any) => s.tipoid))).sort((a, b) => a - b);
          const metricas = Array.from(new Set(nodeMetricaSensors.map((ms: any) => ms.metricaid))).sort((a, b) => a - b);
          
          return {
            nodoid,
            tipos,
            metricas,
            tiposKey: JSON.stringify(tipos),
            metricasKey: JSON.stringify(metricas)
          };
        });

        // Obtener TODOS los nodos del fundo y entidad (no filtrar por umbrales)
        // Necesitamos obtener nodos directamente, no usar getUniqueOptionsForField que filtra nodos sin umbrales
        // Primero obtener todos los nodos disponibles
        const allNodosData = await JoySenseService.getTableData('nodo', 1000);
        
        // Obtener localizaciones para filtrar por fundo
        const allLocalizaciones = await JoySenseService.getTableData('localizacion', 1000);
        const allUbicaciones = await JoySenseService.getTableData('ubicacion', 1000);
        
        // Filtrar ubicaciones por fundo
        const ubicacionesDelFundo = allUbicaciones.filter((u: any) => u.fundoid === formData.fundoid);
        const ubicacionIds = new Set(ubicacionesDelFundo.map((u: any) => u.ubicacionid));
        
        // Obtener nodos que están en localizaciones del fundo
        const localizacionesDelFundo = allLocalizaciones.filter((l: any) => 
          ubicacionIds.has(l.ubicacionid)
        );
        const nodoIdsDelFundo = new Set(localizacionesDelFundo.map((l: any) => l.nodoid));
        
        // Filtrar nodos por fundo y entidad
        // Para entidad, necesitamos verificar a través de sensores
        const nodosDelFundo = allNodosData.filter((n: any) => nodoIdsDelFundo.has(n.nodoid));
        
        // Filtrar por entidad: obtener sensores de la entidad y luego sus nodos
        const sensoresDeEntidad = allSensors.filter((s: any) => {
          // Necesitamos obtener el tipoid del sensor y verificar su entidadid
          // Por ahora, asumimos que si el nodo tiene sensores, podemos verificar
          return true; // Temporal, necesitamos verificar entidad
        });
        
        // Obtener tipos de la entidad
        const allTipos = await JoySenseService.getTableData('tipo', 1000);
        const tiposDeEntidad = allTipos.filter((t: any) => t.entidadid === formData.entidadid);
        const tipoIdsDeEntidad = new Set(tiposDeEntidad.map((t: any) => t.tipoid));
        
        // Filtrar sensores por tipos de la entidad
        const sensoresConTiposDeEntidad = allSensors.filter((s: any) => 
          tipoIdsDeEntidad.has(s.tipoid)
        );
        const nodoIdsConEntidad = new Set(sensoresConTiposDeEntidad.map((s: any) => s.nodoid));
        
        // Filtrar nodos que están en el fundo Y tienen sensores de la entidad
        const allNodes = nodosDelFundo
          .filter((n: any) => nodoIdsConEntidad.has(n.nodoid))
          .map((n: any) => ({
            value: n.nodoid,
            label: n.nodo || `Nodo ${n.nodoid}`
          }));

        // Obtener nodos que tienen umbrales activos
        const umbralesActivos = allUmbrales.filter((u: any) => u.statusid === 1);
        const nodoidsConUmbrales = new Set(umbralesActivos.map((u: any) => u.nodoid));

        // Filtrar nodos fuente que:
        // 1. No estén en los nodos destino seleccionados
        // 2. Tengan los mismos tipos de sensores (sense.sensor) que AL MENOS UN nodo destino
        // 3. Tengan las mismas métricas (sense.metricasensor) que AL MENOS UN nodo destino
        // 4. Tengan umbrales configurados
        const compatibleNodes = allNodes
          .filter(option => {
            const nodoid = parseInt(option.value.toString());
            
            // Excluir nodos destino seleccionados
            if (targetNodeIds.includes(nodoid)) return false;
            
            // Debe tener umbrales
            if (!nodoidsConUmbrales.has(nodoid)) return false;

            // Obtener configuración del nodo fuente
            const nodeSensors = allSensors.filter((s: any) => s.nodoid === nodoid);
            const nodeMetricaSensors = allMetricaSensors.filter((ms: any) => ms.nodoid === nodoid);
            
            const nodeTipos = Array.from(new Set(nodeSensors.map((s: any) => s.tipoid))).sort((a, b) => a - b);
            const nodeMetricas = Array.from(new Set(nodeMetricaSensors.map((ms: any) => ms.metricaid))).sort((a, b) => a - b);
            
            const nodeTiposKey = JSON.stringify(nodeTipos);
            const nodeMetricasKey = JSON.stringify(nodeMetricas);

            // Verificar si este nodo fuente es compatible con AL MENOS UN nodo destino
            // Es compatible si tiene TODOS los tipos O TODAS las métricas del nodo destino
            // (puede tener más, pero debe tener todos los del destino en al menos una categoría)
            const isCompatible = targetNodeProfiles.some(profile => {
              // Verificar que el nodo fuente tenga todos los tipos del destino
              const hasAllTipos = profile.tipos.every(tipo => nodeTipos.includes(tipo));
              
              // Verificar que el nodo fuente tenga todas las métricas del destino
              const hasAllMetricas = profile.metricas.every(metrica => nodeMetricas.includes(metrica));
              
              // Compatible si tiene todos los tipos O todas las métricas
              return hasAllTipos || hasAllMetricas;
            });


            return isCompatible;
          })
          .map(option => ({
            value: parseInt(option.value.toString()),
            label: option.label
          }));

        // Log detallado de nodos evaluados
        const nodesEvaluated = allNodes.map(option => {
          const nodoid = parseInt(option.value.toString());
          const nodeSensors = allSensors.filter((s: any) => s.nodoid === nodoid);
          const nodeMetricaSensors = allMetricaSensors.filter((ms: any) => ms.nodoid === nodoid);
          const nodeTipos = Array.from(new Set(nodeSensors.map((s: any) => s.tipoid))).sort((a, b) => a - b);
          const nodeMetricas = Array.from(new Set(nodeMetricaSensors.map((ms: any) => ms.metricaid))).sort((a, b) => a - b);
          const hasUmbrales = nodoidsConUmbrales.has(nodoid);
          const isTarget = targetNodeIds.includes(nodoid);
          
          return {
            nodoid,
            label: option.label,
            hasUmbrales,
            isTarget,
            tipos: nodeTipos,
            metricas: nodeMetricas
          };
        });

        // Log resumido
        console.log('🔍 Debug - Nodos fuente compatibles:', {
          targetNodeIds,
          targetNodeProfile: targetNodeProfiles[0] ? {
            nodoid: targetNodeProfiles[0].nodoid,
            tipos: targetNodeProfiles[0].tipos,
            metricas: targetNodeProfiles[0].metricas
          } : null,
          totalNodes: allNodes.length,
          nodesWithUmbrales: nodoidsConUmbrales.size,
          compatibleNodes: compatibleNodes.length,
          compatibleNodeIds: compatibleNodes.map(n => n.value)
        });

        setCompatibleSourceNodes(compatibleNodes);
      } catch (error) {
        console.error('Error cargando nodos fuente compatibles:', error);
        setCompatibleSourceNodes([]);
      } finally {
        setLoadingCompatibleNodes(false);
      }
    };

    loadCompatibleSourceNodes();
  }, [selectedNodes, formData.fundoid, formData.entidadid, getUniqueOptionsForField]);

  // Obtener nodos fuente compatibles
  const sourceNodesOptions = useMemo(() => {
    return compatibleSourceNodes;
  }, [compatibleSourceNodes]);

  // Obtener todas las métricas y tipos para mostrar nombres
  const allMetricasOptions = useMemo(() => 
    getUniqueOptionsForField('metricaid'), [getUniqueOptionsForField]
  );
  
  const allTiposOptions = useMemo(() => {
    if (!formData.entidadid) return [];
    return getUniqueOptionsForField('tipoid', { entidadid: formData.entidadid.toString() });
  }, [formData.entidadid, getUniqueOptionsForField]);


  // Limpiar formulario
  const handleCancel = () => {
    setFormData({
      fundoid: null,
      entidadid: null,
      metricasData: []
    });
    setSelectedNodes([]);
    setAllNodesSelected(false);
    setAssignedSensorTypes([]);
    setReplicateMode(false);
    setSourceNodeId(null);
    setSourceUmbrales([]);
    onCancel();
  };

  const selectedNodesCount = getSelectedNodes().length;
  const assignedTiposCount = assignedSensorTypes.length; // Todos los tipos asignados se procesan
  const validMetricasCount = formData.metricasData.filter(m => 
    m.selected && Object.values(m.umbralesPorTipo).some(umbrales => {
      if (!Array.isArray(umbrales)) return false;
      return umbrales.some(u => u.minimo && u.maximo && u.criticidadid && u.umbral);
    })
  ).length;
  const totalCombinations = selectedNodesCount * assignedTiposCount * validMetricasCount;

  // Validación mejorada para mostrar qué falta
  const validationErrors = [];
  if (!formData.fundoid) validationErrors.push('Fundo');
  if (!formData.entidadid) validationErrors.push('Entidad');
  if (selectedNodesCount === 0) validationErrors.push('Nodos');
  if (assignedTiposCount === 0) validationErrors.push('Tipos de sensores');
  if (validMetricasCount === 0) validationErrors.push('Métricas con umbrales completos');

  // Auto-seleccionar fundo si solo hay una opción
  useEffect(() => {
    if (fundosOptions.length === 1 && !formData.fundoid) {
      setFormData(prev => ({
        ...prev,
        fundoid: fundosOptions[0].value ? parseInt(fundosOptions[0].value.toString()) : null,
        entidadid: null
      }));
    }
  }, [fundosOptions, formData.fundoid]);

  // Auto-seleccionar entidad si solo hay una opción
  useEffect(() => {
    if (entidadesOptions.length === 1 && !formData.entidadid) {
      setFormData(prev => ({
        ...prev,
        entidadid: entidadesOptions[0].value ? parseInt(entidadesOptions[0].value.toString()) : null
      }));
    }
  }, [entidadesOptions, formData.entidadid]);

  // Función para renderizar fila contextual con filtros globales
  const renderContextualRow = (fields: string[]) => {
    const contextualFields = fields.map(field => {
      if (field === 'pais' && paisSeleccionado && getPaisName) {
        return (
          <div key="pais-contextual">
            <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
              PAÍS
            </label>
            <div className="w-full px-3 py-2 bg-gray-200 dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded-lg text-gray-600 dark:text-white font-mono cursor-not-allowed opacity-75">
              {getPaisName(paisSeleccionado)}
            </div>
          </div>
        );
      } else if (field === 'empresa' && empresaSeleccionada && getEmpresaName) {
        return (
          <div key="empresa-contextual">
            <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
              EMPRESA
            </label>
            <div className="w-full px-3 py-2 bg-gray-200 dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded-lg text-gray-600 dark:text-white font-mono cursor-not-allowed opacity-75">
              {getEmpresaName(empresaSeleccionada)}
            </div>
          </div>
        );
      } else if (field === 'fundo') {
        return (
          <div key="fundo-contextual">
            <label className="block text-lg font-bold text-orange-500 font-mono tracking-wider mb-2">
              {t('table_headers.fund')}
            </label>
            {fundosOptions.length === 1 ? (
              <div className="w-full px-3 py-2 bg-gray-200 dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded-lg text-gray-600 dark:text-white font-mono cursor-not-allowed opacity-75">
                {fundosOptions[0].label}
              </div>
            ) : (
              <SelectWithPlaceholder
                options={fundosOptions}
                value={formData.fundoid}
                onChange={(value) => {
                  setFormData(prev => ({
                    ...prev,
                    fundoid: value ? parseInt(value.toString()) : null,
                    entidadid: null
                  }));
                }}
                placeholder={t('umbral.select_fund')}
                disabled={loading}
              />
            )}
          </div>
        );
      } else if (field === 'entidad') {
        return (
          <div key="entidad-contextual">
            <label className="block text-lg font-bold text-orange-500 font-mono tracking-wider mb-2">
              {t('table_headers.entity')}
            </label>
            {entidadesOptions.length === 1 ? (
              <div className="w-full px-3 py-2 bg-gray-200 dark:bg-neutral-700 border border-gray-300 dark:border-neutral-600 rounded-lg text-gray-600 dark:text-white font-mono cursor-not-allowed opacity-75">
                {entidadesOptions[0].label}
              </div>
            ) : (
              <SelectWithPlaceholder
                options={entidadesOptions}
                value={formData.entidadid}
                onChange={(value) => {
                  setFormData(prev => ({
                    ...prev,
                    entidadid: value ? parseInt(value.toString()) : null
                  }));
                }}
                placeholder={t('umbral.select_entity')}
                disabled={loading}
              />
            )}
          </div>
        );
      }
      return null;
    }).filter(Boolean);

    if (contextualFields.length === 0) return null;

    // Separar campos en dos filas
    const firstRowFields = contextualFields.filter(field => 
      field && (field.key === 'pais-contextual' || field.key === 'empresa-contextual')
    );
    const secondRowFields = contextualFields.filter(field => 
      field && (field.key === 'fundo-contextual' || field.key === 'entidad-contextual')
    );

    return (
      <div className="space-y-6 mb-6">
        {/* Primera fila: País y Empresa */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {firstRowFields}
        </div>
        {/* Segunda fila: Fundo y Entidad */}
        {secondRowFields.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {secondRowFields}
          </div>
        )}
      </div>
    );
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Fila 1: País y Empresa (contextual) */}
      {renderContextualRow(['pais', 'empresa'])}

      {/* Fila 2: Fundo y Entidad (contextual) */}
      {renderContextualRow(['fundo', 'entidad'])}

      {/* Fila 3: Nodos y Tipos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Nodos */}
        <div>
          <h4 className="text-lg font-bold text-orange-500 font-mono tracking-wider mb-4">
            NODO
          </h4>
          
          {/* Mensaje de validación de similitud de nodos (compacto e interactivo) */}
          {/* Mostrar el container si hay nodos seleccionados con configuraciones diferentes */}
          {(() => {
            const selectedNodesData = selectedNodes.filter(node => node.selected);
            const hasMultipleNodes = selectedNodesData.length > 1;
            const hasValidationData = validationResult.groupedNodes && Object.keys(validationResult.groupedNodes).length > 0;
            // Mostrar si: hay múltiples nodos Y (la validación indica inconsistencias O ya se mostró el warning antes)
            const shouldShow = hasMultipleNodes && (hasValidationData || hasShownInconsistencyWarning);
            return shouldShow;
          })() && (
            <div className="mb-4 p-3 bg-yellow-900 bg-opacity-20 border border-yellow-500 rounded-lg">
              <div className="flex items-start">
                <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                  <span className="text-black text-xs font-bold">⚠</span>
                </div>
                <div className="flex-1">
                  <h5 className="text-yellow-400 font-bold text-sm font-mono tracking-wider mb-2">
                    TIPOS DE SENSORES INCONSISTENTES
                  </h5>
                  
                  {/* Mostrar mensaje de carga si aún no hay datos de validación */}
                  {(!validationResult.groupedNodes || Object.keys(validationResult.groupedNodes).length === 0) ? (
                    <div className="text-yellow-300 font-mono text-xs">
                      Cargando información de tipos de sensores...
                    </div>
                  ) : (
                    /* Resumen compacto de grupos con selección interactiva */
                    <div className="space-y-2">
                      {Object.values(validationResult.groupedNodes).map((group, groupIndex) => (
                      <div 
                        key={groupIndex} 
                        className="bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded p-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
                        onClick={() => {
                          // Seleccionar solo los nodos de este grupo
                          const nodosDelGrupo = group.nodos.map(nodo => nodo.nodoid);
                          setSelectedNodes(prev => prev.map(node => ({
                            ...node,
                            selected: nodosDelGrupo.includes(node.nodoid)
                          })));
                          
                          // Configurar automáticamente todas las métricas disponibles para este grupo
                          setTimeout(() => {
                            // Obtener métricas que existen en metricasensor para los nodos del grupo
                            const metricasDelGrupo = getUniqueOptionsForField('metricaid', { 
                              nodoids: nodosDelGrupo.join(',') 
                            });
                            
                            if (metricasDelGrupo.length > 0) {
                              // Configurar métricas con valores por defecto
                              const metricasConfiguradas = metricasDelGrupo.map(metrica => ({
                                metricaid: parseInt(metrica.value.toString()),
                                metrica: metrica.label,
                                unidad: metrica.unidad || '',
                                selected: true, // ✅ Seleccionar automáticamente
                                expanded: false, // ✅ NO expandir (solo seleccionar)
                                umbralesPorTipo: {}
                              }));
                              
                              setFormData(prev => ({
                                ...prev,
                                metricasData: metricasConfiguradas
                              }));
                              
                            }
                          }, 100); // Pequeño delay para que se actualicen los nodos primero
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-orange-500 font-mono text-xs font-bold">
                            GRUPO {groupIndex + 1} - {group.count} TIPO(S)
                          </span>
                          <span className="text-green-400 font-mono text-xs">
                            CLICK PARA SELECCIONAR
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-1">
                          {group.nodos.slice(0, 3).map(nodo => (
                            <span key={nodo.nodoid} className="text-gray-900 dark:text-white font-mono text-xs bg-gray-200 dark:bg-neutral-700 px-2 py-1 rounded">
                              {nodo.nodo}
                            </span>
                          ))}
                          {group.nodos.length > 3 && (
                            <span className="text-gray-500 dark:text-neutral-400 font-mono text-xs px-2 py-1">
                              +{group.nodos.length - 3} más
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {group.types.slice(0, 2).map((tipo, tipoIndex) => (
                            <span key={tipoIndex} className="text-orange-600 dark:text-orange-300 font-mono text-xs bg-orange-100 dark:bg-orange-900 bg-opacity-50 dark:bg-opacity-30 px-2 py-1 rounded">
                              {tipo}
                            </span>
                          ))}
                          {group.types.length > 2 && (
                            <span className="text-orange-600 dark:text-orange-300 font-mono text-xs px-2 py-1">
                              +{group.types.length - 2} más
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg p-4 h-44 overflow-y-auto custom-scrollbar">
            {formData.entidadid ? (
              <div className="space-y-2">
                {/* Checkbox para seleccionar todos */}
                {selectedNodes.length > 0 && (
                  <label className="flex items-center px-3 py-2 bg-gray-100 dark:bg-neutral-800 rounded cursor-pointer hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={allNodesSelected}
                      onChange={(e) => handleSelectAllNodes(e.target.checked)}
                      className="w-4 h-4 text-orange-500 bg-gray-100 dark:bg-neutral-800 border-gray-300 dark:border-neutral-600 rounded focus:ring-orange-500 focus:ring-2 mr-3"
                    />
                    <span className="text-orange-400 text-sm font-mono tracking-wider font-bold">
                      SELECCIONAR TODOS
                    </span>
                  </label>
                )}
                
                {selectedNodes.map((node) => (
                  <label key={node.nodoid} className="flex items-center px-3 py-2 hover:bg-gray-100 dark:hover:bg-neutral-700 cursor-pointer transition-colors rounded">
                    <input
                      type="checkbox"
                      checked={node.selected}
                      onChange={(e) => handleNodeSelection(node.nodoid, e.target.checked)}
                      className="w-4 h-4 text-orange-500 bg-gray-100 dark:bg-neutral-800 border-gray-300 dark:border-neutral-600 rounded focus:ring-orange-500 focus:ring-2 mr-3"
                    />
                    <div className="flex-1">
                      <div className="text-gray-900 dark:text-white text-sm font-mono tracking-wider">
                        {node.nodo.toUpperCase()}
                      </div>
                      {node.datecreated && (
                        <div className="text-gray-500 dark:text-neutral-400 text-xs font-mono">
                          {new Date(node.datecreated).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-500 dark:text-neutral-400 text-sm font-mono tracking-wider">
                  {formData.fundoid ? (formData.entidadid ? t('metricsensor.loading_nodes') : t('metricsensor.select_entity_to_see_nodes')) : t('umbral.select_fund_to_see_nodes')}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tipos de sensores asignados */}
        {assignedSensorTypes.length > 0 && (
          <div>
            <h4 className="text-lg font-bold text-orange-500 font-mono tracking-wider mb-4">
              {t('umbral.assigned_sensor_types')}
            </h4>
            
            <div className="bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg p-4 max-h-96 overflow-y-auto custom-scrollbar">
              <div className="space-y-2">
                {assignedSensorTypes.map((tipo) => (
                  <div key={tipo.tipoid} className="flex items-center justify-between px-3 py-2 bg-gray-100 dark:bg-neutral-800 rounded">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-orange-500 rounded mr-3 flex items-center justify-center">
                        <span className="text-white text-xs">✓</span>
                      </div>
                      <span className="text-gray-900 dark:text-white text-sm font-mono tracking-wider">
                        {tipo.tipo.toUpperCase()}
                      </span>
                    </div>
                    <svg 
                      className="w-5 h-5 text-gray-400 dark:text-neutral-500" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                      aria-label="Solo lectura"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
                      />
                    </svg>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Fila 3.5: Modo Replicación (después de Nodos, antes de Métricas) */}
      {formData.fundoid && formData.entidadid && selectedNodes.filter(n => n.selected).length > 0 && (
        <div className="bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={replicateMode}
                  onChange={(e) => {
                    setReplicateMode(e.target.checked);
                    if (!e.target.checked) {
                      setSourceNodeId(null);
                      setSourceUmbrales([]);
                      setSelectedUmbralesToReplicate(new Map());
                      setShowReplicationModal(false);
                      modalClosedManuallyRef.current = false;
                      previousSourceNodeIdRef.current = null;
                    }
                  }}
                  className="w-5 h-5 text-orange-500 bg-gray-100 dark:bg-neutral-800 border-gray-300 dark:border-neutral-600 rounded focus:ring-orange-500 focus:ring-2 mr-3"
                />
                <span className="text-lg font-bold text-orange-500 font-mono tracking-wider">
                  REPLICAR UMBRALES DE NODO EXISTENTE
                </span>
              </label>
            </div>
          </div>

          {replicateMode && (
            <div className="space-y-4">
              {/* Selector de nodo fuente */}
              <div>
                {loadingCompatibleNodes ? (
                  <div className="text-center py-4 text-gray-500 dark:text-neutral-400 font-mono text-sm">
                    Buscando nodos compatibles...
                  </div>
                ) : sourceNodesOptions.length === 0 ? (
                  <div className="bg-yellow-900 bg-opacity-20 border border-yellow-500 rounded-lg p-3">
                    <div className="text-yellow-300 font-mono text-sm">
                      ⚠️ No se encontraron nodos fuente compatibles. Los nodos fuente deben tener los mismos tipos de sensores y métricas que los nodos destino seleccionados, y además deben tener umbrales configurados.
                    </div>
                  </div>
                ) : (
                  <SelectWithPlaceholder
                    options={sourceNodesOptions}
                    value={sourceNodeId}
                    onChange={(value) => setSourceNodeId(value ? parseInt(value.toString()) : null)}
                    placeholder={`Seleccionar nodo fuente (${sourceNodesOptions.length} disponible${sourceNodesOptions.length !== 1 ? 's' : ''})...`}
                    disabled={loading || loadingSourceUmbrales || loadingCompatibleNodes}
                  />
                )}
              </div>

              {/* Indicador de carga */}
              {loadingSourceUmbrales && (
                <div className="text-center py-4 text-gray-500 dark:text-neutral-400 font-mono text-sm">
                  Cargando umbrales...
                </div>
              )}

              {/* Mensaje cuando no hay umbrales */}
              {!loadingSourceUmbrales && sourceNodeId && sourceUmbrales.length === 0 && (
                <div className="bg-yellow-900 bg-opacity-20 border border-yellow-500 rounded-lg p-3">
                  <div className="text-yellow-300 font-mono text-sm">
                    ⚠️ El nodo seleccionado no tiene umbrales activos compatibles con los nodos destino.
                  </div>
                </div>
              )}

              {/* Mensaje cuando hay umbrales disponibles */}
              {!loadingSourceUmbrales && sourceNodeId && sourceUmbrales.length > 0 && (
                <div className="bg-blue-900 bg-opacity-20 border border-blue-500 rounded-lg p-3">
                  <div className="text-blue-300 font-mono text-sm">
                    ℹ️ {sourceUmbrales.length} umbral(es) disponible(s). Selecciona los umbrales en el modal.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Métricas */}
      {assignedSensorTypes.length > 0 && (
        <div>
          <h4 className="text-lg font-bold text-orange-500 font-mono tracking-wider mb-4">
            MÉTRICAS
          </h4>
          
          <div className="bg-white dark:bg-neutral-900 border border-gray-300 dark:border-neutral-700 rounded-lg p-4 max-h-96 overflow-y-auto custom-scrollbar">
            <div className="space-y-4">
              {formData.metricasData.map((metrica) => (
                <div key={metrica.metricaid} className="bg-gray-100 dark:bg-neutral-800 rounded-lg">
                  <div className="flex items-center justify-between p-3">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={metrica.selected}
                        onChange={(e) => handleMetricaSelection(metrica.metricaid, e.target.checked)}
                        className="w-4 h-4 text-orange-500 bg-gray-100 dark:bg-neutral-800 border-gray-300 dark:border-neutral-600 rounded focus:ring-orange-500 focus:ring-2 mr-3"
                      />
                      <span className="text-gray-900 dark:text-white text-sm font-mono tracking-wider">
                        {metrica.metrica.toUpperCase()}
                      </span>
                      {metrica.unidad && (
                        <span className="text-gray-500 dark:text-neutral-400 text-xs ml-2">
                          ({metrica.unidad})
                        </span>
                      )}
                    </label>
                    
                    <button
                      onClick={() => handleMetricaToggle(metrica.metricaid)}
                      disabled={!metrica.selected}
                      className="px-3 py-1 bg-orange-500 text-white text-xs rounded hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-mono"
                    >
                      {metrica.expanded ? 'OCULTAR' : 'CONFIGURAR'}
                    </button>
                  </div>
                  
                  {/* Contenido expandible */}
                  {metrica.expanded && metrica.selected && (
                    <div className="px-3 pb-3 border-t border-gray-300 dark:border-neutral-600">
                      <div className="space-y-4 mt-3">
                        {assignedSensorTypes.map((tipo) => {
                          const umbralesDelTipo = metrica.umbralesPorTipo[tipo.tipoid] || [];
                          const umbralesArray = Array.isArray(umbralesDelTipo) ? umbralesDelTipo : (umbralesDelTipo ? [umbralesDelTipo] : []);
                          
                          // Asegurar que haya al menos un umbral vacío
                          let umbralesToShow = umbralesArray.length > 0 ? umbralesArray : [{
                            minimo: '',
                            maximo: '',
                            criticidadid: null,
                            umbral: ''
                          }];
                          
                          // Crear un array con índices originales antes de ordenar
                          const umbralesWithOriginalIndex = umbralesToShow.map((umbral, originalIndex) => ({
                            umbral,
                            originalIndex
                          }));
                          
                          // Ordenar por grado de criticidad (ascendente: grado 1 primero, grado 4 último)
                          const sortedUmbralesWithIndex = [...umbralesWithOriginalIndex].sort((a, b) => {
                            const gradoA = criticidadGradoMap.get(a.umbral.criticidadid || 0) || 999;
                            const gradoB = criticidadGradoMap.get(b.umbral.criticidadid || 0) || 999;
                            return gradoA - gradoB; // Orden ascendente: 1, 2, 3, 4
                          });
                          
                          return (
                            <div key={tipo.tipoid} className="bg-gray-200 dark:bg-neutral-700 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h6 className="text-orange-300 font-mono tracking-wider font-bold">
                                  {tipo.tipo.toUpperCase()}
                                </h6>
                                <button
                                  type="button"
                                  onClick={() => handleAddUmbral(metrica.metricaid, tipo.tipoid)}
                                  className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white text-xs rounded transition-colors font-mono"
                                >
                                  + AGREGAR UMBRAL
                                </button>
                              </div>
                              
                              <div className="space-y-4">
                                {sortedUmbralesWithIndex.map(({ umbral: umbralTipo, originalIndex }, displayIndex) => (
                                  <div key={`${tipo.tipoid}-${originalIndex}`} className="bg-white dark:bg-neutral-800 rounded-lg p-4 border border-gray-300 dark:border-neutral-600">
                                    {sortedUmbralesWithIndex.length > 1 && (
                                      <div className="flex justify-between items-center mb-3">
                                        <span className="text-xs text-gray-500 dark:text-neutral-400 font-mono">
                                          Umbral {displayIndex + 1}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveUmbral(metrica.metricaid, tipo.tipoid, originalIndex)}
                                          className="px-2 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded transition-colors font-mono"
                                        >
                                          ELIMINAR
                                        </button>
                                      </div>
                                    )}
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                        <label className="block text-xs text-gray-600 dark:text-neutral-300 mb-1 font-mono">
                                          VALOR MÍNIMO
                                        </label>
                                        <input
                                          type="number"
                                          step="0.01"
                                          value={umbralTipo.minimo || ''}
                                          onChange={(e) => handleUmbralChange(metrica.metricaid, tipo.tipoid, originalIndex, 'minimo', e.target.value)}
                                          className="w-full px-3 py-2 bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-900 dark:text-white text-sm font-mono focus:ring-orange-500 focus:border-orange-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                          placeholder="0.00"
                                        />
                                      </div>
                                      
                                      <div>
                                        <label className="block text-xs text-gray-600 dark:text-neutral-300 mb-1 font-mono">
                                          VALOR MÁXIMO
                                        </label>
                                        <input
                                          type="number"
                                          step="0.01"
                                          value={umbralTipo.maximo || ''}
                                          onChange={(e) => handleUmbralChange(metrica.metricaid, tipo.tipoid, originalIndex, 'maximo', e.target.value)}
                                          className="w-full px-3 py-2 bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-900 dark:text-white text-sm font-mono focus:ring-orange-500 focus:border-orange-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                          placeholder="100.00"
                                        />
                                      </div>
                                      
                                      <div>
                                        <label className="block text-xs text-gray-600 dark:text-neutral-300 mb-1 font-mono">
                                          CRITICIDAD
                                        </label>
                                        <SelectWithPlaceholder
                                          options={criticidadesOptions}
                                          value={umbralTipo.criticidadid || null}
                                          onChange={(value) => handleUmbralChange(metrica.metricaid, tipo.tipoid, originalIndex, 'criticidadid', value ? value.toString() : '')}
                                          placeholder="SELECCIONAR"
                                          disabled={loading}
                                        />
                                      </div>
                                      
                                      <div>
                                        <label className="block text-xs text-gray-600 dark:text-neutral-300 mb-1 font-mono">
                                          NOMBRE UMBRAL
                                        </label>
                                        <input
                                          type="text"
                                          value={umbralTipo.umbral || ''}
                                          onChange={(e) => handleUmbralChange(metrica.metricaid, tipo.tipoid, originalIndex, 'umbral', e.target.value)}
                                          className="w-full px-3 py-2 bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded text-gray-900 dark:text-white text-sm font-mono focus:ring-orange-500 focus:border-orange-500"
                                          placeholder="Nombre del umbral"
                                        />
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Resumen de selección */}
      {selectedNodesCount > 0 && (
        <div className="bg-gray-100 dark:bg-neutral-800 rounded-lg p-4">
          <h5 className="text-orange-400 font-mono tracking-wider font-bold mb-3">
            {t('umbral.selection_summary')}
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-orange-400">{t('umbral.selected_nodes')}</span>
              <span className="text-gray-900 dark:text-white ml-2">{selectedNodesCount}</span>
            </div>
            <div>
              <span className="text-orange-400">{t('umbral.assigned_types')}</span>
              <span className="text-gray-900 dark:text-white ml-2">{assignedTiposCount}</span>
            </div>
            <div>
              <span className="text-orange-400">{t('umbral.configured_metrics')}</span>
              <span className="text-gray-900 dark:text-white ml-2">{validMetricasCount}</span>
            </div>
          </div>
          <div className="mt-3 text-orange-300 font-mono text-sm">
            {t('umbral.total_thresholds_to_create')} <span className="font-bold">{totalCombinations}</span>
          </div>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={handleApply}
          disabled={!isFormValid() || loading || validationErrors.length > 0}
          className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-mono tracking-wider"
          title={
            loading ? 'Guardando umbrales...' :
            !validationResult.isValid ? 'Selecciona nodos con los mismos tipos de sensores' :
            validationErrors.length > 0 ? `Faltan: ${validationErrors.join(', ')}` :
            `Crear ${totalCombinations} umbrales`
          }
        >
          <span>➕</span>
          <span>
            {loading ? 'GUARDANDO...' : 
             !validationResult.isValid ? 'TIPOS INCONSISTENTES' : 
             validationErrors.length > 0 ? 'FALTAN DATOS' :
             `GUARDAR (${totalCombinations})`}
          </span>
        </button>
        
        <button
          onClick={handleCancel}
          disabled={loading}
          className="px-6 py-2 bg-gray-200 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-neutral-700 transition-colors font-medium flex items-center space-x-2 font-mono tracking-wider"
        >
          <span>❌</span>
          <span>CANCELAR</span>
        </button>
      </div>

      {/* Modal de selección de umbrales para replicación */}
      {showReplicationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-900 border border-orange-500 rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
            {/* Header del modal */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-orange-500 font-mono tracking-wider">
                SELECCIONAR UMBRALES PARA REPLICAR
              </h3>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleSelectAllUmbrales}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-mono font-bold text-sm rounded-lg transition-colors"
                >
                  SELECCIONAR TODO
                </button>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-500 dark:text-neutral-400 hover:text-gray-700 dark:hover:text-neutral-200 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Contenido del modal */}
            <div className="flex-1 overflow-y-auto custom-scrollbar mb-4">
              {loadingSourceUmbrales ? (
                <div className="text-center py-8 text-gray-500 dark:text-neutral-400 font-mono text-sm">
                  Cargando umbrales...
                </div>
              ) : sourceUmbrales.length === 0 ? (
                <div className="bg-yellow-900 bg-opacity-20 border border-yellow-500 rounded-lg p-4">
                  <div className="text-yellow-300 font-mono text-sm">
                    ⚠️ El nodo seleccionado no tiene umbrales activos compatibles con los nodos destino.
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(umbralesOrganizados).map(([metricaid, data]) => (
                    <div key={metricaid} className="bg-gray-50 dark:bg-neutral-800 rounded-lg p-3">
                      <h5 className="text-base font-bold text-orange-500 font-mono tracking-wider mb-3">
                        {data.metrica.toUpperCase()}
                      </h5>
                      <div className="space-y-3 ml-4">
                        {Object.entries(data.tipos).map(([tipoid, tipoData]) => (
                          <div key={tipoid} className="bg-white dark:bg-neutral-900 rounded-lg p-3 border border-gray-200 dark:border-neutral-700">
                            <h6 className="text-sm font-semibold text-gray-700 dark:text-neutral-300 font-mono mb-2">
                              {tipoData.tipo}
                            </h6>
                            <div className="space-y-2">
                              {tipoData.umbrales.map((umbral: any) => {
                                const key = `${umbral.metricaid}-${umbral.tipoid}`;
                                const selectedUmbralids = selectedUmbralesToReplicate.get(key) || [];
                                const isSelected = selectedUmbralids.includes(umbral.umbralid);
                                const criticidadNombre = umbral.criticidadid 
                                  ? (criticidadMap.get(umbral.criticidadid) || `ID: ${umbral.criticidadid}`)
                                  : 'N/A';
                                
                                return (
                                  <label
                                    key={umbral.umbralid}
                                    className="flex items-start cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-800 p-2 rounded"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() => handleUmbralToggle(umbral.metricaid, umbral.tipoid, umbral.umbralid)}
                                      className="w-4 h-4 text-orange-500 bg-gray-100 dark:bg-neutral-800 border-gray-300 dark:border-neutral-600 rounded focus:ring-orange-500 focus:ring-2 mr-3 mt-1"
                                    />
                                    <div className="flex-1 text-xs font-mono text-gray-600 dark:text-neutral-400">
                                      <div>
                                        <span className="font-semibold">Mín:</span> {umbral.minimo ?? 'N/A'} | 
                                        <span className="font-semibold"> Máx:</span> {umbral.maximo ?? 'N/A'} | 
                                        <span className="font-semibold"> Umbral:</span> {umbral.umbral ?? 'N/A'} | 
                                        <span className="font-semibold"> Criticidad:</span> {criticidadNombre}
                                      </div>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer del modal con botones */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-300 dark:border-neutral-700">
              <button
                onClick={handleCloseModal}
                className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white font-mono font-bold rounded-lg transition-colors"
              >
                CANCELAR
              </button>
              <button
                onClick={handleApplySelectedUmbrales}
                disabled={Array.from(selectedUmbralesToReplicate.values()).flat().length === 0}
                className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-mono font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                APLICAR {Array.from(selectedUmbralesToReplicate.values()).flat().length} UMBRAL(ES) SELECCIONADO(S)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
