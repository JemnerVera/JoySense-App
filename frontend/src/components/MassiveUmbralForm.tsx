import React, { useState, useEffect, useMemo, memo } from 'react';
import SelectWithPlaceholder from './SelectWithPlaceholder';

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
    [tipoid: number]: {
      minimo: string;
      maximo: string;
      criticidadid: number | null;
      umbral: string;
    }
  };
}

interface FormData {
  fundoid: number | null;
  entidadid: number | null;
  metricasData: MetricaData[];
}

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
  const [formData, setFormData] = useState<FormData>({
    fundoid: null,
    entidadid: null,
    metricasData: []
  });

  const [selectedNodes, setSelectedNodes] = useState<SelectedNode[]>([]);
  const [allNodesSelected, setAllNodesSelected] = useState(false);
  const [assignedSensorTypes, setAssignedSensorTypes] = useState<SelectedTipo[]>([]);
  const [nodeSensorTypes, setNodeSensorTypes] = useState<{[nodoid: number]: SelectedTipo[]}>({});

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
  useEffect(() => {
    if (metricasOptions.length > 0) {
      const initialMetricasData: MetricaData[] = metricasOptions.map(option => ({
        metricaid: parseInt(option.value.toString()),
        metrica: option.label,
        unidad: option.unidad || '',
        selected: true, // ✅ Seleccionadas por defecto
        expanded: false,
        umbralesPorTipo: {}
      }));
      setFormData(prev => ({ ...prev, metricasData: initialMetricasData }));
    } else {
      // Si no hay métricas disponibles, limpiar las métricas
      setFormData(prev => ({ ...prev, metricasData: [] }));
    }
  }, [metricasOptions]);

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
      
      console.log('🔗 Tipos de sensores asignados para nodos seleccionados (umbral):', {
        nodos: selectedNodesData.map(n => n.nodo),
        nodoIds,
        entidadid: formData.entidadid,
        tipos: assignedTypes.map(t => t.tipo)
      });
      
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

  // Manejar cambio de umbral por tipo
  const handleUmbralChange = (metricaid: number, tipoid: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      metricasData: prev.metricasData.map(metrica => {
        if (metrica.metricaid === metricaid) {
          const updatedUmbralesPorTipo = {
            ...metrica.umbralesPorTipo,
            [tipoid]: {
              ...metrica.umbralesPorTipo[tipoid],
              [field]: field === 'criticidadid' ? (value ? parseInt(value) : null) : value
            }
          };
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
                   m.selected && Object.values(m.umbralesPorTipo).some(u => 
                     u.minimo && u.maximo && u.criticidadid && u.umbral
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
      return Object.values(metrica.umbralesPorTipo).some(umbral => 
        umbral.minimo && umbral.maximo && umbral.criticidadid && umbral.umbral
      );
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
    const dataToApply = [];

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
                console.log('⚠️ Saltando métrica que no existe en metricasensor para este nodo:', {
                  nodo: node.nodo,
                  metrica: metrica.metrica,
                  tipo: tipo.tipo
                });
                continue;
              }
              
              const umbralTipo = metrica.umbralesPorTipo[tipo.tipoid];
              console.log('🔍 Verificando umbral para tipo:', { 
                metrica: metrica.metrica, 
                tipo: tipo.tipo, 
                umbralTipo: umbralTipo 
              });
              
              // Solo incluir si el umbral para este tipo tiene todos los campos requeridos
              if (umbralTipo && umbralTipo.minimo && umbralTipo.maximo && umbralTipo.criticidadid && umbralTipo.umbral) {
                // Obtener ubicacionid desde la tabla localizacion
                const localizacion = localizacionesData?.find(loc => loc.nodoid === node.nodoid);
                if (!localizacion || !localizacion.ubicacionid) {
                  console.error('❌ Nodo sin localización o ubicacionid:', { 
                    nodo: node.nodo, 
                    nodoid: node.nodoid, 
                    localizacion: localizacion 
                  });
                  continue; // Saltar este nodo si no tiene localización
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
              } else {
                console.log('❌ Umbral incompleto para tipo:', { 
                  metrica: metrica.metrica, 
                  tipo: tipo.tipo, 
                  umbralTipo: umbralTipo,
                  tieneMinimo: !!umbralTipo?.minimo,
                  tieneMaximo: !!umbralTipo?.maximo,
                  tieneCriticidad: !!umbralTipo?.criticidadid,
                  tieneUmbral: !!umbralTipo?.umbral
                });
              }
            }
          }
        }
      }
    }

    onApply(dataToApply);
  };

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
    onCancel();
  };

  const selectedNodesCount = getSelectedNodes().length;
  const assignedTiposCount = assignedSensorTypes.length; // Todos los tipos asignados se procesan
  const validMetricasCount = formData.metricasData.filter(m => m.selected && Object.values(m.umbralesPorTipo).some(u => u.minimo && u.maximo && u.criticidadid && u.umbral)).length;
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
            <div className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white font-mono cursor-not-allowed opacity-75">
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
            <div className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white font-mono cursor-not-allowed opacity-75">
              {getEmpresaName(empresaSeleccionada)}
            </div>
          </div>
        );
      } else if (field === 'fundo') {
        return (
          <div key="fundo-contextual">
            <label className="block text-lg font-bold text-orange-500 font-mono tracking-wider mb-2">
              FUNDO
            </label>
            {fundosOptions.length === 1 ? (
              <div className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white font-mono cursor-not-allowed opacity-75">
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
                placeholder="SELECCIONAR FUNDO"
                disabled={loading}
              />
            )}
          </div>
        );
      } else if (field === 'entidad') {
        return (
          <div key="entidad-contextual">
            <label className="block text-lg font-bold text-orange-500 font-mono tracking-wider mb-2">
              ENTIDAD
            </label>
            {entidadesOptions.length === 1 ? (
              <div className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white font-mono cursor-not-allowed opacity-75">
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
                placeholder="SELECCIONAR ENTIDAD"
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
          {!validationResult.isValid && validationResult.groupedNodes && Object.keys(validationResult.groupedNodes).length > 0 && (
            <div className="mb-4 p-3 bg-yellow-900 bg-opacity-20 border border-yellow-500 rounded-lg">
              <div className="flex items-start">
                <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                  <span className="text-black text-xs font-bold">⚠</span>
                </div>
                <div className="flex-1">
                  <h5 className="text-yellow-400 font-bold text-sm font-mono tracking-wider mb-2">
                    TIPOS DE SENSORES INCONSISTENTES
                  </h5>
                  
                  {/* Resumen compacto de grupos con selección interactiva */}
                  <div className="space-y-2">
                    {Object.values(validationResult.groupedNodes).map((group, groupIndex) => (
                      <div 
                        key={groupIndex} 
                        className="bg-neutral-800 border border-neutral-600 rounded p-2 cursor-pointer hover:bg-neutral-700 transition-colors"
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
                            <span key={nodo.nodoid} className="text-white font-mono text-xs bg-neutral-700 px-2 py-1 rounded">
                              {nodo.nodo}
                            </span>
                          ))}
                          {group.nodos.length > 3 && (
                            <span className="text-neutral-400 font-mono text-xs px-2 py-1">
                              +{group.nodos.length - 3} más
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {group.types.slice(0, 2).map((tipo, tipoIndex) => (
                            <span key={tipoIndex} className="text-orange-300 font-mono text-xs bg-orange-900 bg-opacity-30 px-2 py-1 rounded">
                              {tipo}
                            </span>
                          ))}
                          {group.types.length > 2 && (
                            <span className="text-orange-300 font-mono text-xs px-2 py-1">
                              +{group.types.length - 2} más
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 h-44 overflow-y-auto custom-scrollbar">
            {formData.entidadid ? (
              <div className="space-y-2">
                {/* Checkbox para seleccionar todos */}
                {selectedNodes.length > 0 && (
                  <label className="flex items-center px-3 py-2 bg-neutral-800 rounded cursor-pointer hover:bg-neutral-700 transition-colors">
                    <input
                      type="checkbox"
                      checked={allNodesSelected}
                      onChange={(e) => handleSelectAllNodes(e.target.checked)}
                      className="w-4 h-4 text-orange-500 bg-neutral-800 border-neutral-600 rounded focus:ring-orange-500 focus:ring-2 mr-3"
                    />
                    <span className="text-orange-400 text-sm font-mono tracking-wider font-bold">
                      SELECCIONAR TODOS
                    </span>
                  </label>
                )}
                
                {selectedNodes.map((node) => (
                  <label key={node.nodoid} className="flex items-center px-3 py-2 hover:bg-neutral-700 cursor-pointer transition-colors rounded">
                    <input
                      type="checkbox"
                      checked={node.selected}
                      onChange={(e) => handleNodeSelection(node.nodoid, e.target.checked)}
                      className="w-4 h-4 text-orange-500 bg-neutral-800 border-neutral-600 rounded focus:ring-orange-500 focus:ring-2 mr-3"
                    />
                    <div className="flex-1">
                      <div className="text-white text-sm font-mono tracking-wider">
                        {node.nodo.toUpperCase()}
                      </div>
                      {node.datecreated && (
                        <div className="text-neutral-400 text-xs font-mono">
                          {new Date(node.datecreated).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-neutral-400 text-sm font-mono tracking-wider">
                  {formData.fundoid ? (formData.entidadid ? 'CARGANDO NODOS...' : 'SELECCIONA UNA ENTIDAD PARA VER LOS NODOS CON SENSORES') : 'SELECCIONA UN FUNDO PARA VER LOS NODOS'}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tipos de sensores asignados */}
        {assignedSensorTypes.length > 0 && (
          <div>
            <h4 className="text-lg font-bold text-orange-500 font-mono tracking-wider mb-4">
              TIPOS DE SENSORES ASIGNADOS
            </h4>
            
            <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 max-h-96 overflow-y-auto custom-scrollbar">
              <div className="space-y-2">
                {assignedSensorTypes.map((tipo) => (
                  <div key={tipo.tipoid} className="flex items-center px-3 py-2 bg-neutral-800 rounded">
                    <div className="w-4 h-4 bg-orange-500 rounded mr-3 flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                    <span className="text-white text-sm font-mono tracking-wider">
                      {tipo.tipo.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Métricas */}
      {assignedSensorTypes.length > 0 && (
        <div>
          <h4 className="text-lg font-bold text-orange-500 font-mono tracking-wider mb-4">
            MÉTRICAS
          </h4>
          
          <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-4 max-h-96 overflow-y-auto custom-scrollbar">
            <div className="space-y-4">
              {formData.metricasData.map((metrica) => (
                <div key={metrica.metricaid} className="bg-neutral-800 rounded-lg">
                  <div className="flex items-center justify-between p-3">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={metrica.selected}
                        onChange={(e) => handleMetricaSelection(metrica.metricaid, e.target.checked)}
                        className="w-4 h-4 text-orange-500 bg-neutral-800 border-neutral-600 rounded focus:ring-orange-500 focus:ring-2 mr-3"
                      />
                      <span className="text-white text-sm font-mono tracking-wider">
                        {metrica.metrica.toUpperCase()}
                      </span>
                      {metrica.unidad && (
                        <span className="text-neutral-400 text-xs ml-2">
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
                    <div className="px-3 pb-3 border-t border-neutral-600">
                      <div className="space-y-4 mt-3">
                        {assignedSensorTypes.map((tipo) => {
                          const umbralTipo = metrica.umbralesPorTipo[tipo.tipoid] || {
                            minimo: '',
                            maximo: '',
                            criticidadid: null,
                            umbral: ''
                          };
                          
                          return (
                            <div key={tipo.tipoid} className="bg-neutral-700 rounded-lg p-4">
                              <h6 className="text-orange-300 font-mono tracking-wider font-bold mb-3">
                                {tipo.tipo.toUpperCase()}
                              </h6>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <label className="block text-xs text-neutral-300 mb-1 font-mono">
                                    VALOR MÍNIMO
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={umbralTipo.minimo || ''}
                                    onChange={(e) => handleUmbralChange(metrica.metricaid, tipo.tipoid, 'minimo', e.target.value)}
                                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded text-white text-sm font-mono focus:ring-orange-500 focus:border-orange-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    placeholder="0.00"
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-xs text-neutral-300 mb-1 font-mono">
                                    VALOR MÁXIMO
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={umbralTipo.maximo || ''}
                                    onChange={(e) => handleUmbralChange(metrica.metricaid, tipo.tipoid, 'maximo', e.target.value)}
                                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded text-white text-sm font-mono focus:ring-orange-500 focus:border-orange-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    placeholder="100.00"
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-xs text-neutral-300 mb-1 font-mono">
                                    CRITICIDAD
                                  </label>
                                  <SelectWithPlaceholder
                                    options={criticidadesOptions}
                                    value={umbralTipo.criticidadid || null}
                                    onChange={(value) => handleUmbralChange(metrica.metricaid, tipo.tipoid, 'criticidadid', value ? value.toString() : '')}
                                    placeholder="SELECCIONAR"
                                    disabled={loading}
                                  />
                                </div>
                                
                                <div>
                                  <label className="block text-xs text-neutral-300 mb-1 font-mono">
                                    NOMBRE UMBRAL
                                  </label>
                                  <input
                                    type="text"
                                    value={umbralTipo.umbral || ''}
                                    onChange={(e) => handleUmbralChange(metrica.metricaid, tipo.tipoid, 'umbral', e.target.value)}
                                    className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded text-white text-sm font-mono focus:ring-orange-500 focus:border-orange-500"
                                    placeholder="Nombre del umbral"
                                  />
                                </div>
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
        <div className="bg-neutral-800 rounded-lg p-4">
          <h5 className="text-orange-400 font-mono tracking-wider font-bold mb-3">
            RESUMEN DE SELECCIÓN
          </h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-orange-400">Nodos seleccionados:</span>
              <span className="text-white ml-2">{selectedNodesCount}</span>
            </div>
            <div>
              <span className="text-orange-400">Tipos asignados:</span>
              <span className="text-white ml-2">{assignedTiposCount}</span>
            </div>
            <div>
              <span className="text-orange-400">Métricas configuradas:</span>
              <span className="text-white ml-2">{validMetricasCount}</span>
            </div>
          </div>
          <div className="mt-3 text-orange-300 font-mono text-sm">
            Total de umbrales a crear: <span className="font-bold">{totalCombinations}</span>
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
          className="px-6 py-2 bg-neutral-800 border border-neutral-600 text-white rounded-lg hover:bg-neutral-700 transition-colors font-medium flex items-center space-x-2 font-mono tracking-wider"
        >
          <span>❌</span>
          <span>CANCELAR</span>
        </button>
      </div>
    </div>
  );
});
