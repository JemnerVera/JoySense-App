// ============================================================================
// COMPONENT: MassiveUmbralNodesSelector - Selector de nodos con validación
// ============================================================================

import React from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { SelectedNode, ValidationResult, FormData } from '../types';

interface MassiveUmbralNodesSelectorProps {
  selectedNodes: SelectedNode[];
  allNodesSelected: boolean;
  validationResult: ValidationResult;
  hasShownInconsistencyWarning: boolean;
  entidadid: number | null;
  onNodeSelection: (nodoid: number, selected: boolean) => void;
  onSelectAllNodes: (selected: boolean) => void;
  onGroupSelection: (nodos: number[]) => void;
  getUniqueOptionsForField: (field: string, filters?: any) => any[];
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
}

export const MassiveUmbralNodesSelector: React.FC<MassiveUmbralNodesSelectorProps> = ({
  selectedNodes,
  allNodesSelected,
  validationResult,
  hasShownInconsistencyWarning,
  entidadid,
  onNodeSelection,
  onSelectAllNodes,
  onGroupSelection,
  getUniqueOptionsForField,
  setFormData
}) => {
  const { t } = useLanguage();

  const selectedNodesData = selectedNodes.filter(node => node.selected);
  const hasMultipleNodes = selectedNodesData.length > 1;
  const hasValidationData = validationResult.groupedNodes && Object.keys(validationResult.groupedNodes).length > 0;
  const shouldShowWarning = hasMultipleNodes && (hasValidationData || hasShownInconsistencyWarning);

  return (
    <div>
      <h4 className="text-lg font-bold text-orange-500 font-mono tracking-wider mb-4">
        NODO
      </h4>
      
      {/* Mensaje de validación de similitud de nodos */}
      {shouldShowWarning && (
        <div className="mb-4 p-3 bg-yellow-900 bg-opacity-20 border border-yellow-500 rounded-lg">
          <div className="flex items-start">
            <div className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
              <span className="text-black text-xs font-bold">⚠</span>
            </div>
            <div className="flex-1">
              <h5 className="text-yellow-400 font-bold text-sm font-mono tracking-wider mb-2">
                TIPOS DE SENSORES INCONSISTENTES
              </h5>
              
              {(!validationResult.groupedNodes || Object.keys(validationResult.groupedNodes).length === 0) ? (
                <div className="text-yellow-300 font-mono text-xs">
                  Cargando información de tipos de sensores...
                </div>
              ) : (
                <div className="space-y-2">
                  {Object.values(validationResult.groupedNodes).map((group, groupIndex) => (
                    <div 
                      key={groupIndex} 
                      className="bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-600 rounded p-2 cursor-pointer hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors"
                      onClick={() => {
                        const nodosDelGrupo = group.nodos.map(nodo => nodo.nodoid);
                        onGroupSelection(nodosDelGrupo);
                        
                        setTimeout(() => {
                          const metricasDelGrupo = getUniqueOptionsForField('metricaid', { 
                            nodoids: nodosDelGrupo.join(',') 
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
        {entidadid ? (
          <div className="space-y-2">
            {/* Checkbox para seleccionar todos */}
            {selectedNodes.length > 0 && (
              <label className="flex items-center px-3 py-2 bg-gray-100 dark:bg-neutral-800 rounded cursor-pointer hover:bg-gray-200 dark:hover:bg-neutral-700 transition-colors">
                <input
                  type="checkbox"
                  checked={allNodesSelected}
                  onChange={(e) => onSelectAllNodes(e.target.checked)}
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
                  onChange={(e) => onNodeSelection(node.nodoid, e.target.checked)}
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
              {t('metricsensor.select_entity_to_see_nodes')}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

