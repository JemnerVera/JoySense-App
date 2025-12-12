// ============================================================================
// IMPORTS
// ============================================================================

import React, { useState, useEffect, useMemo, memo } from 'react';
import SelectWithPlaceholder from './SelectWithPlaceholder';
import { useLanguage } from '../contexts/LanguageContext';
import { JoySenseService } from '../services/backend-api';
import { logger } from '../utils/logger';

// Types
import {
  MassiveUmbralFormProps,
  FormData,
  SelectedNode,
  SelectedTipo
} from './MassiveUmbralForm/types';

// Hooks
import { useMassiveUmbralForm } from './MassiveUmbralForm/hooks/useMassiveUmbralForm';
import { useMassiveUmbralNodes } from './MassiveUmbralForm/hooks/useMassiveUmbralNodes';
import { useMassiveUmbralMetrics } from './MassiveUmbralForm/hooks/useMassiveUmbralMetrics';
import { useMassiveUmbralValidation } from './MassiveUmbralForm/hooks/useMassiveUmbralValidation';
import { useMassiveUmbralApplication } from './MassiveUmbralForm/hooks/useMassiveUmbralApplication';

// Components
import { MassiveUmbralContextualRow } from './MassiveUmbralForm/components/MassiveUmbralContextualRow';
import { MassiveUmbralNodesSelector } from './MassiveUmbralForm/components/MassiveUmbralNodesSelector';
import { MassiveUmbralSensorTypes } from './MassiveUmbralForm/components/MassiveUmbralSensorTypes';
import { MassiveUmbralMetricsTable } from './MassiveUmbralForm/components/MassiveUmbralMetricsTable';
import { MassiveUmbralSummary } from './MassiveUmbralForm/components/MassiveUmbralSummary';
import { MassiveUmbralActions } from './MassiveUmbralForm/components/MassiveUmbralActions';

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
  // FORM DATA HOOK
  // ============================================================================
  
  // Initialize nodes state first for the form hook
  const [tempSelectedNodes, setTempSelectedNodes] = useState<SelectedNode[]>([]);
  
  const {
    formData,
    setFormData,
    fundosOptions,
    entidadesOptions,
    metricasOptions,
    criticidadesOptions
  } = useMassiveUmbralForm({
    getUniqueOptionsForField,
    selectedNodes: tempSelectedNodes,
    onFormDataChange
  });

  // ============================================================================
  // NODES HOOK
  // ============================================================================
  
  const {
    selectedNodes,
    allNodesSelected,
    assignedSensorTypes,
    nodeSensorTypes,
    handleNodeSelection,
    handleSelectAllNodes,
    getSelectedNodes
  } = useMassiveUmbralNodes({
    fundoid: formData.fundoid,
    entidadid: formData.entidadid,
    getUniqueOptionsForField
  });

  // Update temp nodes for form hook
  useEffect(() => {
    setTempSelectedNodes(selectedNodes);
  }, [selectedNodes]);

  // ============================================================================
  // METRICS HOOK
  // ============================================================================
  
  const {
    handleMetricaToggle,
    handleMetricaSelection,
    handleUmbralChange
  } = useMassiveUmbralMetrics({
    formData,
    setFormData
  });

  // ============================================================================
  // VALIDATION HOOK
  // ============================================================================
  
  const {
    validationResult,
    hasShownInconsistencyWarning,
    setHasShownInconsistencyWarning,
    isFormValid,
    validationErrors,
    selectedNodesCount,
    assignedTiposCount,
    validMetricasCount,
    totalCombinations
  } = useMassiveUmbralValidation({
    selectedNodes,
    nodeSensorTypes,
    formData,
    assignedSensorTypes
  });

  // ============================================================================
  // APPLICATION HOOK
  // ============================================================================
  
  const { handleApply } = useMassiveUmbralApplication({
    formData,
    selectedNodes,
    getUniqueOptionsForField,
    localizacionesData,
    onApply
  });

  // ============================================================================
  // REPLICATION STATE (To be extracted to hook in future)
  // ============================================================================
  
  const [replicateMode, setReplicateMode] = useState(false);
  const [sourceNodeId, setSourceNodeId] = useState<number | null>(null);
  const [sourceUmbrales, setSourceUmbrales] = useState<any[]>([]);
  const [loadingSourceUmbrales, setLoadingSourceUmbrales] = useState(false);
  const [selectedUmbralesToReplicate, setSelectedUmbralesToReplicate] = useState<Map<string, number[]>>(new Map());
  const [showReplicationModal, setShowReplicationModal] = useState(false);
  const [criticidadesData, setCriticidadesData] = useState<any[]>([]);
  const modalClosedManuallyRef = React.useRef(false);
  const previousSourceNodeIdRef = React.useRef<number | null>(null);

  // Cargar criticidades
  useEffect(() => {
    const loadCriticidades = async () => {
      try {
        const criticidades = await JoySenseService.getTableData('criticidad', 1000);
        setCriticidadesData(criticidades || []);
      } catch (error) {
        logger.error('Error cargando criticidades:', error);
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
        map.set(c.criticidadid, c.grado || 999);
      }
    });
    return map;
  }, [criticidadesData]);

  // Organizar umbrales por métrica y tipo para mostrar en la UI
  const umbralesOrganizados = useMemo(() => {
    if (!sourceUmbrales.length) return {};

    const metricasOptionsForReplication = getUniqueOptionsForField('metricaid');
    const tiposOptionsForReplication = formData.entidadid 
      ? getUniqueOptionsForField('tipoid', { entidadid: formData.entidadid.toString() })
      : [];

    const organizados: { [metricaid: number]: { metrica: string; tipos: { [tipoid: number]: { tipo: string; umbrales: any[] } } } } = {};

    sourceUmbrales.forEach((umbral: any) => {
      const metricaOption = metricasOptionsForReplication.find((m: any) => parseInt(m.value.toString()) === umbral.metricaid);
      const tipoOption = tiposOptionsForReplication.find((t: any) => parseInt(t.value.toString()) === umbral.tipoid);

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

    // Ordenar umbrales por grado de criticidad (ascendente)
    Object.keys(organizados).forEach(metricaid => {
      Object.keys(organizados[parseInt(metricaid)].tipos).forEach(tipoid => {
        organizados[parseInt(metricaid)].tipos[parseInt(tipoid)].umbrales.sort((a: any, b: any) => {
          const gradoA = criticidadGradoMap.get(a.criticidadid) || 999;
          const gradoB = criticidadGradoMap.get(b.criticidadid) || 999;
          return gradoA - gradoB;
        });
      });
    });

    return organizados;
  }, [sourceUmbrales, formData.entidadid, getUniqueOptionsForField, criticidadGradoMap]);

  // Función para manejar la selección de umbrales
  const handleUmbralToggle = (metricaid: number, tipoid: number, umbralid: number) => {
    setSelectedUmbralesToReplicate(prev => {
      const newMap = new Map(prev);
      const key = `${metricaid}-${tipoid}`;
      const currentSelection = newMap.get(key) || [];
      
      if (currentSelection.includes(umbralid)) {
        newMap.delete(key);
      } else {
        newMap.set(key, [umbralid]);
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
        if (tipoData.umbrales && tipoData.umbrales.length > 0) {
          allSelected.set(key, [tipoData.umbrales[0].umbralid]);
        }
      });
    });
    
    setSelectedUmbralesToReplicate(allSelected);
  };

  // Función para aplicar los umbrales seleccionados al formulario
  const handleApplySelectedUmbrales = () => {
    const totalSelected = Array.from(selectedUmbralesToReplicate.values()).flat().length;
    if (totalSelected === 0) return;

    const allUmbralids = Array.from(selectedUmbralesToReplicate.values()).flat();
    const umbralesSeleccionados = sourceUmbrales.filter((u: any) => 
      allUmbralids.includes(u.umbralid)
    );

    const umbralesPorMetrica: { [metricaid: number]: { [tipoid: number]: any } } = {};
    
    umbralesSeleccionados.forEach((umbral: any) => {
      if (!umbralesPorMetrica[umbral.metricaid]) {
        umbralesPorMetrica[umbral.metricaid] = {};
      }
      if (!umbralesPorMetrica[umbral.metricaid][umbral.tipoid]) {
        umbralesPorMetrica[umbral.metricaid][umbral.tipoid] = {
          minimo: umbral.minimo?.toString() || '',
          maximo: umbral.maximo?.toString() || '',
          criticidadid: umbral.criticidadid || null,
          umbral: umbral.umbral || ''
        };
      }
    });

    setFormData(prev => ({
      ...prev,
      metricasData: prev.metricasData.map(metrica => {
        const umbralesReplicados = umbralesPorMetrica[metrica.metricaid] || {};
        const updatedUmbralesPorTipo = { ...metrica.umbralesPorTipo };
        
        assignedSensorTypes.forEach(tipo => {
          if (umbralesReplicados[tipo.tipoid]) {
            updatedUmbralesPorTipo[tipo.tipoid] = umbralesReplicados[tipo.tipoid];
          }
        });

        return {
          ...metrica,
          selected: Object.keys(umbralesReplicados).length > 0 ? true : metrica.selected,
          umbralesPorTipo: updatedUmbralesPorTipo
        };
      })
    }));

    setSelectedUmbralesToReplicate(new Map());
    setShowReplicationModal(false);
    modalClosedManuallyRef.current = true;
  };

  // Cargar umbrales cuando se selecciona un nodo fuente
  useEffect(() => {
    const loadUmbralesFromSource = async () => {
      if (!sourceNodeId) {
        setSourceUmbrales([]);
        previousSourceNodeIdRef.current = null;
        modalClosedManuallyRef.current = false;
        return;
      }

      const isNewNodeSelection = previousSourceNodeIdRef.current !== sourceNodeId;
      
      if (isNewNodeSelection) {
        modalClosedManuallyRef.current = false;
      }
      
      previousSourceNodeIdRef.current = sourceNodeId;

      try {
        setLoadingSourceUmbrales(true);
        const allUmbrales = await JoySenseService.getTableData('umbral', 1000);
        const umbralesDelNodo = allUmbrales.filter((u: any) => 
          u.nodoid === sourceNodeId && u.statusid === 1
        );
        setSourceUmbrales(umbralesDelNodo);

        if (umbralesDelNodo.length > 0) {
          const selectedNodesData = selectedNodes.filter(node => node.selected);
          if (selectedNodesData.length > 0) {
            const [allSensors, allMetricaSensors] = await Promise.all([
              JoySenseService.getTableData('sensor', 1000),
              JoySenseService.getTableData('metricasensor', 1000)
            ]);

            const targetNodeIds = selectedNodesData.map(n => n.nodoid);
            const targetSensors = allSensors.filter((s: any) => targetNodeIds.includes(s.nodoid));
            const targetMetricaSensors = allMetricaSensors.filter((ms: any) => targetNodeIds.includes(ms.nodoid));

            const targetTipos = new Set(targetSensors.map((s: any) => s.tipoid));
            const targetMetricas = new Set(targetMetricaSensors.map((ms: any) => ms.metricaid));

            const umbralesCompatibles = umbralesDelNodo.filter((umbral: any) => 
              targetTipos.has(umbral.tipoid) && targetMetricas.has(umbral.metricaid)
            );

            setSourceUmbrales(umbralesCompatibles);
            setSelectedUmbralesToReplicate(new Map());
            if (umbralesCompatibles.length > 0 && isNewNodeSelection && !modalClosedManuallyRef.current) {
              setShowReplicationModal(true);
              modalClosedManuallyRef.current = false;
            }
          } else {
            setSourceUmbrales(umbralesDelNodo);
            setSelectedUmbralesToReplicate(new Map());
            if (umbralesDelNodo.length > 0 && isNewNodeSelection && !modalClosedManuallyRef.current) {
              setShowReplicationModal(true);
              modalClosedManuallyRef.current = false;
            }
          }
        } else {
          setSourceUmbrales([]);
          setSelectedUmbralesToReplicate(new Map());
        }
      } catch (error) {
        logger.error('Error cargando umbrales del nodo fuente:', error);
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

  // Cargar nodos fuente compatibles
  useEffect(() => {
    const loadCompatibleSourceNodes = async () => {
      const selectedNodesData = selectedNodes.filter(node => node.selected);
      
      if (selectedNodesData.length === 0 || !formData.fundoid || !formData.entidadid) {
        setCompatibleSourceNodes([]);
        return;
      }

      try {
        setLoadingCompatibleNodes(true);
        
        const [allSensors, allMetricaSensors, allUmbrales] = await Promise.all([
          JoySenseService.getTableData('sensor', 1000),
          JoySenseService.getTableData('metricasensor', 1000),
          JoySenseService.getTableData('umbral', 1000)
        ]);

        const targetNodeIds = selectedNodesData.map(n => n.nodoid);
        
        const targetNodeProfiles = targetNodeIds.map(nodoid => {
          const nodeSensors = allSensors.filter((s: any) => s.nodoid === nodoid);
          const nodeMetricaSensors = allMetricaSensors.filter((ms: any) => ms.nodoid === nodoid);
          
          const tipos = Array.from(new Set(nodeSensors.map((s: any) => s.tipoid))).sort((a: number, b: number) => a - b);
          const metricas = Array.from(new Set(nodeMetricaSensors.map((ms: any) => ms.metricaid))).sort((a: number, b: number) => a - b);
          
          return {
            nodoid,
            tipos,
            metricas,
            tiposKey: JSON.stringify(tipos),
            metricasKey: JSON.stringify(metricas)
          };
        });

        const allNodosData = await JoySenseService.getTableData('nodo', 1000);
        const allLocalizaciones = await JoySenseService.getTableData('localizacion', 1000);
        const allUbicaciones = await JoySenseService.getTableData('ubicacion', 1000);
        
        const ubicacionesDelFundo = allUbicaciones.filter((u: any) => u.fundoid === formData.fundoid);
        const ubicacionIds = new Set(ubicacionesDelFundo.map((u: any) => u.ubicacionid));
        
        const localizacionesDelFundo = allLocalizaciones.filter((l: any) => 
          ubicacionIds.has(l.ubicacionid)
        );
        const nodoIdsDelFundo = new Set(localizacionesDelFundo.map((l: any) => l.nodoid));
        
        const nodosDelFundo = allNodosData.filter((n: any) => nodoIdsDelFundo.has(n.nodoid));
        
        const allTipos = await JoySenseService.getTableData('tipo', 1000);
        const tiposDeEntidad = allTipos.filter((t: any) => t.entidadid === formData.entidadid);
        const tipoIdsDeEntidad = new Set(tiposDeEntidad.map((t: any) => t.tipoid));
        
        const sensoresConTiposDeEntidad = allSensors.filter((s: any) => 
          tipoIdsDeEntidad.has(s.tipoid)
        );
        const nodoIdsConEntidad = new Set(sensoresConTiposDeEntidad.map((s: any) => s.nodoid));
        
        const allNodes = nodosDelFundo
          .filter((n: any) => nodoIdsConEntidad.has(n.nodoid))
          .map((n: any) => ({
            value: n.nodoid,
            label: n.nodo || `Nodo ${n.nodoid}`
          }));

        const umbralesActivos = allUmbrales.filter((u: any) => u.statusid === 1);
        const nodoidsConUmbrales = new Set(umbralesActivos.map((u: any) => u.nodoid));

        const compatibleNodes = allNodes
          .filter((option: any) => {
            const nodoid = parseInt(option.value.toString());
            
            if (targetNodeIds.includes(nodoid)) return false;
            if (!nodoidsConUmbrales.has(nodoid)) return false;

            const nodeSensors = allSensors.filter((s: any) => s.nodoid === nodoid);
            const nodeMetricaSensors = allMetricaSensors.filter((ms: any) => ms.nodoid === nodoid);
            
            const nodeTipos = Array.from(new Set(nodeSensors.map((s: any) => s.tipoid))).sort((a: number, b: number) => a - b);
            const nodeMetricas = Array.from(new Set(nodeMetricaSensors.map((ms: any) => ms.metricaid))).sort((a: number, b: number) => a - b);

            const isCompatible = targetNodeProfiles.some(profile => {
              const hasAllTipos = profile.tipos.every(tipo => nodeTipos.includes(tipo));
              const hasAllMetricas = profile.metricas.every(metrica => nodeMetricas.includes(metrica));
              return hasAllTipos || hasAllMetricas;
            });

            return isCompatible;
          })
          .map((option: any) => ({
            value: parseInt(option.value.toString()),
            label: option.label
          }));

        setCompatibleSourceNodes(compatibleNodes);
      } catch (error) {
        logger.error('Error cargando nodos fuente compatibles:', error);
        setCompatibleSourceNodes([]);
      } finally {
        setLoadingCompatibleNodes(false);
      }
    };

    loadCompatibleSourceNodes();
  }, [selectedNodes, formData.fundoid, formData.entidadid, getUniqueOptionsForField]);

  const sourceNodesOptions = useMemo(() => {
    return compatibleSourceNodes;
  }, [compatibleSourceNodes]);

  // Función para manejar selección de grupo de nodos
  const handleGroupSelection = (nodos: number[]) => {
    setTempSelectedNodes(prev => prev.map(node => ({
      ...node,
      selected: nodos.includes(node.nodoid)
    })));
    
    setTimeout(() => {
      const metricasDelGrupo = getUniqueOptionsForField('metricaid', { 
        nodoids: nodos.join(',') 
      });
      
      if (metricasDelGrupo.length > 0) {
        const metricasConfiguradas = metricasDelGrupo.map(metrica => ({
          metricaid: parseInt(metrica.value.toString()),
          metrica: metrica.label,
          unidad: metrica.unidad || '',
          selected: true,
          expanded: false,
          umbralesPorTipo: {}
        }));
        
        setFormData(prev => ({
          ...prev,
          metricasData: metricasConfiguradas
        }));
      }
    }, 100);
  };

  // Limpiar formulario
  const handleCancel = () => {
    setFormData({
      fundoid: null,
      entidadid: null,
      metricasData: []
    });
    setReplicateMode(false);
    setSourceNodeId(null);
    setSourceUmbrales([]);
    onCancel();
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Fila 1: País y Empresa (contextual) */}
      <MassiveUmbralContextualRow
        fields={['pais', 'empresa']}
        formData={formData}
        setFormData={setFormData}
        fundosOptions={fundosOptions}
        entidadesOptions={entidadesOptions}
        paisSeleccionado={paisSeleccionado}
        empresaSeleccionada={empresaSeleccionada}
        getPaisName={getPaisName}
        getEmpresaName={getEmpresaName}
        loading={loading}
      />

      {/* Fila 2: Fundo y Entidad (contextual) */}
      <MassiveUmbralContextualRow
        fields={['fundo', 'entidad']}
        formData={formData}
        setFormData={setFormData}
        fundosOptions={fundosOptions}
        entidadesOptions={entidadesOptions}
        loading={loading}
      />

      {/* Fila 3: Nodos y Tipos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Nodos */}
        <MassiveUmbralNodesSelector
          selectedNodes={selectedNodes}
          allNodesSelected={allNodesSelected}
          validationResult={validationResult}
          hasShownInconsistencyWarning={hasShownInconsistencyWarning}
          entidadid={formData.entidadid}
          onNodeSelection={handleNodeSelection}
          onSelectAllNodes={handleSelectAllNodes}
          onGroupSelection={handleGroupSelection}
          getUniqueOptionsForField={getUniqueOptionsForField}
          setFormData={setFormData}
        />

        {/* Tipos de sensores asignados */}
        <MassiveUmbralSensorTypes
          assignedSensorTypes={assignedSensorTypes}
        />
      </div>

      {/* Fila 3.5: Modo Replicación */}
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
      <MassiveUmbralMetricsTable
        metricasData={formData.metricasData}
        assignedSensorTypes={assignedSensorTypes}
        criticidadesOptions={criticidadesOptions}
        onMetricaToggle={handleMetricaToggle}
        onMetricaSelection={handleMetricaSelection}
        onUmbralChange={handleUmbralChange}
        loading={loading}
      />

      {/* Resumen de selección */}
      <MassiveUmbralSummary
        selectedNodesCount={selectedNodesCount}
        assignedTiposCount={assignedTiposCount}
        validMetricasCount={validMetricasCount}
        totalCombinations={totalCombinations}
      />

      {/* Botones de acción */}
      <MassiveUmbralActions
        onApply={handleApply}
        onCancel={handleCancel}
        isValid={!!isFormValid()}
        loading={loading}
        validationResult={validationResult}
        validationErrors={validationErrors}
        totalCombinations={totalCombinations}
      />

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