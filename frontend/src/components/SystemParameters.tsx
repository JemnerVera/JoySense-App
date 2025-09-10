import React, { useState, useEffect, useCallback } from 'react';
import { handleInsertError, handleMultipleInsertError } from '../utils/errorHandler';
import { useAuth } from '../contexts/AuthContext';
import { JoySenseService } from '../services/backend-api';
import { TableInfo, ColumnInfo, Message } from '../types/systemParameters';
import { STYLES_CONFIG } from '../config/styles';
import MultipleSensorForm from './MultipleSensorForm';
import MultipleMetricaSensorForm from './MultipleMetricaSensorForm';
import MultipleLocalizacionForm from './MultipleLocalizacionForm';
import NormalInsertForm from './NormalInsertForm';
import InsertionMessage from './InsertionMessage';
import { useInsertionMessages } from '../hooks/useInsertionMessages';
import ReplicateModal from './ReplicateModal';
import ReplicateButton from './ReplicateButton';
import { useReplicate } from '../hooks/useReplicate';
import { useGlobalFilterEffect } from '../hooks/useGlobalFilterEffect';

// Hook personalizado para manejar selección múltiple basada en timestamp
const useMultipleSelection = (selectedTable: string) => {
  // Función para buscar entradas por diferentes criterios
  const searchByCriteria = (criteria: string, filterFn: (dataRow: any) => boolean, data: any[]) => {
    const results = data.filter(filterFn);
    console.log(`🔍 ${criteria}:`, results.length);
    if (results.length > 0) {
      console.log(`📋 Detalles de ${criteria}:`, results.map(e => ({
        nodoid: e.nodoid,
        tipoid: e.tipoid,
        datecreated: e.datecreated,
        statusid: e.statusid
      })));
    }
    return results;
  };

  // Función para buscar entradas con timestamp exacto
  const findExactTimestampMatches = (row: any, allData: any[]) => {
    return searchByCriteria(
      'Entradas con timestamp exacto',
      (dataRow) => 
        dataRow.nodoid === row.nodoid && 
        dataRow.datecreated === row.datecreated,
      allData
    );
  };

  // Función para buscar entradas con timestamp por segundos (ignorando milisegundos)
  const findTimestampBySecondsMatches = (row: any, allData: any[]) => {
    const targetTime = new Date(row.datecreated);
    const targetSeconds = new Date(targetTime.getFullYear(), targetTime.getMonth(), targetTime.getDate(), 
                                 targetTime.getHours(), targetTime.getMinutes(), targetTime.getSeconds());
    
    console.log(`🎯 Timestamp objetivo (por segundos): ${targetSeconds.toISOString()}`);
    
    return searchByCriteria(
      'Entradas con timestamp por segundos (ignorando milisegundos)',
      (dataRow) => {
        if (dataRow.nodoid !== row.nodoid) return false;
        
        const rowTime = new Date(dataRow.datecreated);
        const rowSeconds = new Date(rowTime.getFullYear(), rowTime.getMonth(), rowTime.getDate(), 
                                  rowTime.getHours(), rowTime.getMinutes(), rowTime.getSeconds());
        
        const isSameSecond = targetSeconds.getTime() === rowSeconds.getTime();
        console.log(`📊 Comparando por segundos: ${rowSeconds.toISOString()} - Mismo segundo: ${isSameSecond}`);
        
        return isSameSecond;
      },
      allData
    );
  };

  // Función para buscar entradas con timestamp cercano
  const findNearTimestampMatches = (row: any, allData: any[], toleranceMs: number) => {
    const targetTime = new Date(row.datecreated).getTime();
    console.log(`🎯 Timestamp objetivo: ${new Date(targetTime).toISOString()}`);
    
    return searchByCriteria(
      `Entradas con timestamp cercano (${toleranceMs}ms)`,
      (dataRow) => {
        if (dataRow.nodoid !== row.nodoid) return false;
        
        const rowTime = new Date(dataRow.datecreated).getTime();
        const timeDiff = Math.abs(targetTime - rowTime);
        
        console.log(`📊 Comparando: ${new Date(rowTime).toISOString()} - Diferencia: ${timeDiff}ms`);
        
        return timeDiff <= toleranceMs;
      },
      allData
    );
  };

  // Función para buscar entradas por lógica de negocio
  const findBusinessLogicMatches = (row: any, allData: any[]) => {
    if (selectedTable !== 'sensor' && selectedTable !== 'metricasensor') {
      return [];
    }

    console.log('🔍 Aplicando lógica de agrupación por negocio para:', selectedTable);
    
    // Buscar entradas del mismo nodo con status activo
    const activeNodeEntries = searchByCriteria(
      'Entradas del mismo nodo con status activo',
      (dataRow) => 
        dataRow.nodoid === row.nodoid && 
        dataRow.statusid === 1,
      allData
    );
    
    if (activeNodeEntries.length <= 1) {
      return [];
    }

    // Para sensor: agrupar por tipos de sensor comunes (1, 2, 3)
    if (selectedTable === 'sensor') {
      const commonTipos = [1, 2, 3];
      const groupedEntries = searchByCriteria(
        'Entradas agrupadas por tipos comunes (1,2,3)',
        (entry) => commonTipos.includes(entry.tipoid),
        activeNodeEntries
      );
      
      if (groupedEntries.length > 1) {
        console.log('✅ Usando entradas agrupadas por tipos comunes:', groupedEntries.length);
        return groupedEntries;
      }
    }
    
    // Para metricasensor: agrupar por métricas comunes (1, 2, 3)
    if (selectedTable === 'metricasensor') {
      const commonMetricas = [1, 2, 3];
      const groupedEntries = searchByCriteria(
        'Entradas agrupadas por métricas comunes (1,2,3)',
        (entry) => commonMetricas.includes(entry.metricaid),
        activeNodeEntries
      );
      
      if (groupedEntries.length > 1) {
        console.log('✅ Usando entradas agrupadas por métricas comunes:', groupedEntries.length);
        return groupedEntries;
      }
    }
    
    // Si no se pudieron agrupar por tipos/métricas específicos, usar todas las activas del nodo
    console.log('⚠️ No se pudieron agrupar por tipos/métricas específicos, usando todas las entradas activas del nodo');
    if (activeNodeEntries.length > 1) {
      console.log('✅ Usando todas las entradas activas del nodo:', activeNodeEntries.length);
      return activeNodeEntries;
    }
    
    return [];
  };

  // Función para agrupar entradas por criterios de negocio específicos
  const findBusinessCriteriaMatches = (row: any, allData: any[]) => {
    if (selectedTable !== 'sensor' && selectedTable !== 'metricasensor') {
      return [];
    }

    console.log('🔍 Aplicando agrupación por criterios de negocio específicos para:', selectedTable);
    
    // Normalizar la fecha de modificación para comparar solo la fecha (sin tiempo)
    const normalizeDate = (dateString: string) => {
      const date = new Date(dateString);
      return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString().split('T')[0];
    };
    
    const targetDateCreated = normalizeDate(row.datecreated);
    const targetDateModified = normalizeDate(row.datemodified);
    
    console.log('🎯 Criterios de agrupación:');
    console.log('  - nodoid:', row.nodoid);
    console.log('  - datecreated (normalizado):', targetDateCreated);
    console.log('  - datemodified (normalizado):', targetDateModified);
    console.log('  - usercreatedid:', row.usercreatedid);
    console.log('  - statusid:', row.statusid);
    
    // Buscar entradas que coincidan con todos los criterios de negocio
    const businessMatches = searchByCriteria(
      'Entradas agrupadas por criterios de negocio específicos',
      (dataRow) => {
        if (dataRow.nodoid !== row.nodoid) return false;
        if (dataRow.usercreatedid !== row.usercreatedid) return false;
        if (dataRow.statusid !== row.statusid) return false;
        
        const rowDateCreated = normalizeDate(dataRow.datecreated);
        const rowDateModified = normalizeDate(dataRow.datemodified);
        
        if (rowDateCreated !== targetDateCreated) return false;
        if (rowDateModified !== targetDateModified) return false;
        
        console.log(`📊 Coincidencia de criterios para idx ${dataRow.idx}:`, {
          nodoid: dataRow.nodoid,
          tipoid: dataRow.tipoid,
          datecreated: rowDateCreated,
          datemodified: rowDateModified,
          usercreatedid: dataRow.usercreatedid,
          statusid: dataRow.statusid
        });
        
        return true;
      },
      allData
    );
    
    if (businessMatches.length > 1) {
      console.log('✅ Usando entradas agrupadas por criterios de negocio específicos:', businessMatches.length);
      return businessMatches;
    }
    
    return [];
  };

  const findEntriesByTimestamp = (row: any, tableData: any[], updateData: any[]) => {
    if (selectedTable !== 'sensor' && selectedTable !== 'metricasensor') {
      return [row]; // Para otras tablas, solo la fila seleccionada
    }

    console.log('🔍 Buscando entradas múltiples para:', { 
      nodoid: row.nodoid, 
      datecreated: row.datecreated,
      statusid: row.statusid,
      table: selectedTable 
    });

    // Mostrar todos los datos disponibles para debugging
    console.log('📊 Datos disponibles para búsqueda:');
    console.log('  - tableData length:', tableData.length);
    console.log('  - updateData length:', updateData.length);
    
    // Mostrar todas las entradas del mismo nodo para debugging
    const allData = [...tableData, ...updateData];
    const sameNodeEntries = allData.filter(dataRow => dataRow.nodoid === row.nodoid);
    console.log('  - Entradas del mismo nodo:', sameNodeEntries.length);
    if (sameNodeEntries.length > 0) {
      console.log('📋 Todas las entradas del nodo:', sameNodeEntries.map(e => ({
        nodoid: e.nodoid,
        tipoid: e.tipoid,
        datecreated: e.datecreated,
        statusid: e.statusid
      })));
      
      // Mostrar todos los timestamps únicos para debugging
      const uniqueTimestamps = Array.from(new Set(sameNodeEntries.map(e => e.datecreated)));
      console.log('🕐 Timestamps únicos disponibles:', uniqueTimestamps.map(ts => new Date(ts).toISOString()));
      
      // Mostrar todos los tipos de sensor disponibles para debugging
      if (selectedTable === 'sensor') {
        const uniqueTipos = Array.from(new Set(sameNodeEntries.map(e => e.tipoid)));
        console.log('🏷️ Tipos de sensor disponibles para el nodo:', uniqueTipos.sort((a, b) => a - b));
      }
      
      // Mostrar todas las métricas disponibles para debugging
      if (selectedTable === 'metricasensor') {
        const uniqueMetricas = Array.from(new Set(sameNodeEntries.map(e => e.metricaid)));
        console.log('📊 Métricas disponibles para el nodo:', uniqueMetricas.sort((a, b) => a - b));
      }
    }

    // Estrategia de búsqueda: buscar en múltiples niveles y elegir el mejor resultado
    let bestMatches: any[] = [];
    let bestMatchReason = '';

    // Nivel 1: Timestamp exacto + mismo status
    const exactStatusMatches = searchByCriteria(
      'Encontradas en tableData con timestamp exacto Y mismo status',
      (dataRow) => 
        dataRow.nodoid === row.nodoid && 
        dataRow.datecreated === row.datecreated &&
        dataRow.statusid === row.statusid,
      tableData
    );
    
    if (exactStatusMatches.length > 1) {
      bestMatches = exactStatusMatches;
      bestMatchReason = `timestamp exacto + mismo status (${exactStatusMatches.length} entradas)`;
    }

    // Nivel 2: Timestamp exacto (sin importar status)
    if (bestMatches.length <= 1) {
      const exactTimestampMatches = findExactTimestampMatches(row, allData);
      if (exactTimestampMatches.length > bestMatches.length) {
        bestMatches = exactTimestampMatches;
        bestMatchReason = `timestamp exacto (${exactTimestampMatches.length} entradas)`;
      }
    }

    // Nivel 3: Timestamp por segundos (ignorando milisegundos) ⭐ NUEVO
    if (bestMatches.length <= 1) {
      const secondsMatches = findTimestampBySecondsMatches(row, allData);
      if (secondsMatches.length > bestMatches.length) {
        bestMatches = secondsMatches;
        bestMatchReason = `timestamp por segundos (${secondsMatches.length} entradas)`;
      }
    }

    // Nivel 4: Criterios de negocio específicos ⭐ NUEVO Y CLAVE
    if (bestMatches.length <= 1) {
      const businessCriteriaMatches = findBusinessCriteriaMatches(row, allData);
      if (businessCriteriaMatches.length > bestMatches.length) {
        bestMatches = businessCriteriaMatches;
        bestMatchReason = `criterios de negocio específicos (${businessCriteriaMatches.length} entradas)`;
      }
    }

    // Nivel 5: Timestamp cercano (5 segundos)
    if (bestMatches.length <= 1) {
      const nearMatches = findNearTimestampMatches(row, allData, 5000);
      if (nearMatches.length > bestMatches.length) {
        bestMatches = nearMatches;
        bestMatchReason = `timestamp cercano 5s (${nearMatches.length} entradas)`;
      }
    }

    // Nivel 6: Misma sesión (1 minuto)
    if (bestMatches.length <= 1) {
      const sessionMatches = findNearTimestampMatches(row, allData, 60000);
      if (sessionMatches.length > bestMatches.length) {
        bestMatches = sessionMatches;
        bestMatchReason = `misma sesión 1min (${sessionMatches.length} entradas)`;
      }
    }

    // Nivel 7: Lógica de negocio
    if (bestMatches.length <= 1) {
      const businessMatches = findBusinessLogicMatches(row, allData);
      if (businessMatches.length > bestMatches.length) {
        bestMatches = businessMatches;
        bestMatchReason = `lógica de negocio (${businessMatches.length} entradas)`;
      }
    }

    // Retornar el mejor resultado encontrado
    if (bestMatches.length > 1) {
      console.log(`✅ Usando ${bestMatches.length} entradas encontradas por: ${bestMatchReason}`);
      return bestMatches;
    }

    // Si no se encontraron múltiples, devolver solo la entrada original
    console.log('⚠️ No se encontraron entradas múltiples, usando solo la seleccionada');
    return [row];
  };

  return { findEntriesByTimestamp };
};

// Hook personalizado para manejar paginación
const usePagination = (data: any[], itemsPerPage: number = 10) => {
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(data.length / itemsPerPage);
  
  console.log('📊 usePagination Debug:', { 
    dataLength: data.length, 
    itemsPerPage, 
    totalPages, 
    currentPage 
  });
  
  const getPaginatedData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = data.slice(startIndex, endIndex);
    
    console.log('📄 getPaginatedData:', { 
      startIndex, 
      endIndex, 
      paginatedDataLength: paginatedData.length,
      currentPage,
      totalPages
    });
    
    return paginatedData;
  };
  
  const goToPage = (page: number) => {
    console.log('🔄 goToPage:', { from: currentPage, to: page, totalPages });
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  
  const nextPage = () => goToPage(currentPage + 1);
  const prevPage = () => goToPage(currentPage - 1);
  
  // Resetear a página 1 cuando cambian los datos
  useEffect(() => {
    console.log('🔄 Pagination reset to page 1 due to data change');
    setCurrentPage(1);
  }, [data.length]);
  
  return {
    currentPage,
    totalPages,
    getPaginatedData,
    goToPage,
    nextPage,
    prevPage,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1
  };
};

interface SystemParametersProps {
  selectedTable?: string;
  onTableSelect?: (table: string) => void;
  activeSubTab?: 'status' | 'insert' | 'update';
  onSubTabChange?: (subTab: 'status' | 'insert' | 'update') => void;
  activeTab?: string;
}

const SystemParameters: React.FC<SystemParametersProps> = ({ 
  selectedTable: propSelectedTable, 
  onTableSelect,
  activeSubTab: propActiveSubTab,
  onSubTabChange,
  activeTab
}) => {
  const { user } = useAuth();
  const [selectedTable, setSelectedTable] = useState<string>(propSelectedTable || '');
  const [activeSubTab, setActiveSubTab] = useState<'status' | 'insert' | 'update'>(propActiveSubTab || 'status');
  
  // Función para manejar el cambio de pestaña y limpiar mensajes
  const handleTabChange = (tab: 'status' | 'insert' | 'update') => {
    setActiveSubTab(tab);
    // Limpiar mensajes al cambiar de pestaña
    setMessage(null);
    setUpdateMessage(null);
    setCopyMessage(null);
    // Limpiar mensajes de inserción al cambiar de pestaña
    clearOnTabChange();
    
    // Limpiar selecciones específicas según la pestaña
    if (tab === 'update') {
      setSelectedRowForUpdate(null);
      setSelectedRowsForUpdate([]);
      setUpdateFormData({});
      setSearchField('');
      setSearchTerm('');
    }
    
    // Llamar a la función del padre si está disponible
    if (onSubTabChange) {
      onSubTabChange(tab);
    }
  };

  // Efecto para limpiar mensajes cuando cambia la pestaña desde el exterior
  useEffect(() => {
    // Limpiar mensajes cuando cambia activeSubTab desde el exterior
    setMessage(null);
    setUpdateMessage(null);
    setCopyMessage(null);
    clearOnTabChange();
  }, [activeSubTab]);
  const [pendingTableChange, setPendingTableChange] = useState<string>('');
  const [tableInfo, setTableInfo] = useState<TableInfo | null>(null);
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [tableData, setTableData] = useState<any[]>([]);
  
  // Usar 10 items por página por defecto
  const itemsPerPage = 10;
  
  // Aplicar filtros globales a los datos de la tabla
  const filteredTableData = useGlobalFilterEffect({
    tableName: selectedTable,
    data: tableData
  });

  // Actualizar statusFilteredData cuando cambien los filtros globales
  useEffect(() => {
    setStatusFilteredData(filteredTableData);
    setStatusTotalPages(Math.ceil(filteredTableData.length / itemsPerPage));
    setStatusCurrentPage(1);
  }, [filteredTableData, itemsPerPage]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<Message | null>(null);
  const [updateMessage, setUpdateMessage] = useState<Message | null>(null);
  const [copyMessage, setCopyMessage] = useState<Message | null>(null);
  const [tableConstraints, setTableConstraints] = useState<any>(null);
  const [userData, setUserData] = useState<any[]>([]);
  const [paisesData, setPaisesData] = useState<any[]>([]);
  const [empresasData, setEmpresasData] = useState<any[]>([]);
  const [fundosData, setFundosData] = useState<any[]>([]);
  const [ubicacionesData, setUbicacionesData] = useState<any[]>([]);
  const [entidadesData, setEntidadesData] = useState<any[]>([]);
  const [nodosData, setNodosData] = useState<any[]>([]);
  const [tiposData, setTiposData] = useState<any[]>([]);
  const [metricasData, setMetricasData] = useState<any[]>([]);
  const [criticidadesData, setCriticidadesData] = useState<any[]>([]);
  const [perfilesData, setPerfilesData] = useState<any[]>([]);
  const [umbralesData, setUmbralesData] = useState<any[]>([]);
  const [mediosData, setMediosData] = useState<any[]>([]);

  // Estados para actualización con paginación
  const [updateData, setUpdateData] = useState<any[]>([]);
  const [searchField, setSearchField] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRowForUpdate, setSelectedRowForUpdate] = useState<any>(null);
  const [updateFormData, setUpdateFormData] = useState<Record<string, any>>({});
  const [updateLoading, setUpdateLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Estados para paginación y búsqueda de la tabla de Estado
  const [statusCurrentPage, setStatusCurrentPage] = useState(1);
  const [statusTotalPages, setStatusTotalPages] = useState(1);
  const [statusSearchTerm, setStatusSearchTerm] = useState<string>('');
  const [statusFilteredData, setStatusFilteredData] = useState<any[]>([]);
  const [statusLoading, setStatusLoading] = useState(false);
  
  // Estados para la tabla de equivalencias mejorada (ya no necesitamos estos)
  // const [equivalenceViewMode, setEquivalenceViewMode] = useState<'table' | 'cards' | 'select'>('table');
  // const [filteredEquivalences, setFilteredEquivalences] = useState<Array<{label: string, value: string}>>([]);
  
  // Estados para la funcionalidad de copiar
  const [copyData, setCopyData] = useState<any[]>([]);
  const [selectedRowsForCopy, setSelectedRowsForCopy] = useState<any[]>([]);
  const [copySearchTerm, setCopySearchTerm] = useState<string>('');
  const [copyFilteredData, setCopyFilteredData] = useState<any[]>([]);
  const [copyCurrentPage, setCopyCurrentPage] = useState(1);
  const [copyTotalPages, setCopyTotalPages] = useState(1);
  
  // Estados para selección múltiple en actualización
  const [selectedRowsForUpdate, setSelectedRowsForUpdate] = useState<any[]>([]);
  const [bulkUpdateField, setBulkUpdateField] = useState<string>('');
  const [bulkUpdateValue, setBulkUpdateValue] = useState<any>('');
  
  // Estados para modal de confirmación
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelAction, setCancelAction] = useState<(() => void) | null>(null);
  
  // Hook para manejar mensajes de inserción
  const { insertedRecords, addInsertedRecord, clearInsertedRecords, clearOnTabChange } = useInsertionMessages(activeSubTab, activeTab, selectedTable);
  
  // Hook para manejar replicación
  const { showModal, replicateOptions, openReplicateModal, closeReplicateModal, handleReplicate } = useReplicate();

  // Funciones para manejar replicación
  const handleReplicateSensor = (nodo: any) => {
    // Obtener todos los sensores del nodo seleccionado
    const sensoresDelNodo = tableData.filter(sensor => sensor.nodoid === nodo.nodoid);
    
    if (sensoresDelNodo.length > 0) {
      // Configurar el nodo seleccionado
      setSelectedNodo(nodo.nodoid.toString());
      
      // Configurar la cantidad basada en los sensores encontrados
      setSelectedSensorCount(sensoresDelNodo.length);
      
      // Extraer los tipos únicos de los sensores del nodo
      const tiposUnicos = Array.from(new Set(sensoresDelNodo.map(sensor => sensor.tipoid)));
      
      // Inicializar sensores con todos los tipos del nodo seleccionado
      initializeMultipleSensors(nodo.nodoid.toString(), sensoresDelNodo.length, tiposUnicos);
    } else {
      // Si no hay sensores en el nodo, solo configurar el nodo
      setSelectedNodo(nodo.nodoid.toString());
      setSelectedSensorCount(0);
      setSelectedTipo('');
    }
  };

  const handleReplicateMetricaSensor = (metricasensor: any) => {
    // Activar modo replicación
    setIsReplicateMode(true);
    
    // Llenar el formulario con los datos de la métrica sensor seleccionada
    setSelectedNodos([metricasensor.nodoid?.toString() || '']);
    setSelectedMetricas([metricasensor.metricaid?.toString() || '']);
    
    // Inicializar métricas con los datos seleccionados
    if (metricasensor.nodoid && metricasensor.metricaid) {
      initializeMultipleMetricas([metricasensor.nodoid.toString()], [metricasensor.metricaid.toString()]);
    }
  };

  const handleReplicateNodo = (nodo: any) => {
    // Llenar el formulario con los datos del nodo seleccionado
    setFormData({
      nodo: nodo.nodo || '',
      deveui: nodo.deveui || '',
      appeui: nodo.appeui || '',
      appkey: nodo.appkey || '',
      atpin: nodo.atpin || '',
      statusid: nodo.statusid || 1
    });
  };

  const handleReplicateNodoForMetricaSensor = (nodo: any) => {
    // Activar modo replicación
    setIsReplicateMode(true);
    
    // Obtener todas las métricas sensor del nodo seleccionado
    const metricasDelNodo = tableData.filter(metrica => metrica.nodoid === nodo.nodoid);
    
    console.log('🔍 Replicando nodo para métricas sensor:', {
      nodo: nodo.nodo,
      nodoid: nodo.nodoid,
      metricasEncontradas: metricasDelNodo.length,
      metricas: metricasDelNodo
    });
    
    if (metricasDelNodo.length > 0) {
      // Configurar el nodo seleccionado
      setSelectedNodos([nodo.nodoid.toString()]);
      
      // Extraer todas las métricas únicas del nodo
      const metricasUnicas = Array.from(new Set(metricasDelNodo.map(metrica => metrica.metricaid)));
      setSelectedMetricas(metricasUnicas.map(id => id.toString()));
      
      // Inicializar métricas con todas las combinaciones del nodo
      initializeMultipleMetricas([nodo.nodoid.toString()], metricasUnicas.map(id => id.toString()));
    } else {
      // Si no hay métricas en el nodo, solo configurar el nodo
      setSelectedNodos([nodo.nodoid.toString()]);
      setSelectedMetricas([]);
    }
  };

  // Función para abrir el modal de replicación según el tipo de tabla
  const openReplicateModalForTable = async () => {
    let modalData = tableData;
    let modalTableName = selectedTable;
    let modalVisibleColumns = visibleColumns;
    
    console.log('🔍 openReplicateModalForTable - selectedTable:', selectedTable);
    console.log('🔍 openReplicateModalForTable - tableData:', tableData);
    console.log('🔍 openReplicateModalForTable - nodosData:', nodosData);
    
    // Para sensor, mostrar nodos únicos que tienen sensores
    if (selectedTable === 'sensor') {
      try {
        // Cargar datos de nodos directamente desde la API
        const nodosResponse = await JoySenseService.getTableData('nodo', 500);
        const nodos = Array.isArray(nodosResponse) ? nodosResponse : ((nodosResponse as any)?.data || []);
        
        console.log('🔍 nodos cargados desde API:', nodos);
        
        // Obtener nodos únicos que tienen sensores
        const nodosConSensores = Array.from(new Set(tableData.map(sensor => sensor.nodoid)))
          .map(nodoid => {
            const nodo = nodos.find((n: any) => n.nodoid === nodoid);
            return nodo;
          })
          .filter(nodo => nodo !== undefined);
        
        console.log('🔍 nodosConSensores:', nodosConSensores);
        
        modalData = nodosConSensores;
        modalTableName = 'nodo';
        // Crear columnas específicas para nodo
        modalVisibleColumns = [
          { columnName: 'nodo', dataType: 'varchar', isNullable: true, defaultValue: null, isIdentity: false, isPrimaryKey: false },
          { columnName: 'deveui', dataType: 'varchar', isNullable: true, defaultValue: null, isIdentity: false, isPrimaryKey: false },
          { columnName: 'statusid', dataType: 'integer', isNullable: true, defaultValue: null, isIdentity: false, isPrimaryKey: false }
        ];
        
        console.log('🔍 modalData final:', modalData);
        console.log('🔍 modalVisibleColumns final:', modalVisibleColumns);
      } catch (error) {
        console.error('Error loading nodos data:', error);
        // Fallback: usar nodosData si está disponible
        const nodosConSensores = Array.from(new Set(tableData.map(sensor => sensor.nodoid)))
          .map(nodoid => {
            const nodo = nodosData.find((n: any) => n.nodoid === nodoid);
            return nodo;
          })
          .filter(nodo => nodo !== undefined);
        
        modalData = nodosConSensores;
        modalTableName = 'nodo';
        // Crear columnas específicas para nodo
        modalVisibleColumns = [
          { columnName: 'nodo', dataType: 'varchar', isNullable: true, defaultValue: null, isIdentity: false, isPrimaryKey: false },
          { columnName: 'deveui', dataType: 'varchar', isNullable: true, defaultValue: null, isIdentity: false, isPrimaryKey: false },
          { columnName: 'statusid', dataType: 'integer', isNullable: true, defaultValue: null, isIdentity: false, isPrimaryKey: false }
        ];
      }
    } else if (selectedTable === 'metricasensor') {
      // Para metricasensor, mostrar nodos que tienen métricas sensor
      try {
        const nodosResponse = await JoySenseService.getTableData('nodo', 500);
        const nodos = Array.isArray(nodosResponse) ? nodosResponse : ((nodosResponse as any)?.data || []);
        
        const nodosConMetricas = Array.from(new Set(tableData.map(metrica => metrica.nodoid)))
          .map(nodoid => {
            const nodo = nodos.find((n: any) => n.nodoid === nodoid);
            return nodo;
          })
          .filter(nodo => nodo !== undefined);
        
        modalData = nodosConMetricas;
        modalTableName = 'nodo';
        modalVisibleColumns = [
          { columnName: 'nodo', dataType: 'varchar', isNullable: true, defaultValue: null, isIdentity: false, isPrimaryKey: false },
          { columnName: 'deveui', dataType: 'varchar', isNullable: true, defaultValue: null, isIdentity: false, isPrimaryKey: false },
          { columnName: 'statusid', dataType: 'integer', isNullable: true, defaultValue: null, isIdentity: false, isPrimaryKey: false }
        ];
      } catch (error) {
        console.error('Error loading nodos data for metricasensor:', error);
        // Fallback: usar nodosData si está disponible
        const nodosConMetricas = Array.from(new Set(tableData.map(metrica => metrica.nodoid)))
          .map(nodoid => {
            const nodo = nodosData.find((n: any) => n.nodoid === nodoid);
            return nodo;
          })
          .filter(nodo => nodo !== undefined);
        
        modalData = nodosConMetricas;
        modalTableName = 'nodo';
        modalVisibleColumns = [
          { columnName: 'nodo', dataType: 'varchar', isNullable: true, defaultValue: null, isIdentity: false, isPrimaryKey: false },
          { columnName: 'deveui', dataType: 'varchar', isNullable: true, defaultValue: null, isIdentity: false, isPrimaryKey: false },
          { columnName: 'statusid', dataType: 'integer', isNullable: true, defaultValue: null, isIdentity: false, isPrimaryKey: false }
        ];
      }
    }
    
    const options = {
      tableName: modalTableName,
      tableData: modalData,
      visibleColumns: modalVisibleColumns,
      relatedData: selectedTable === 'sensor' ? tableData : (selectedTable === 'metricasensor' ? tableData : []), // Pasar datos relacionados
      relatedColumns: selectedTable === 'sensor' ? columns : (selectedTable === 'metricasensor' ? [
        { columnName: 'nodoid', dataType: 'integer', isNullable: true, defaultValue: null, isIdentity: false, isPrimaryKey: false },
        { columnName: 'tipoid', dataType: 'integer', isNullable: true, defaultValue: null, isIdentity: false, isPrimaryKey: false },
        { columnName: 'metricaid', dataType: 'integer', isNullable: true, defaultValue: null, isIdentity: false, isPrimaryKey: false },
        { columnName: 'statusid', dataType: 'integer', isNullable: true, defaultValue: null, isIdentity: false, isPrimaryKey: false }
      ] : []), // Pasar columnas relacionadas con orden específico
      // Pasar datos adicionales para búsquedas de nombres
      nodosData: nodosData,
      tiposData: tiposData,
      metricasData: metricasData,
      originalTable: selectedTable, // Pasar la tabla original
      onReplicate: (entry: any) => {
        if (selectedTable === 'sensor') {
          handleReplicateSensor(entry);
        } else if (selectedTable === 'metricasensor') {
          // Para metricasensor, entry es un nodo, no una métrica sensor
          handleReplicateNodoForMetricaSensor(entry);
        } else if (selectedTable === 'nodo') {
          handleReplicateNodo(entry);
        }
      }
    };
    openReplicateModal(options);
  };

  // Estados para selección manual múltiple
  const [isMultipleSelectionMode, setIsMultipleSelectionMode] = useState(false);
  const [selectedRowsForManualUpdate, setSelectedRowsForManualUpdate] = useState<any[]>([]);

  const { findEntriesByTimestamp } = useMultipleSelection(selectedTable);
  const { getPaginatedData, goToPage, nextPage, prevPage, hasNextPage, hasPrevPage, currentPage, totalPages } = usePagination(updateData, itemsPerPage);

  // Función simple para verificar si hay cambios sin guardar
  const hasUnsavedChanges = (): boolean => {
    // Verificar pestaña "Crear"
    if (activeSubTab === 'insert') {
      return Object.keys(formData).some(key => {
        const value = formData[key];
        if (key === 'statusid') {
          return value !== 1;
        }
        return value !== '' && value !== null && value !== undefined;
      });
    }
    
    // Verificar pestaña "Actualizar"
    if (activeSubTab === 'update') {
      // Verificar si hay búsqueda activa
      if (searchField || searchTerm) {
        return true;
      }
      
      // Verificar si hay una fila seleccionada para actualizar
      if (selectedRowForUpdate) {
        return true;
      }
      
      // Verificar si hay múltiples filas seleccionadas para actualizar
      if (selectedRowsForUpdate.length > 0) {
        return true;
      }
      
      // Verificar si hay cambios en el formulario de actualización
      if (Object.keys(updateFormData).length > 0) {
        return true;
      }
    }
    
    
    return false;
  };

  // Función simple para manejar el cambio de tabla
  const handleTableChange = (newTable: string) => {
    setSelectedTable(newTable);
    
    // Limpiar todos los inputs y estados de búsqueda
    setSearchField('');
    setSearchTerm('');
    setHasSearched(false);
    setSelectedRowForUpdate(null);
    setSelectedRowsForUpdate([]);
    setUpdateFormData({});
    clearCopySelectionOnTableChange();
    setMessage(null);
    setUpdateMessage(null); // Limpiar mensajes de actualización al cambiar de tabla
    

    
    if (onTableSelect) {
      onTableSelect(newTable);
    }
  };

  // Función simple para manejar el cambio de tabla con confirmación
  const handleTableChangeWithConfirmation = (newTable: string) => {
    if (hasUnsavedChanges()) {
      setPendingTableChange(newTable);
    } else {
      handleTableChange(newTable);
    }
  };

  // Función para limpiar la selección de copiar
  const clearCopySelection = () => {
    setSelectedRowsForCopy([]);
    setCopySearchTerm('');
    setCopyFilteredData(copyData);
    setCopyCurrentPage(1);
    const copyItemsPerPage = (selectedTable === 'sensor' || selectedTable === 'metricasensor') ? 10 : 5;
    setCopyTotalPages(Math.ceil(copyData.length / copyItemsPerPage));
  };

  // Función para limpiar la selección de copiar cuando se cambia de tabla
  const clearCopySelectionOnTableChange = () => {
    setSelectedRowsForCopy([]);
    setCopySearchTerm('');
    setCopyFilteredData([]);
    setCopyCurrentPage(1);
    setCopyTotalPages(1);
  };

  // Función para limpiar la selección de copiar cuando se cambia de pestaña
  const clearCopySelectionOnTabChange = () => {
    setSelectedRowsForCopy([]);
    setCopySearchTerm('');
    setCopyFilteredData(copyData);
    setCopyCurrentPage(1);
    const copyItemsPerPage = (selectedTable === 'sensor' || selectedTable === 'metricasensor') ? 10 : 5;
    setCopyTotalPages(Math.ceil(copyData.length / copyItemsPerPage));
  };

  // Función para confirmar el cambio de tabla
  const confirmTableChange = () => {
    if (pendingTableChange) {
      handleTableChange(pendingTableChange);
      setPendingTableChange('');
    }
  };

  // Función para cancelar el cambio de tabla
  const cancelTableChange = () => {
    setPendingTableChange('');
  };

  // Cargar datos cuando se selecciona una tabla
  useEffect(() => {
    if (selectedTable) {
      loadTableData();
      loadTableInfo();
      loadTableConstraints();
      loadUpdateData();
      loadCopyData();
      setHasSearched(false);
      
    }
  }, [selectedTable]);

  // Cargar datos de usuario y tablas relacionadas
  useEffect(() => {
    loadUserData();
    loadRelatedTablesData();
  }, []);

  // Sincronizar con propSelectedTable
  useEffect(() => {
    if (propSelectedTable && propSelectedTable !== selectedTable) {
      handleTableChangeWithConfirmation(propSelectedTable);
    }
  }, [propSelectedTable]);

  // Sincronizar con propActiveSubTab
  useEffect(() => {
    if (propActiveSubTab && propActiveSubTab !== activeSubTab) {
      setActiveSubTab(propActiveSubTab);
    }
  }, [propActiveSubTab]);

  // Detectar cambios de pestaña y validar
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);



  const loadUserData = async () => {
    try {
      const response = await JoySenseService.getTableData('usuario', 1000);
      const data = Array.isArray(response) ? response : ((response as any)?.data || []);
      setUserData(data);
    } catch (error) {
      console.error('Error loading user data:', error);
      setUserData([]);
    }
  };

  const loadRelatedTablesData = async () => {
    try {
      console.log('🔄 Cargando datos de tablas relacionadas...');
      const startTime = performance.now();
      
             const [
         paisesResponse, 
         empresasResponse, 
         fundosResponse,
         ubicacionesResponse,
         entidadesResponse,
         nodosResponse,
         tiposResponse,
         metricasResponse,
         criticidadesResponse,
         perfilesResponse,
         umbralesResponse,
         mediosResponse
       ] = await Promise.all([
         JoySenseService.getTableData('pais', 500),
         JoySenseService.getTableData('empresa', 500),
         JoySenseService.getTableData('fundo', 500),
         JoySenseService.getTableData('ubicacion', 500),
         JoySenseService.getTableData('entidad', 500),
         JoySenseService.getTableData('nodo', 500),
         JoySenseService.getTableData('tipo', 500),
         JoySenseService.getTableData('metrica', 500),
         JoySenseService.getTableData('criticidad', 500),
         JoySenseService.getTableData('perfil', 500),
         JoySenseService.getTableData('umbral', 500),
         JoySenseService.getTableData('medio', 500)
       ]);
      
      const paises = Array.isArray(paisesResponse) ? paisesResponse : ((paisesResponse as any)?.data || []);
      const empresas = Array.isArray(empresasResponse) ? empresasResponse : ((empresasResponse as any)?.data || []);
      const fundos = Array.isArray(fundosResponse) ? fundosResponse : ((fundosResponse as any)?.data || []);
      const ubicaciones = Array.isArray(ubicacionesResponse) ? ubicacionesResponse : ((ubicacionesResponse as any)?.data || []);
      const entidades = Array.isArray(entidadesResponse) ? entidadesResponse : ((entidadesResponse as any)?.data || []);
      const nodos = Array.isArray(nodosResponse) ? nodosResponse : ((nodosResponse as any)?.data || []);
             const tipos = Array.isArray(tiposResponse) ? tiposResponse : ((tiposResponse as any)?.data || []);
       const metricas = Array.isArray(metricasResponse) ? metricasResponse : ((metricasResponse as any)?.data || []);
       const criticidades = Array.isArray(criticidadesResponse) ? criticidadesResponse : ((criticidadesResponse as any)?.data || []);
       const perfiles = Array.isArray(perfilesResponse) ? perfilesResponse : ((perfilesResponse as any)?.data || []);
       const umbrales = Array.isArray(umbralesResponse) ? umbralesResponse : ((umbralesResponse as any)?.data || []);
       const medios = Array.isArray(mediosResponse) ? mediosResponse : ((mediosResponse as any)?.data || []);
       
       setPaisesData(paises);
       setEmpresasData(empresas);
       setFundosData(fundos);
       setUbicacionesData(ubicaciones);
       setEntidadesData(entidades);
       setNodosData(nodos);
       setTiposData(tipos);
       setMetricasData(metricas);
       setCriticidadesData(criticidades);
       setPerfilesData(perfiles);
       setUmbralesData(umbrales);
       setMediosData(medios);
      
      const endTime = performance.now();
      console.log(`✅ Datos de tablas relacionadas cargados en ${(endTime - startTime).toFixed(2)}ms`);
    } catch (error) {
      console.error('Error loading related tables data:', error);
    }
  };

  const loadTableData = async () => {
    if (!selectedTable) return;
    
    try {
      setLoading(true);
      console.log(`🔄 Cargando datos de la tabla: ${selectedTable}`);
      const startTime = performance.now();
      
             // Primero cargar las columnas
       const cols = await JoySenseService.getTableColumns(selectedTable);
       setColumns(cols || []);
      
      // Inicializar formData
      const initialFormData: Record<string, any> = {};
      cols?.forEach(col => {
        if (col.columnName === 'statusid') {
          initialFormData[col.columnName] = 1;
        } else if (!col.isIdentity && !['datecreated', 'datemodified', 'usercreatedid', 'usermodifiedid', 'modified_by', 'modified_at', 'medioid', 'contactoid', 'usuarioid', 'perfilid', 'criticidadid'].includes(col.columnName)) {
          initialFormData[col.columnName] = col.defaultValue || '';
        }
      });
      setFormData(initialFormData);
      
      // Cargar datos con paginación para tablas grandes
      const dataResponse = await JoySenseService.getTableData(selectedTable, 1000);
      const data = Array.isArray(dataResponse) ? dataResponse : ((dataResponse as any)?.data || []);
      setTableData(data);
      
             // Los datos filtrados se aplicarán automáticamente por el hook useGlobalFilterEffect
       // Inicializar paginación para la tabla de Estado
       setStatusCurrentPage(1);
       setStatusSearchTerm('');
      
      const endTime = performance.now();
      console.log(`✅ Datos de ${selectedTable} cargados en ${(endTime - startTime).toFixed(2)}ms (${data.length} registros)`);
      
    } catch (error) {
      console.error('Error loading table data:', error);
      setMessage({ type: 'error', text: 'Error cargando datos de la tabla' });
    } finally {
      setLoading(false);
    }
  };

  const loadTableInfo = async () => {
    if (!selectedTable) return;
    
    try {
      const [tableDataResponse, tableInfo] = await Promise.all([
        JoySenseService.getTableData(selectedTable, 1),
        JoySenseService.getTableInfoByName(selectedTable)
      ]);
      
      const tableData = Array.isArray(tableDataResponse) ? tableDataResponse : ((tableDataResponse as any)?.data || []);
      
      // Determinar la clave primaria basada en la tabla
      let primaryKey = 'id';
      let hasCompositeKey = false;
      
      if (selectedTable === 'localizacion') {
        primaryKey = 'ubicacionid,nodoid'; // Clave primaria compuesta
        hasCompositeKey = true;
      } else if (selectedTable === 'sensor') {
        primaryKey = 'nodoid,tipoid'; // Clave primaria compuesta
        hasCompositeKey = true;
      } else if (selectedTable === 'perfilumbral') {
        primaryKey = 'perfilid,umbralid'; // Clave primaria compuesta
        hasCompositeKey = true;
      } else if (selectedTable === 'usuarioperfil') {
        primaryKey = 'usuarioid,perfilid'; // Clave primaria compuesta
        hasCompositeKey = true;
      } else {
        // Buscar la columna que termina en 'id' y no es clave foránea
        const idColumn = columns.find(col => 
          col.columnName.endsWith('id') && 
          !['paisid', 'empresaid', 'fundoid', 'ubicacionid', 'entidadid', 'nodoid', 'tipoid', 'metricaid', 'criticidadid', 'perfilid', 'umbralid', 'usuarioid', 'medioid', 'usercreatedid', 'usermodifiedid', 'statusid'].includes(col.columnName)
        );
        primaryKey = idColumn ? idColumn.columnName : 'id';
      }

      const adaptedInfo: TableInfo = {
        tableName: selectedTable,
        displayName: selectedTable,
        description: `Tabla ${selectedTable}`,
        primaryKey: primaryKey,
        hasCompositeKey: hasCompositeKey,
        fields: columns
      };
      setTableInfo(adaptedInfo);
    } catch (error) {
      console.error('Error loading table info:', error);
      // Determinar la clave primaria para el caso de error
      let primaryKey = 'id';
      let hasCompositeKey = false;
      
      if (selectedTable === 'localizacion') {
        primaryKey = 'ubicacionid,nodoid';
        hasCompositeKey = true;
      } else if (selectedTable === 'sensor') {
        primaryKey = 'nodoid,tipoid';
        hasCompositeKey = true;
      } else if (selectedTable === 'perfilumbral') {
        primaryKey = 'perfilid,umbralid';
        hasCompositeKey = true;
      } else if (selectedTable === 'usuarioperfil') {
        primaryKey = 'usuarioid,perfilid';
        hasCompositeKey = true;
      }

      const defaultInfo: TableInfo = {
        tableName: selectedTable,
        displayName: selectedTable,
        description: `Tabla ${selectedTable}`,
        primaryKey: primaryKey,
        hasCompositeKey: hasCompositeKey,
        fields: []
      };
      setTableInfo(defaultInfo);
    }
  };

  const loadTableConstraints = async () => {
    if (!selectedTable) return;
    
    try {
      const constraints = await JoySenseService.getTableConstraints(selectedTable);
      setTableConstraints(constraints);
    } catch (error) {
      console.error('Error loading table constraints:', error);
    }
  };

       const loadUpdateData = async () => {
    if (!selectedTable) return;
    
    try {
      // Para actualizar, cargar todos los datos de la tabla (como en copiar)
      const response = await JoySenseService.getTableData(selectedTable, 1000);
      const data = Array.isArray(response) ? response : ((response as any)?.data || []);
      setUpdateData(data);
    } catch (error) {
      console.error('Error loading update data:', error);
      setUpdateMessage({ type: 'error', text: 'Error cargando datos para actualizar' });
    }
  };

  const loadCopyData = async () => {
    if (!selectedTable) return;
    
    try {
      // Para copiar, cargar todos los datos de la tabla
      const response = await JoySenseService.getTableData(selectedTable, 1000);
      const data = Array.isArray(response) ? response : ((response as any)?.data || []);
      setCopyData(data);
      setCopyFilteredData(data);
      const copyItemsPerPage = (selectedTable === 'sensor' || selectedTable === 'metricasensor') ? 10 : 5;
      setCopyTotalPages(Math.ceil(data.length / copyItemsPerPage));
      setCopyCurrentPage(1);
      setCopySearchTerm('');
    } catch (error) {
      console.error('Error loading copy data:', error);
      setMessage({ type: 'error', text: 'Error cargando datos para copiar' });
    }
  };

  const getUserName = (userId: number) => {
    const user = userData.find(u => u.usuarioid === userId);
    if (user) {
      return `${user.firstname} ${user.lastname}`;
    }
    return `Usuario ${userId}`;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return dateString;
    }
  };

  const getCurrentUserId = () => {
    if (!user || !user.email) return 1;
    const currentUser = userData.find(u => u.email === user.email || u.login === user.email);
    return currentUser?.usuarioid || 1;
  };

  // Función para obtener el valor de visualización (nombres en lugar de IDs)
  // Función para validar datos antes de insertar
  const validateInsertData = (tableName: string, data: any): string | null => {
    if (tableName === 'sensor') {
      if (!data.nodoid) return 'Debe seleccionar un nodo';
      if (!data.tipoid) return 'Debe seleccionar un tipo';
    } else if (tableName === 'metricasensor') {
      if (!data.nodoid) return 'Debe seleccionar un nodo';
      if (!data.metricaid) return 'Debe seleccionar una métrica';
      if (!data.tipoid) return 'Debe seleccionar un tipo';
    }
    return null;
  };

  const getDisplayValue = (row: any, columnName: string) => {
    // Validar que row no sea null o undefined
    if (!row) {
      console.warn('⚠️ getDisplayValue: row is null or undefined');
      return 'N/A';
    }

    // Mapeo de campos de ID a sus tablas relacionadas y campos de nombre
    const idToNameMapping: Record<string, { table: string; nameField: string }> = {
      'paisid': { table: 'pais', nameField: 'pais' },
      'empresaid': { table: 'empresa', nameField: 'empresa' },
      'fundoid': { table: 'fundo', nameField: 'fundo' },
      'ubicacionid': { table: 'ubicacion', nameField: 'ubicacion' },
      'entidadid': { table: 'entidad', nameField: 'entidad' },
      'nodoid': { table: 'nodo', nameField: 'nodo' },
      'tipoid': { table: 'tipo', nameField: 'tipo' },
      'metricaid': { table: 'metrica', nameField: 'metrica' },
      'localizacionid': { table: 'localizacion', nameField: 'localizacionid' },
      'criticidadid': { table: 'criticidad', nameField: 'criticidad' },
      'perfilid': { table: 'perfil', nameField: 'perfil' },
      'umbralid': { table: 'umbral', nameField: 'umbral' },
      'usuarioid': { table: 'usuario', nameField: 'login' },
      'medioid': { table: 'medio', nameField: 'nombre' },
      'old_criticidadid': { table: 'criticidad', nameField: 'criticidad' },
      'new_criticidadid': { table: 'criticidad', nameField: 'criticidad' }
    };

    // Si es un campo de ID, buscar el nombre en los datos de las tablas relacionadas
    if (idToNameMapping[columnName]) {
      const mapping = idToNameMapping[columnName];
      const idValue = row[columnName];
      
      if (idValue) {
        // Buscar en los datos de la tabla relacionada
        let relatedData: any[] = [];
        switch (mapping.table) {
          case 'pais':
            relatedData = paisesData || [];
            break;
          case 'empresa':
            relatedData = empresasData || [];
            break;
          case 'fundo':
            relatedData = fundosData || [];
            break;
          case 'ubicacion':
            relatedData = ubicacionesData || [];
            break;
          case 'entidad':
            relatedData = entidadesData || [];
            break;
          case 'nodo':
            relatedData = nodosData || [];
            break;
          case 'tipo':
            relatedData = tiposData || [];
            break;
                     case 'metrica':
            relatedData = metricasData || [];
             break;
           case 'localizacion':
             relatedData = []; // Por ahora vacío
             break;
           case 'criticidad':
             relatedData = criticidadesData || [];
             console.log('🔍 getDisplayValue - criticidad:', { idValue, criticidadesData: criticidadesData?.length, relatedData: relatedData?.length });
             break;
           case 'perfil':
             relatedData = perfilesData || [];
             console.log('🔍 getDisplayValue - perfil:', { idValue, perfilesData: perfilesData?.length, relatedData: relatedData?.length });
             break;
           case 'umbral':
             relatedData = umbralesData || [];
             console.log('🔍 getDisplayValue - umbral:', { idValue, umbralesData: umbralesData?.length, relatedData: relatedData?.length });
             break;
           case 'usuario':
             relatedData = userData || [];
             console.log('🔍 getDisplayValue - usuario:', { idValue, userData: userData?.length, relatedData: relatedData?.length });
             break;
           case 'medio':
             relatedData = mediosData || [];
             console.log('🔍 getDisplayValue - medio:', { idValue, mediosData: mediosData?.length, relatedData: relatedData?.length, selectedTable });
             break;
           case 'old_criticidadid':
           case 'new_criticidadid':
             relatedData = criticidadesData || [];
             console.log('🔍 getDisplayValue - criticidad (old/new):', { idValue, criticidadesData: criticidadesData?.length, relatedData: relatedData?.length });
             break;
        }
        
        // Buscar el registro que coincida con el ID
        const relatedRecord = relatedData.find(item => {
          const idField = `${mapping.table}id`;
          return item && item[idField] === idValue;
        });
        
        if (relatedRecord && relatedRecord[mapping.nameField]) {
          return relatedRecord[mapping.nameField];
        }
      }
    }

    // Si no es un campo de ID o no existe la relación, mostrar el valor original
    return row[columnName];
  };



  const handleInsert = async () => {
    if (!selectedTable || !user) return;
    
    // Validar datos antes de insertar
    const validationError = validateInsertData(selectedTable, formData);
    if (validationError) {
      setMessage({ type: 'error', text: validationError });
      return;
    }
    
    try {
      setLoading(true);
      
      const preparedData = { ...formData };
      const usuarioid = getCurrentUserId();
      
      preparedData.usercreatedid = usuarioid;
      preparedData.usermodifiedid = usuarioid;
      preparedData.datecreated = new Date().toISOString();
      preparedData.datemodified = new Date().toISOString();

      // Filtrar datos según la tabla para evitar errores de columnas inexistentes
      let filteredData = { ...preparedData };
      
      // Filtrar campos problemáticos según la tabla
      if (selectedTable === 'ubicacion') {
        filteredData = {
          ubicacion: preparedData.ubicacion,
          ubicacionabrev: preparedData.ubicacionabrev,
          fundoid: preparedData.fundoid,
          statusid: preparedData.statusid,
          usercreatedid: preparedData.usercreatedid,
          usermodifiedid: preparedData.usermodifiedid,
          datecreated: preparedData.datecreated,
          datemodified: preparedData.datemodified
        };
      } else if (selectedTable === 'tipo') {
        filteredData = {
          tipo: preparedData.tipo,
          entidadid: preparedData.entidadid,
          statusid: preparedData.statusid,
          usercreatedid: preparedData.usercreatedid,
          usermodifiedid: preparedData.usermodifiedid,
          datecreated: preparedData.datecreated,
          datemodified: preparedData.datemodified
        };
      } else if (selectedTable === 'perfil') {
        filteredData = {
          perfil: preparedData.perfil,
          nivel: preparedData.nivel,
          statusid: preparedData.statusid,
          usercreatedid: preparedData.usercreatedid,
          usermodifiedid: preparedData.usermodifiedid,
          datecreated: preparedData.datecreated,
          datemodified: preparedData.datemodified
        };
      } else if (selectedTable === 'umbral') {
        filteredData = {
          umbral: preparedData.umbral,
          maximo: preparedData.maximo,
          minimo: preparedData.minimo,
          ubicacionid: preparedData.ubicacionid,
          criticidadid: preparedData.criticidadid,
          nodoid: preparedData.nodoid,
          metricaid: preparedData.metricaid,
          tipoid: preparedData.tipoid,
          statusid: preparedData.statusid,
          usercreatedid: preparedData.usercreatedid,
          usermodifiedid: preparedData.usermodifiedid,
          datecreated: preparedData.datecreated,
          datemodified: preparedData.datemodified
        };
      } else if (selectedTable === 'criticidad') {
        filteredData = {
          criticidad: preparedData.criticidad,
          criticidadbrev: preparedData.criticidadbrev,
          statusid: preparedData.statusid,
          usercreatedid: preparedData.usercreatedid,
          usermodifiedid: preparedData.usermodifiedid,
          datecreated: preparedData.datecreated,
          datemodified: preparedData.datemodified
        };
      } else if (selectedTable === 'medio') {
        filteredData = {
          nombre: preparedData.nombre,
          statusid: preparedData.statusid,
          usercreatedid: preparedData.usercreatedid,
          usermodifiedid: preparedData.usermodifiedid,
          datecreated: preparedData.datecreated,
          datemodified: preparedData.datemodified
        };
      } else if (selectedTable === 'contacto') {
        filteredData = {
          usuarioid: preparedData.usuarioid,
          medioid: preparedData.medioid,
          celular: preparedData.celular,
          correo: preparedData.correo,
          statusid: preparedData.statusid,
          usercreatedid: preparedData.usercreatedid,
          usermodifiedid: preparedData.usermodifiedid,
          datecreated: preparedData.datecreated,
          datemodified: preparedData.datemodified
        };
      } else if (selectedTable === 'usuario') {
        filteredData = {
          login: preparedData.login,
          lastname: preparedData.lastname,
          firstname: preparedData.firstname,
          statusid: preparedData.statusid,
          usercreatedid: preparedData.usercreatedid,
          usermodifiedid: preparedData.usermodifiedid,
          datecreated: preparedData.datecreated,
          datemodified: preparedData.datemodified,
          auth_user_id: preparedData.auth_user_id
        };
      }
      // Para otras tablas, usar todos los datos

      // Logging específico para debugging
      console.log('🔍 Frontend: Datos a enviar para inserción:', JSON.stringify(filteredData, null, 2));
      console.log('🔍 Frontend: Tabla destino:', selectedTable);
      console.log('🔍 Frontend: Usuario ID:', usuarioid);

      await JoySenseService.insertTableRow(selectedTable, filteredData);
      
      // Agregar el registro insertado al sistema de mensajes
      addInsertedRecord(preparedData);
      
      loadTableData();
      loadTableInfo();
      loadCopyData();
      // Recargar datos relacionados para que aparezcan en comboboxes
      loadRelatedTablesData();
      
      // Reinicializar formulario
      const initialFormData: Record<string, any> = {};
      columns.forEach(col => {
        if (col.columnName === 'statusid') {
          initialFormData[col.columnName] = 1;
        } else if (!col.isIdentity && !['datecreated', 'datemodified', 'usercreatedid', 'usermodifiedid', 'modified_by', 'modified_at', 'medioid', 'contactoid', 'usuarioid', 'perfilid', 'criticidadid'].includes(col.columnName)) {
          initialFormData[col.columnName] = col.defaultValue || '';
        }
      });
      setFormData(initialFormData);
      
    } catch (error: any) {
      const errorResponse = handleInsertError(error);
      setMessage({ type: errorResponse.type, text: errorResponse.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchTermChange = (term: string) => {
    setSearchTerm(term);
    if (term.trim()) {
      setHasSearched(true);
      // Para "Actualizar", usar búsqueda simple como en "Estado"
      // Filtrar los datos localmente en lugar de hacer llamadas al backend
      const filtered = filteredTableData.filter(row => {
        return visibleColumns.some(col => {
          const value = row[col.columnName];
          if (value === null || value === undefined) return false;
          
          const displayValue = col.columnName === 'usercreatedid' || col.columnName === 'usermodifiedid' || col.columnName === 'modified_by'
            ? getUserName(value)
            : col.columnName === 'statusid'
            ? (value === 1 ? 'Activo' : 'Inactivo')
            : getDisplayValue(row, col.columnName);
          
          return displayValue.toString().toLowerCase().includes(term.toLowerCase());
        });
      });
      
             setUpdateData(filtered);
       // Las variables de paginación se manejan en el hook usePagination
    } else {
      setHasSearched(false);
      // Cargar datos originales sin filtro
      loadUpdateData();
    }
  };

  // Función para manejar el cambio de campo de búsqueda
  const handleSearchFieldChange = (field: string) => {
    setSearchField(field);
    // Limpiar término de búsqueda y resetear tabla cuando se cambia el campo
    setSearchTerm('');
    setHasSearched(false);
    // setFilteredEquivalences([]); // Limpiar filtro de equivalencias
    // setEquivalenceViewMode('table'); // Resetear modo de vista
    loadUpdateData();
  };

  const handlePageChange = (page: number) => {
    // Siempre usar paginación local del hook (ya que cargamos todos los datos)
    goToPage(page);
  };

  // Función para manejar la búsqueda en la tabla de Estado
  const handleStatusSearch = (searchTerm: string) => {
    setStatusSearchTerm(searchTerm);
    setStatusCurrentPage(1); // Resetear a la primera página
    
    if (!searchTerm.trim()) {
      setStatusFilteredData(filteredTableData);
      setStatusTotalPages(Math.ceil(filteredTableData.length / itemsPerPage));
      return;
    }
    
    console.log('🔍 Búsqueda en Estado:', { searchTerm, totalRows: filteredTableData.length });
    
    const filtered = filteredTableData.filter(row => {
      return visibleColumns.some(col => {
        const value = row[col.columnName];
        if (value === null || value === undefined) return false;
        
        const displayValue = col.columnName === 'usercreatedid' || col.columnName === 'usermodifiedid' || col.columnName === 'modified_by'
          ? getUserName(value)
          : col.columnName === 'statusid'
          ? (value === 1 ? 'Activo' : 'Inactivo')
          : getDisplayValue(row, col.columnName);
        
        const matches = displayValue.toString().toLowerCase().includes(searchTerm.toLowerCase());
        
        // Log para debugging del nodo
        if (col.columnName === 'nodoid' && matches) {
          console.log('🎯 Nodo encontrado:', { 
            nodoid: value, 
            displayValue, 
            searchTerm, 
            row: { nodoid: row.nodoid, metricaid: row.metricaid, tipoid: row.tipoid }
          });
        }
        
        return matches;
      });
    });
    
    console.log('📊 Resultado de búsqueda:', { searchTerm, found: filtered.length, total: filteredTableData.length });
    setStatusFilteredData(filtered);
    setStatusTotalPages(Math.ceil(filtered.length / itemsPerPage));
  };

  // Función para manejar la búsqueda en la tabla de Copiar
  const handleCopySearch = (searchTerm: string) => {
    setCopySearchTerm(searchTerm);
    setCopyCurrentPage(1); // Resetear a la primera página
    
    if (!searchTerm.trim()) {
      setCopyFilteredData(copyData);
      const copyItemsPerPage = (selectedTable === 'sensor' || selectedTable === 'metricasensor') ? 10 : 5;
      setCopyTotalPages(Math.ceil(copyData.length / copyItemsPerPage));
      return;
    }
    
    const filtered = copyData.filter(row => {
      return visibleColumns.some(col => {
        const value = row[col.columnName];
        if (value === null || value === undefined) return false;
        
        const displayValue = col.columnName === 'usercreatedid' || col.columnName === 'usermodifiedid' || col.columnName === 'modified_by'
          ? getUserName(value)
          : col.columnName === 'statusid'
          ? (value === 1 ? 'Activo' : 'Inactivo')
          : getDisplayValue(row, col.columnName);
        
        return displayValue.toString().toLowerCase().includes(searchTerm.toLowerCase());
      });
    });
    
    setCopyFilteredData(filtered);
    const copyItemsPerPage = (selectedTable === 'sensor' || selectedTable === 'metricasensor') ? 10 : 5;
    setCopyTotalPages(Math.ceil(filtered.length / copyItemsPerPage));
  };

  // Función para cambiar página en la tabla de Estado
  const handleStatusPageChange = (page: number) => {
    setStatusCurrentPage(page);
  };

  // Función para cambiar página en la tabla de Copiar
  const handleCopyPageChange = (page: number) => {
    setCopyCurrentPage(page);
  };

  // Función para obtener los datos paginados de la tabla de Estado
  const getStatusPaginatedData = () => {
    const startIndex = (statusCurrentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return statusFilteredData.slice(startIndex, endIndex);
  };

  // Función para obtener los datos paginados de la tabla de Actualizar
  const getUpdatePaginatedData = () => {
    return getPaginatedData();
  };

  // Función para obtener los datos paginados de la tabla de Copiar
  const getCopyPaginatedData = () => {
    const copyItemsPerPage = (selectedTable === 'sensor' || selectedTable === 'metricasensor') ? 10 : 5;
    const startIndex = (copyCurrentPage - 1) * copyItemsPerPage;
    const endIndex = startIndex + copyItemsPerPage;
    return copyFilteredData.slice(startIndex, endIndex);
  };

  const handleSelectRowForUpdate = (row: any) => {
    // Usar el hook personalizado para encontrar entradas múltiples
    const selectedEntries = findEntriesByTimestamp(row, tableData, updateData);
    
    // Para sensor y metricasensor, verificar si ya hay entradas seleccionadas
    if (selectedTable === 'sensor' || selectedTable === 'metricasensor') {
      const hasSameTimestamp = selectedRowsForUpdate.some(selectedRow => {
        if (selectedTable === 'sensor') {
          return selectedRow.nodoid === row.nodoid && selectedRow.datecreated === row.datecreated;
        } else if (selectedTable === 'metricasensor') {
          return selectedRow.nodoid === row.nodoid && selectedRow.datecreated === row.datecreated;
        }
        return false;
      });
      
      if (hasSameTimestamp) {
        // Deseleccionar todas las entradas con el mismo timestamp
        setSelectedRowsForUpdate([]);
        setUpdateFormData({});
        setMessage({ type: 'success', text: 'Selección cancelada' });
        return;
      }
      
      setSelectedRowsForUpdate(selectedEntries);
      
      // Crear formulario con datos del primer nodo (para mostrar valores comunes)
      const firstRow = selectedEntries[0];
      const newFormData: Record<string, any> = {};
      columns.forEach(col => {
        if (!col.isIdentity && !['datecreated', 'datemodified', 'usercreatedid', 'usermodifiedid'].includes(col.columnName)) {
          newFormData[col.columnName] = firstRow[col.columnName] || '';
        }
      });
      setUpdateFormData(newFormData);
      
      setMessage({ 
        type: 'success', 
        text: `${selectedEntries.length} entradas del nodo con timestamp ${new Date(row.datecreated).toLocaleString()} seleccionadas para actualizar` 
      });
      return;
    }
    
    // Para otras tablas, comportamiento normal (una sola fila)
    if (selectedRowForUpdate === row) {
      setSelectedRowForUpdate(null);
      setUpdateFormData({});
      setMessage({ type: 'success', text: 'Selección cancelada' });
      return;
    }
    
    setSelectedRowForUpdate(row);
    
    const newFormData: Record<string, any> = {};
    columns.forEach(col => {
      if (!col.isIdentity && !['datecreated', 'datemodified', 'usercreatedid', 'usermodifiedid'].includes(col.columnName)) {
        newFormData[col.columnName] = row[col.columnName] || '';
      }
    });
    
    // Agregar el ID de la fila para poder actualizarla
    const rowId = getRowId(row, selectedTable);
    if (rowId) {
      // Para tablas con claves compuestas
      if (selectedTable === 'localizacion') {
        newFormData['ubicacionid'] = row['ubicacionid'];
        newFormData['nodoid'] = row['nodoid'];
        newFormData['entidadid'] = row['entidadid'];
      } else if (selectedTable === 'sensor') {
        newFormData['nodoid'] = row['nodoid'];
        newFormData['tipoid'] = row['tipoid'];
      } else if (selectedTable === 'metricasensor') {
        newFormData['nodoid'] = row['nodoid'];
        newFormData['metricaid'] = row['metricaid'];
        newFormData['tipoid'] = row['tipoid'];
      } else {
        // Para tablas simples, agregar el campo ID
        const idMapping: Record<string, string> = {
          'pais': 'paisid',
          'empresa': 'empresaid',
          'fundo': 'fundoid',
          'ubicacion': 'ubicacionid',
          'entidad': 'entidadid',
          'nodo': 'nodoid',
          'tipo': 'tipoid',
          'metrica': 'metricaid',
          'usuario': 'usuarioid',
          'umbral': 'umbralid',
          'perfilumbral': 'perfilumbralid',
          'audit_log_umbral': 'auditid',
          'criticidad': 'criticidadid',
          'perfil': 'perfilid',
          'usuarioperfil': 'usuarioperfilid',
          'contacto': 'contactoid',
          'medio': 'medioid'
        };
        
        if (idMapping[selectedTable]) {
          newFormData[idMapping[selectedTable]] = row[idMapping[selectedTable]];
        }
      }
    }
    
    console.log('🔍 Debug - handleSelectRowForUpdate:', {
      row,
      selectedTable,
      newFormData,
      rowId,
      rowKeys: Object.keys(row)
    });
    
    setUpdateFormData(newFormData);
  };

  const handleSelectRowForCopy = (row: any) => {
    setSelectedRowsForCopy(prev => {
      const isSelected = prev.some(selectedRow => {
        // Para sensor y metricasensor, comparar por la clave compuesta
        if (selectedTable === 'sensor') {
          return selectedRow.nodoid === row.nodoid && selectedRow.tipoid === row.tipoid;
        } else if (selectedTable === 'metricasensor') {
          return selectedRow.nodoid === row.nodoid && selectedRow.metricaid === row.metricaid && selectedRow.tipoid === row.tipoid;
        } else if (selectedTable === 'nodo') {
          // Para nodo, usar nodoid
          return selectedRow.nodoid === row.nodoid;
        }
        // Para otras tablas, usar el ID principal
        const idField = getRowId(selectedRow, selectedTable);
        const rowId = getRowId(row, selectedTable);
        return idField === rowId;
      });
      
      if (isSelected) {
        // Deseleccionar
        return prev.filter(selectedRow => {
          if (selectedTable === 'sensor') {
            return !(selectedRow.nodoid === row.nodoid && selectedRow.tipoid === row.tipoid);
          } else if (selectedTable === 'metricasensor') {
            return !(selectedRow.nodoid === row.nodoid && selectedRow.metricaid === row.metricaid && selectedRow.tipoid === row.tipoid);
          } else if (selectedTable === 'nodo') {
            return selectedRow.nodoid !== row.nodoid;
          }
          const idField = getRowId(selectedRow, selectedTable);
          const rowId = getRowId(row, selectedTable);
          return idField !== rowId;
        });
      } else {
        // Seleccionar
        return [...prev, row];
      }
    });
  };

  const handleCancelUpdate = () => {
    setCancelAction(() => () => {
    setSelectedRowForUpdate(null);
    setSelectedRowsForUpdate([]);
      setSelectedRowsForManualUpdate([]);
    setUpdateFormData({});
      setIsMultipleSelectionMode(false);
      setShowCancelModal(false);
    });
    setShowCancelModal(true);
  };

  const handleCopyToClipboard = () => {
    if (selectedRowsForCopy.length === 0) {
      setCopyMessage({ type: 'warning', text: 'No hay filas seleccionadas para copiar' });
      return;
    }

    try {
      // Preparar datos para copiar (excluir campos de auditoría)
      const dataToCopy = selectedRowsForCopy.map(row => {
        const cleanRow: any = {};
        visibleColumns.forEach(col => {
          if (!['datecreated', 'datemodified', 'usercreatedid', 'usermodifiedid', 'modified_by', 'modified_at'].includes(col.columnName)) {
            cleanRow[col.columnName] = row[col.columnName];
          }
        });
        return cleanRow;
      });

      // Convertir a JSON y copiar al portapapeles
      const jsonData = JSON.stringify(dataToCopy, null, 2);
      navigator.clipboard.writeText(jsonData).then(() => {
        setCopyMessage({ 
          type: 'success', 
          text: `${selectedRowsForCopy.length} fila(s) copiada(s) al portapapeles. Puedes pegarlas en "Crear" o "Actualizar".` 
        });
      }).catch(() => {
        // Fallback para navegadores que no soportan clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = jsonData;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopyMessage({ 
          type: 'success', 
          text: `${selectedRowsForCopy.length} fila(s) copiada(s) al portapapeles. Puedes pegarlas en "Crear" o "Actualizar".` 
        });
      });
    } catch (error) {
      console.error('Error copying data:', error);
      setCopyMessage({ type: 'error', text: 'Error al copiar datos' });
    }
  };

  const handleClearCopySelection = () => {
    setSelectedRowsForCopy([]);
    setCopyMessage({ type: 'success', text: 'Selección de copia limpiada' });
  };

  // Función para pegar datos del portapapeles en el formulario de inserción
  const handlePasteFromClipboardForInsert = async () => {
    try {
      const text = await navigator.clipboard.readText();
      console.log('📋 Datos del portapapeles para inserción:', text);
      
      const pastedData = JSON.parse(text);
      console.log('📋 Datos parseados para inserción:', pastedData);
      
      if (Array.isArray(pastedData) && pastedData.length > 0) {
        // Verificar que los datos sean de la tabla correcta
        const firstEntry = pastedData[0];
        const expectedFields = getExpectedFieldsForTable(selectedTable);
        
        if (!expectedFields.every(field => firstEntry.hasOwnProperty(field))) {
          setMessage({ 
            type: 'error', 
            text: `❌ Los datos copiados no parecen ser de la tabla ${selectedTable}. Asegúrate de haber copiado datos desde la pestaña "Copiar" de la tabla correcta.` 
          });
          return;
        }
        
        // Usar el primer registro como base para el formulario
        const newFormData: Record<string, any> = {};
        
        // Copiar campos relevantes (excluir campos de auditoría y IDs)
        Object.keys(firstEntry).forEach(key => {
          if (!['usercreatedid', 'usermodifiedid', 'datecreated', 'datemodified', 'modified_by', 'modified_at'].includes(key)) {
            // Para campos de ID, mantener el valor original
            if (key.endsWith('id') && key !== 'statusid') {
              newFormData[key] = firstEntry[key];
            } else if (key === 'statusid') {
              // Para status, usar el valor copiado
              newFormData[key] = firstEntry[key];
            } else {
              // Para otros campos, usar el valor copiado
              newFormData[key] = firstEntry[key];
            }
          }
        });
        
        setFormData(newFormData);
        
        setMessage({ 
          type: 'success', 
          text: `✅ Datos pegados exitosamente desde ${pastedData.length} registro(s) copiado(s). Puedes modificar los campos antes de guardar.` 
        });
      } else {
        setMessage({ 
          type: 'error', 
          text: '❌ No se pudieron parsear los datos del portapapeles. Asegúrate de haber copiado datos desde la pestaña "Copiar".' 
        });
      }
    } catch (error) {
      console.error('Error al pegar datos para inserción:', error);
      setMessage({ 
        type: 'error', 
        text: '❌ Error al pegar datos del portapapeles. Asegúrate de que hay datos válidos copiados desde la pestaña "Copiar".' 
      });
    }
  };

  // Función auxiliar para obtener los campos esperados para cada tabla
  const getExpectedFieldsForTable = (table: string): string[] => {
    switch (table) {
      case 'nodo':
        return ['nodo', 'deveui'];
      case 'pais':
        return ['pais'];
      case 'empresa':
        return ['empresa', 'paisid'];
      case 'fundo':
        return ['fundo', 'empresaid'];
      case 'ubicacion':
        return ['ubicacion', 'fundoid'];
      case 'entidad':
        return ['entidad'];
      case 'metrica':
        return ['metrica', 'unidad'];
      case 'tipo':
        return ['tipo', 'entidadid'];
      case 'sensor':
        return ['nodoid', 'tipoid'];
      case 'metricasensor':
        return ['nodoid', 'metricaid', 'tipoid'];
      case 'localizacion':
        return ['ubicacionid', 'nodoid'];
      default:
        return [];
    }
  };

    const getUniqueOptionsForField = (columnName: string) => {
    switch (columnName) {
      case 'paisid':
        return paisesData.map(pais => ({ value: pais.paisid, label: pais.pais }));
      case 'empresaid':
        return empresasData.map(empresa => ({ value: empresa.empresaid, label: empresa.empresa }));
      case 'fundoid':
        return fundosData.map(fundo => ({ value: fundo.fundoid, label: fundo.fundo }));
      case 'ubicacionid':
        return ubicacionesData.map(ubicacion => ({ value: ubicacion.ubicacionid, label: ubicacion.ubicacion }));
      case 'entidadid':
        return entidadesData.map(entidad => ({ value: entidad.entidadid, label: entidad.entidad }));
      case 'nodoid':
        return nodosData.map(nodo => ({ value: nodo.nodoid, label: nodo.nodo }));
      case 'tipoid':
        return tiposData.map(tipo => ({ value: tipo.tipoid, label: tipo.tipo }));
      case 'metricaid':
        return metricasData.map(metrica => ({ value: metrica.metricaid, label: metrica.metrica }));
      case 'localizacionid':
        return []; // Por ahora vacío, ya que localizacion se crea después del nodo
      case 'criticidadid':
        return criticidadesData.map(criticidad => ({ value: criticidad.criticidadid, label: criticidad.criticidad }));
      case 'perfilid':
        return perfilesData.map(perfil => ({ value: perfil.perfilid, label: perfil.perfil }));
      case 'umbralid':
        return umbralesData.map(umbral => ({ value: umbral.umbralid, label: umbral.umbral }));
      case 'usuarioid':
        return userData.map(user => ({ 
          value: user.usuarioid, 
          label: `${user.firstname} ${user.lastname}` 
        }));
      case 'medioid':
        return mediosData.map(medio => ({ value: medio.medioid, label: medio.nombre }));
      case 'usercreatedid':
      case 'usermodifiedid':
        return userData.map(user => ({ 
          value: user.usuarioid, 
          label: `${user.firstname} ${user.lastname}` 
        }));
      default:
        return [];
    }
  };

  const getRowId = (row: any, tableName: string) => {
    // Para tablas con claves compuestas, necesitamos construir un identificador único
    if (tableName === 'sensor') {
      // Para sensor, la clave compuesta es (nodoid, tipoid)
      if (row.nodoid !== undefined && row.tipoid !== undefined) {
        return `${row.nodoid}-${row.tipoid}`;
      }
    } else if (tableName === 'metricasensor') {
      // Para metricasensor, la clave compuesta es (nodoid, metricaid, tipoid)
      if (row.nodoid !== undefined && row.metricaid !== undefined && row.tipoid !== undefined) {
        return `${row.nodoid}-${row.metricaid}-${row.tipoid}`;
      }
    } else if (tableName === 'localizacion') {
      // Para localizacion, la clave compuesta es (ubicacionid, nodoid)
      if (row.ubicacionid !== undefined && row.nodoid !== undefined) {
        return `${row.ubicacionid}-${row.nodoid}`;
      }
    } else if (tableName === 'perfilumbral') {
      // Para perfilumbral, la clave compuesta es (perfilid, umbralid)
      if (row.perfilid !== undefined && row.umbralid !== undefined) {
        return `${row.perfilid}-${row.umbralid}`;
      }
    } else if (tableName === 'usuarioperfil') {
      // Para usuarioperfil, la clave compuesta es (usuarioid, perfilid)
      if (row.usuarioid !== undefined && row.perfilid !== undefined) {
        return `${row.usuarioid}-${row.perfilid}`;
      }
    }
    
    // Para otras tablas, usar el mapeo normal
    const idMapping: Record<string, string> = {
      'pais': 'paisid',
      'empresa': 'empresaid',
      'fundo': 'fundoid',
      'ubicacion': 'ubicacionid',
      'entidad': 'entidadid',
      'metrica': 'metricaid',
      'tipo': 'tipoid',
      'localizacion': 'localizacionid',
      'nodo': 'nodoid',
      'umbral': 'umbralid',
      'perfilumbral': 'perfilumbralid',
      'audit_log_umbral': 'auditid',
      'criticidad': 'criticidadid',
      'usuario': 'usuarioid',
      'perfil': 'perfilid',
      'usuarioperfil': 'usuarioperfilid',
      'contacto': 'contactoid',
      'medio': 'medioid'
    };
    
    const idField = idMapping[tableName];
    if (idField && row[idField] !== undefined) {
      return row[idField];
    }
    
    const idFields = Object.keys(row).filter(key => 
      key.endsWith('id') && 
      !['paisid', 'empresaid', 'fundoid', 'entidadid', 'metricaid', 'tipoid', 'localizacionid', 'nodoid', 'sensorid', 'ubicacionid', 'usercreatedid', 'usermodifiedid', 'statusid'].includes(key)
    );
    return idFields.length > 0 ? row[idFields[0]] : null;
  };

  const handleUpdate = async () => {
    if (!updateFormData || Object.keys(updateFormData).length === 0) {
      setUpdateMessage({ type: 'error', text: 'No hay datos para actualizar' });
      return;
    }

          try {
        setUpdateLoading(true);

      // Determinar qué entradas actualizar
      let rowsToUpdate: any[] = [];
      
      if (isMultipleSelectionMode && selectedRowsForManualUpdate.length > 0) {
        // Modo de selección manual múltiple
        rowsToUpdate = selectedRowsForManualUpdate;
        console.log('🔧 Actualizando entradas seleccionadas manualmente:', rowsToUpdate.length);
      } else if (selectedRowsForUpdate && selectedRowsForUpdate.length > 0) {
        // Modo de selección automática (legacy)
        rowsToUpdate = selectedRowsForUpdate;
        console.log('🔧 Actualizando entradas seleccionadas automáticamente:', rowsToUpdate.length);
      } else {
        // Modo de actualización individual
        rowsToUpdate = [updateFormData];
        console.log('🔧 Actualizando entrada individual');
      }

      console.log('📊 Total de entradas a actualizar:', rowsToUpdate.length);

      if (selectedTable === 'sensor' || selectedTable === 'metricasensor') {
        // Actualización múltiple para sensor y metricasensor
        // Ejecutar actualizaciones de forma secuencial para evitar conflictos de concurrencia
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < rowsToUpdate.length; i++) {
          const row = rowsToUpdate[i];
          const compositeKey = selectedTable === 'sensor' 
            ? { nodoid: row.nodoid, tipoid: row.tipoid }
            : { nodoid: row.nodoid, tipoid: row.tipoid, metricaid: row.metricaid };
          
          // Filtrar solo los campos que realmente necesitamos actualizar
          const fieldsToUpdate = ['statusid']; // Solo actualizar statusid por ahora
          const filteredUpdateData: Record<string, any> = {};
          fieldsToUpdate.forEach(field => {
            if (updateFormData[field] !== undefined) {
              filteredUpdateData[field] = updateFormData[field];
            }
          });
          
          console.log(`🔄 Actualizando ${selectedTable} ${i + 1}/${rowsToUpdate.length} con clave:`, compositeKey);
          console.log(`📊 Datos a actualizar (original):`, updateFormData);
          console.log(`📊 Datos filtrados para envío:`, filteredUpdateData);
          console.log(`📊 Fila original:`, row);
          console.log(`🔍 Verificando clave compuesta - nodoid: ${row.nodoid}, tipoid: ${row.tipoid}`);
          
          try {
            const result = await JoySenseService.updateTableRowByCompositeKey(
            selectedTable,
            compositeKey,
              filteredUpdateData
            );
            console.log(`✅ Actualización ${i + 1}/${rowsToUpdate.length} completada:`, result);
            successCount++;
          } catch (error) {
            console.error(`❌ Error en actualización ${i + 1}/${rowsToUpdate.length}:`, error);
            console.error(`❌ Clave que falló:`, compositeKey);
            console.error(`❌ Datos que fallaron:`, updateFormData);
            
            // Verificar si es un error de validación de negocio
            if (error instanceof Error && error.message.includes('HTTP error! status: 409')) {
              console.warn(`⚠️ Validación de negocio: No se pueden mezclar tipos de sensores de diferentes entidades en el mismo nodo`);
            }
            
            errorCount++;
            // Continuar con las siguientes actualizaciones
          }
          
          // Pequeña pausa entre actualizaciones para evitar conflictos
          if (i < rowsToUpdate.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
        
        console.log(`📊 Resumen: ${successCount} exitosas, ${errorCount} fallidas`);
        console.log('✅ Todas las actualizaciones procesadas');
        
        // Mostrar mensaje específico si hay errores de validación de negocio
        if (errorCount > 0) {
          const tableName = selectedTable === 'sensor' ? 'sensores' : 'métricas de sensor';
          const errorMessage = `⚠️ ${errorCount} actualizaciones fallaron. Esto puede deberse a que estás intentando mezclar tipos de ${tableName} de diferentes entidades (ej: Suelo y Maceta) en el mismo nodo. Cada nodo debe tener ${tableName} de una sola entidad.`;
          console.warn(errorMessage);
          alert(errorMessage);
        }
        
        // Mostrar mensaje final con detalles
        if (errorCount > 0) {
          setMessage({ 
            type: 'warning', 
            text: `⚠️ ${successCount} entradas actualizadas, ${errorCount} fallaron. Revisa la consola para detalles.` 
          });
        } else {
          setMessage({ 
            type: 'success', 
            text: `✅ ${successCount} entradas actualizadas exitosamente` 
          });
        }
        
        // Recargar datos después de actualización exitosa
        await loadUpdateData();
        await loadCopyData();
      } else {
        // Actualización individual para otras tablas
        const rowId = getRowId(updateFormData, selectedTable);
        console.log('🔍 Debug - updateFormData:', updateFormData);
        console.log('🔍 Debug - selectedTable:', selectedTable);
        console.log('🔍 Debug - rowId calculado:', rowId);
        
        if (!rowId) {
          setUpdateMessage({ type: 'error', text: 'No se pudo determinar el ID de la fila a actualizar' });
          setUpdateLoading(false);
          return;
        }
        
        let result;
        if (selectedTable === 'localizacion' || selectedTable === 'perfilumbral' || selectedTable === 'usuarioperfil') {
          // Para tablas con clave compuesta, usar clave compuesta
          let compositeKey: Record<string, any> | undefined;
          let filteredUpdateData: Record<string, any> = {};
          
          if (selectedTable === 'localizacion') {
            compositeKey = {
              ubicacionid: updateFormData.ubicacionid,
              nodoid: updateFormData.nodoid,
              entidadid: updateFormData.entidadid
            };
            // Filtrar solo campos válidos para localizacion
            const fieldsToUpdate = ['statusid'];
            fieldsToUpdate.forEach(field => {
              if (updateFormData[field] !== undefined) {
                filteredUpdateData[field] = updateFormData[field];
              }
            });
          } else if (selectedTable === 'perfilumbral') {
            compositeKey = {
              perfilid: updateFormData.perfilid,
              umbralid: updateFormData.umbralid
            };
            // Filtrar solo campos válidos para perfilumbral
            const fieldsToUpdate = ['statusid'];
            fieldsToUpdate.forEach(field => {
              if (updateFormData[field] !== undefined) {
                filteredUpdateData[field] = updateFormData[field];
              }
            });
          } else if (selectedTable === 'usuarioperfil') {
            compositeKey = {
              usuarioid: updateFormData.usuarioid,
              perfilid: updateFormData.perfilid
            };
            // Filtrar solo campos válidos para usuarioperfil
            const fieldsToUpdate = ['statusid'];
            fieldsToUpdate.forEach(field => {
              if (updateFormData[field] !== undefined) {
                filteredUpdateData[field] = updateFormData[field];
              }
            });
          }
          
          if (!compositeKey) {
            throw new Error(`No se pudo construir la clave compuesta para la tabla ${selectedTable}`);
          }

          console.log(`📊 Datos a actualizar (original):`, updateFormData);
          console.log(`📊 Datos filtrados para envío:`, filteredUpdateData);
          
          result = await JoySenseService.updateTableRowByCompositeKey(
            selectedTable,
            compositeKey,
            filteredUpdateData
          );
        } else {
          // Para otras tablas, usar ID simple
          // Filtrar solo los campos que realmente necesitamos actualizar
          const fieldsToUpdate = ['statusid']; // Solo actualizar statusid por ahora
          const filteredUpdateData: Record<string, any> = {};
          fieldsToUpdate.forEach(field => {
            if (updateFormData[field] !== undefined) {
              filteredUpdateData[field] = updateFormData[field];
            }
          });
          
          console.log(`📊 Datos a actualizar (original):`, updateFormData);
          console.log(`📊 Datos filtrados para envío:`, filteredUpdateData);
          
          result = await JoySenseService.updateTableRow(
            selectedTable,
            rowId,
            filteredUpdateData
          );
        }
        console.log('✅ Actualización individual completada:', result);
        
        // Recargar datos después de actualización exitosa
        await loadUpdateData();
        await loadCopyData();
        setUpdateMessage({ type: 'success', text: '✅ Entrada actualizada exitosamente' });
        
        // Cerrar el formulario después de actualizar exitosamente
        setSelectedRowForUpdate(null);
        setUpdateFormData({});
      }

      // Limpiar estados
      setUpdateFormData({});
      setSelectedRowsForUpdate([]);
      setSelectedRowsForManualUpdate([]);
      setIsMultipleSelectionMode(false);
      
      // Recargar datos
      await loadTableData();
      await loadCopyData();
      
    } catch (error) {
      console.error('Error updating multiple rows:', error);
      setMessage({ 
        type: 'error', 
        text: `Error al actualizar: ${error instanceof Error ? error.message : 'Error desconocido'}` 
      });
          } finally {
        setUpdateLoading(false);
      }
  };

  const getVisibleColumns = () => {
    // Para la tabla nodo, necesitamos incluir campos que están después de usercreatedid
    if (selectedTable === 'nodo') {
      const nodoColumns = columns.filter(col => {
        return ['nodo', 'deveui', 'statusid', 'appeui', 'appkey', 'atpin', 'usercreatedid', 'datecreated', 'usermodifiedid', 'datemodified'].includes(col.columnName);
      });
      
      // Reordenar los campos para que Status aparezca al final
      const reorderedColumns = [];
      
      // Primero: nodo, deveui
      reorderedColumns.push(...nodoColumns.filter(col => ['nodo', 'deveui'].includes(col.columnName)));
      
      // Segundo: appeui, appkey, atpin
      reorderedColumns.push(...nodoColumns.filter(col => ['appeui', 'appkey', 'atpin'].includes(col.columnName)));
      
      // Tercero: usercreatedid, datecreated, usermodifiedid, datemodified (campos de auditoría)
      reorderedColumns.push(...nodoColumns.filter(col => ['usercreatedid', 'datecreated', 'usermodifiedid', 'datemodified'].includes(col.columnName)));
      
      // Último: statusid (Status al final)
      reorderedColumns.push(...nodoColumns.filter(col => ['statusid'].includes(col.columnName)));
      
      return reorderedColumns;
    }
    
    // Para todas las demás tablas, incluir todos los campos de auditoría
    let filteredColumns = columns.filter(col => {
      if (selectedTable === 'pais') {
        return ['pais', 'paisabrev', 'statusid', 'usercreatedid', 'datecreated', 'usermodifiedid', 'datemodified'].includes(col.columnName);
      }
      
      if (selectedTable === 'empresa') {
        return ['paisid', 'empresa', 'empresabrev', 'statusid', 'usercreatedid', 'datecreated', 'usermodifiedid', 'datemodified'].includes(col.columnName);
      }
      
      if (selectedTable === 'fundo') {
        return ['empresaid', 'fundo', 'farmabrev', 'statusid', 'usercreatedid', 'datecreated', 'usermodifiedid', 'datemodified'].includes(col.columnName);
      }
      
      if (selectedTable === 'ubicacion') {
        return ['fundoid', 'ubicacion', 'ubicacionabrev', 'statusid', 'usercreatedid', 'datecreated', 'usermodifiedid', 'datemodified'].includes(col.columnName);
      }
      
      if (selectedTable === 'entidad') {
        return ['entidad', 'statusid', 'usercreatedid', 'datecreated', 'usermodifiedid', 'datemodified'].includes(col.columnName);
      }
      
      if (selectedTable === 'metrica') {
        return ['metrica', 'unidad', 'statusid', 'usercreatedid', 'datecreated', 'usermodifiedid', 'datemodified'].includes(col.columnName);
      }
      
      if (selectedTable === 'tipo') {
        return ['tipo', 'statusid', 'entidadid', 'usercreatedid', 'datecreated', 'usermodifiedid', 'datemodified'].includes(col.columnName);
      }
      
      if (selectedTable === 'localizacion') {
        return ['ubicacionid', 'nodoid', 'latitud', 'longitud', 'referencia', 'statusid', 'entidadid', 'usercreatedid', 'datecreated', 'usermodifiedid', 'datemodified'].includes(col.columnName);
      }
      
      if (selectedTable === 'sensor') {
        return ['nodoid', 'tipoid', 'statusid', 'usercreatedid', 'datecreated', 'usermodifiedid', 'datemodified'].includes(col.columnName);
      }
      
      if (selectedTable === 'metricasensor') {
        return ['nodoid', 'metricaid', 'tipoid', 'statusid', 'usercreatedid', 'datecreated', 'usermodifiedid', 'datemodified'].includes(col.columnName);
      }
      
      // NUEVAS TABLAS DE UMBRAL (ALERTAS)
      if (selectedTable === 'umbral') {
        return ['ubicacionid', 'criticidadid', 'nodoid', 'metricaid', 'umbral', 'maximo', 'minimo', 'tipoid', 'statusid', 'usercreatedid', 'datecreated', 'usermodifiedid', 'datemodified'].includes(col.columnName);
      }
      
      if (selectedTable === 'perfilumbral') {
        return ['perfilid', 'umbralid', 'statusid', 'usercreatedid', 'datecreated', 'usermodifiedid', 'datemodified'].includes(col.columnName);
      }
      
      if (selectedTable === 'audit_log_umbral') {
        return ['auditid', 'umbralid', 'old_minimo', 'new_minimo', 'old_maximo', 'new_maximo', 'old_criticidadid', 'new_criticidadid', 'modified_by', 'modified_at', 'accion'].includes(col.columnName);
      }
      
      if (selectedTable === 'criticidad') {
        return ['criticidad', 'criticidadbrev', 'statusid', 'usercreatedid', 'datecreated', 'usermodifiedid', 'datemodified'].includes(col.columnName);
      }
      
      // NUEVAS TABLAS DE USUARIO (NOTIFICACIONES)
      if (selectedTable === 'usuario') {
        return ['login', 'firstname', 'lastname', 'email', 'statusid', 'usercreatedid', 'datecreated', 'usermodifiedid', 'datemodified'].includes(col.columnName);
      }
      
      if (selectedTable === 'perfil') {
        return ['perfil', 'nivel', 'statusid', 'usercreatedid', 'datecreated', 'usermodifiedid', 'datemodified'].includes(col.columnName);
      }
      
      if (selectedTable === 'usuarioperfil') {
        return ['usuarioid', 'perfilid', 'statusid', 'usercreatedid', 'datecreated', 'usermodifiedid', 'datemodified'].includes(col.columnName);
      }
      
      if (selectedTable === 'contacto') {
        return ['usuarioid', 'medioid', 'celular', 'correo', 'statusid', 'usercreatedid', 'datecreated', 'usermodifiedid', 'datemodified'].includes(col.columnName);
      }
      
      if (selectedTable === 'medio') {
        return ['nombre', 'statusid', 'usercreatedid', 'datecreated', 'usermodifiedid', 'datemodified'].includes(col.columnName);
      }
      
      if (selectedTable === 'mensaje') {
        return ['alertaid', 'contactoid', 'mensaje', 'fecha', 'statusid', 'usercreatedid', 'datecreated', 'usermodifiedid', 'datemodified'].includes(col.columnName);
      }
      
      // TABLAS DE ALERTAS
      if (selectedTable === 'alerta') {
        return ['umbralid', 'medicionid', 'fecha', 'statusid', 'usercreatedid', 'datecreated', 'usermodifiedid', 'datemodified'].includes(col.columnName);
      }
      
      // Para cualquier otra tabla, incluir campos de auditoría
      return !col.columnName.endsWith('id') || 
             col.columnName === 'usercreatedid' || 
             col.columnName === 'statusid' || 
             col.columnName === 'usermodifiedid' || 
             col.columnName === 'datecreated' || 
             col.columnName === 'datemodified';
    });
    
    // Reordenar para que statusid aparezca al final
    const reorderedColumns = [];
    const statusColumn = filteredColumns.find(col => col.columnName === 'statusid');
    const otherColumns = filteredColumns.filter(col => col.columnName !== 'statusid');
    
    // Primero las otras columnas, luego statusid
    reorderedColumns.push(...otherColumns);
    if (statusColumn) {
      reorderedColumns.push(statusColumn);
    }
    
    return reorderedColumns;
  };

  const visibleColumns = getVisibleColumns();
  
  // Debug: verificar que los campos de auditoría estén incluidos
  console.log('🔍 Debug - Tabla seleccionada:', selectedTable);
  console.log('🔍 Debug - Columnas visibles:', visibleColumns.map(col => col.columnName));

     // Función para obtener columnas disponibles para búsqueda (excluyendo campos problemáticos)
   const getSearchableColumns = () => {
     const allColumns = getVisibleColumns();
     
     // No excluir ningún campo de la búsqueda - todos deberían funcionar
     const excludedFields: string[] = [];
     
     // Comentado temporalmente para probar si ya funciona la búsqueda de coordenadas
     // if (selectedTable === 'localizacion') {
     //   // Para localización, excluir latitud y longitud del selector de búsqueda
     //   excludedFields.push('latitud', 'longitud');
     // }
     
     return allColumns.filter(col => !excludedFields.includes(col.columnName));
   };

  const searchableColumns = getSearchableColumns();

  const getColumnDisplayName = (columnName: string) => {
    const columnMappings: Record<string, string> = {
      'paisid': 'Pais',
      'empresaid': 'Empresa',
      'fundoid': 'Fundo',
      'ubicacionid': 'Ubicación',
      'entidadid': 'Entidad',
      'nodoid': 'Nodo',
      'tipoid': 'Tipo',
      'metricaid': 'Métrica',
      'localizacionid': 'Localización',
      'criticidadid': 'Criticidad',
      'perfilid': 'Perfil',
      'umbralid': 'Umbral',
      'usuarioid': 'Usuario',
      'medioid': 'Medio',
      'paisabrev': 'Abreviatura',
      'empresabrev': 'Abreviatura',
      'empresaabrev': 'Abreviatura',
      'farmabrev': 'Abreviatura',
      'ubicacionabrev': 'Abreviatura',
      'statusid': 'Status',
      'usercreatedid': 'Creado por',
      'usermodifiedid': 'Modificado por',
      'datecreated': 'Fecha Creación',
      'datemodified': 'Fecha Modificación',
      'modified_by': 'Modificado por',
      'modified_at': 'Fecha Modificación',
      // Campos específicos de cada tabla
      'pais': 'Pais',
      'empresa': 'Empresa',
      'fundo': 'Fundo',
      'ubicacion': 'Ubicación',
      'entidad': 'Entidad',
      'nodo': 'Nodo',
      'tipo': 'Tipo',
      'metrica': 'Métrica',
      'unidad': 'Unidad',
      'deveui': 'DevEUI',
      'appeui': 'AppEUI',
      'appkey': 'AppKey',
      'atpin': 'AT PIN',
      'latitud': 'Latitud',
      'longitud': 'Longitud',
      'referencia': 'Referencia',
      // NUEVAS TABLAS DE UMBRAL
      'umbral': 'Nombre Umbral',
      'maximo': 'Valor Máximo',
      'minimo': 'Valor Mínimo',
      'old_minimo': 'Valor Mínimo Anterior',
      'new_minimo': 'Valor Mínimo Nuevo',
      'old_maximo': 'Valor Máximo Anterior',
      'new_maximo': 'Valor Máximo Nuevo',
      'old_criticidadid': 'Criticidad Anterior',
      'new_criticidadid': 'Criticidad Nueva',
      'accion': 'Acción',
      'criticidad': 'Criticidad',
      'criticidadbrev': 'Abreviatura Criticidad',
      // NUEVAS TABLAS DE USUARIO
      'login': 'Usuario',
      'firstname': 'Nombre',
      'lastname': 'Apellido',
      'perfil': 'Perfil',
      'nivel': 'Nivel',
      'celular': 'Celular',
      'contactoid': 'Contacto',
      'alertaid': 'Alerta',
      'mensaje': 'Mensaje',
      'auditid': 'Audit ID'
    };
    
    return columnMappings[columnName] || columnName;
  };

  // Función para determinar si un campo necesita tabla de equivalencias
  const needsEquivalenceTable = (fieldName: string): boolean => {
    // Campos que siempre necesitan equivalencias
    const fieldsWithEquivalences = ['statusid'];
    
    // Campos de auditoría que SÍ necesitan equivalencias (dropdowns)
    const auditFieldsWithEquivalences = ['usercreatedid', 'usermodifiedid', 'datecreated', 'datemodified'];
    
    // Campos de ID que necesitan equivalencias basados en el schema
    const idFieldsWithEquivalences = [
      'paisid', 'empresaid', 'fundoid', 'ubicacionid', 'entidadid', 
      'nodoid', 'tipoid', 'metricaid', 'localizacionid', 'sensorid',
      // NUEVOS CAMPOS DE ID
      'umbralid', 'criticidadid', 'perfilid', 'usuarioid', 'medioid',
      'contactoid', 'alertaid'
    ];
    
    // Si es un campo de auditoría, necesita equivalencias (dropdowns)
    if (auditFieldsWithEquivalences.includes(fieldName)) {
      return true;
    }
    
    return fieldsWithEquivalences.includes(fieldName) || idFieldsWithEquivalences.includes(fieldName);
  };

     // Función para obtener las equivalencias de un campo
   const getFieldEquivalences = (fieldName: string): Array<{label: string, value: string}> => {
     switch (fieldName) {
       case 'statusid':
         return [
           { label: 'Activo', value: '1' },
           { label: 'Inactivo', value: '0' }
         ];
       case 'usercreatedid':
       case 'usermodifiedid':
         // Para campos de usuario, mostrar los usuarios disponibles
         const userOptions = getUniqueOptionsForField(fieldName);
         return userOptions
           .map(option => ({
             label: option.label,
             value: option.value.toString()
           }))
           .sort((a, b) => a.label.localeCompare(b.label)); // Ordenar alfabéticamente
                            case 'datecreated':
          case 'datemodified':
            // Para campos de fecha, obtener las fechas que realmente existen en la tabla actual
            const existingDates = new Set<string>();
            
            if (updateData && updateData.length > 0) {
              updateData.forEach(row => {
                const fieldValue = row[fieldName];
                if (fieldValue && fieldValue !== null && fieldValue !== undefined) {
                  try {
                    const date = new Date(fieldValue as string);
                    if (!isNaN(date.getTime())) {
                      const dateString = date.toISOString().split('T')[0]; // YYYY-MM-DD
                      existingDates.add(dateString);
                    }
                  } catch (error) {
                    console.log(`Error procesando fecha: ${fieldValue}`);
                  }
                }
              });
            }
            
            // Convertir las fechas únicas a opciones de dropdown
            const dateOptions = Array.from(existingDates)
              .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()) // Ordenar de más reciente a más antigua
              .map(dateString => {
                const date = new Date(dateString);
                const displayDate = date.toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit'
                });
                return {
                  label: displayDate,
                  value: dateString
                };
              });
            
            return dateOptions;
       case 'paisid':
       case 'empresaid':
       case 'fundoid':
       case 'ubicacionid':
       case 'entidadid':
       case 'nodoid':
       case 'tipoid':
       case 'metricaid':
       case 'localizacionid':
       case 'sensorid':
       case 'umbralid':
       case 'perfilid':
       case 'criticidadid':
       case 'medioid':
       case 'contactoid':
       case 'usuarioid':
         // Para campos de ID, mostrar las opciones disponibles
         const idOptions = getUniqueOptionsForField(fieldName);
         return idOptions
           .map(option => ({
             label: option.label,
             value: option.value.toString()
           }))
           .sort((a, b) => a.label.localeCompare(b.label)); // Ordenar alfabéticamente
       default:
         return [];
     }
   };

     // Función para obtener solo las opciones disponibles en la tabla actual
   const getAvailableOptionsForField = (fieldName: string): Array<{label: string, value: string}> => {
     // Obtener todas las opciones posibles
     const allOptions = getFieldEquivalences(fieldName);
     
     // Para TODOS los campos con dropdown, siempre mostrar todas las opciones disponibles
     // Esto incluye: fechas, usuarios, y todos los campos de ID
     return allOptions;
   };

  // Función para determinar si un campo es clave y no debe ser editable
  const isKeyField = (columnName: string): boolean => {
    // Campos que son llaves primarias (siempre no editables)
    const primaryKeys = [
      'paisid', 'empresaid', 'fundoid', 'ubicacionid', 'entidadid', 
      'nodoid', 'tipoid', 'metricaid', 'localizacionid', 'sensorid',
      'usuarioid', 'metricasensorid', 'umbralid', 'perfilid', 'auditid',
      'criticidadid', 'medioid', 'contactoid'
    ];
    
    // Campos que son llaves foráneas (no editables en actualización)
    const foreignKeys = [
      'paisid', 'empresaid', 'fundoid', 'ubicacionid', 'entidadid', 
      'nodoid', 'tipoid', 'metricaid', 'localizacionid', 'sensorid',
      'umbralid', 'perfilid', 'criticidadid', 'medioid', 'usuarioid'
    ];
    
    // Campos de auditoría (no editables)
    const auditFields = [
      'datecreated', 'datemodified', 'usercreatedid', 'usermodifiedid',
      'modified_at', 'modified_by'
    ];
    
    // Verificar si es un campo clave
    return primaryKeys.includes(columnName) || 
           foreignKeys.includes(columnName) || 
           auditFields.includes(columnName) ||
           columnName.endsWith('id') && !['statusid'].includes(columnName);
  };

     // Estados para creación múltiple de sensores
   const [multipleSensors, setMultipleSensors] = useState<any[]>([]);
   const [selectedNodo, setSelectedNodo] = useState<string>('');
   const [selectedTipo, setSelectedTipo] = useState<string>('');
   const [selectedStatus, setSelectedStatus] = useState<boolean>(true);
   const [selectedSensorCount, setSelectedSensorCount] = useState<number>(0);

           // Estados para creación múltiple de métricas sensor
   const [multipleMetricas, setMultipleMetricas] = useState<any[]>([]);
   const [selectedNodos, setSelectedNodos] = useState<string[]>([]);
   const [selectedMetricas, setSelectedMetricas] = useState<string[]>([]);

      // Estados para creación múltiple de localizaciones
   const [multipleLocalizaciones, setMultipleLocalizaciones] = useState<any[]>([]);
   const [selectedUbicaciones, setSelectedUbicaciones] = useState<string[]>([]);
   const [selectedNodosLocalizacion, setSelectedNodosLocalizacion] = useState<string[]>([]);
   const [selectedEntidades, setSelectedEntidades] = useState<string[]>([]);
   
   // Estado para detectar si estamos en modo replicación
   const [isReplicateMode, setIsReplicateMode] = useState(false);

       // Función para inicializar sensores múltiples
  const initializeMultipleSensors = async (nodoid: string, count: number, specificTipos?: number[]) => {
    try {
      // Primero verificar qué sensores ya existen para este nodo
      const existingSensors = tableData.filter(sensor => sensor.nodoid === parseInt(nodoid));
      const existingTipos = existingSensors.map(sensor => sensor.tipoid);
      
      console.log(`🔍 Sensores existentes para nodo ${nodoid}:`, existingSensors);
      console.log(`🔍 Tipos ya utilizados:`, existingTipos);
      
      // Si se especifican tipos específicos (desde pegado), usarlos como predeterminados
      let selectedTipos;
      if (specificTipos && specificTipos.length > 0) {
        console.log(`🔍 Usando tipos específicos copiados como predeterminados:`, specificTipos);
        
        // Buscar los tipos copiados en los tipos disponibles
        const copiedTipos = tiposData.filter(tipo => specificTipos.includes(tipo.tipoid));
        
        // Si no se encuentran todos los tipos copiados, usar los disponibles
        if (copiedTipos.length !== specificTipos.length) {
          console.log(`⚠️ Algunos tipos copiados no están disponibles. Usando tipos disponibles para el nuevo nodo.`);
          
          // Filtrar tipos disponibles (excluir los que ya están en uso)
          const availableTipos = tiposData.filter(tipo => !existingTipos.includes(tipo.tipoid));
          selectedTipos = availableTipos.slice(0, count);
          
          setMessage({ 
            type: 'warning', 
            text: `📋 Algunos tipos copiados no están disponibles para el nuevo nodo. Se han seleccionado tipos disponibles. Puedes modificar los tipos individualmente.` 
          });
        } else {
          // Usar los tipos copiados como predeterminados
          selectedTipos = copiedTipos.slice(0, count);
          
          setMessage({ 
            type: 'success', 
            text: `📋 Datos copiados detectados. Se han seleccionado los mismos tipos que se copiaron. Puedes modificar los tipos individualmente si es necesario.` 
          });
        }
      } else {
        // Filtrar tipos disponibles (excluir los que ya están en uso)
        const availableTipos = tiposData.filter(tipo => !existingTipos.includes(tipo.tipoid));
        
        console.log(`🔍 Tipos disponibles para nuevo sensor:`, availableTipos);
        
        // Verificar que hay suficientes tipos disponibles
        if (count > availableTipos.length) {
          setMessage({ 
            type: 'error', 
            text: `No hay suficientes tipos disponibles para el nodo ${nodoid}. Ya existen ${existingSensors.length} sensores. Tipos disponibles: ${availableTipos.length}, necesarios: ${count}.` 
          });
          return;
        }
        
                selectedTipos = availableTipos.slice(0, count);
      }
        
        console.log(`🔍 Tipos seleccionados para crear:`, selectedTipos.map(t => ({ tipoid: t.tipoid, tipo: t.tipo })));
        
        // Crear sensores con los tipos seleccionados
        const sensors = [];
        
        for (let i = 1; i <= count; i++) {
         const tipo = selectedTipos[i - 1];
         if (tipo) {
           sensors.push({
             sensorIndex: i,
             label: `Sensor ${i} para Nodo ${nodoid} (${tipo.tipo})`,
             nodoid: parseInt(nodoid),
             tipoid: tipo.tipoid, // Usar el tipoid correcto del tipo disponible
             statusid: selectedStatus ? 1 : 0
           });
         }
       }
      
      setMultipleSensors(sensors);
      
    } catch (error) {
      console.error('Error inicializando sensores múltiples:', error);
      setMessage({ 
        type: 'error', 
        text: 'Error al verificar sensores existentes' 
      });
    }
  };

     // Función para inicializar métricas múltiples
   const initializeMultipleMetricas = async (nodos: string[], metricas: string[]) => {
     try {
       // Crear todas las combinaciones válidas (nodoid, metricaid, tipoid)
       const metricasToCreate = [];
       let index = 1;
       
       for (const nodoid of nodos) {
         // 🔑 CAMBIO CLAVE: Obtener tipos de la tabla SENSOR, no de metricasensor
         // Necesitamos cargar los datos de la tabla sensor para este nodo
         const sensorTableDataResponse = await JoySenseService.getTableData('sensor', 1000);
         const sensorTableData: any[] = Array.isArray(sensorTableDataResponse) ? sensorTableDataResponse : ((sensorTableDataResponse as any)?.data || []);
         
         console.log(`🔍 Respuesta de tabla sensor:`, sensorTableDataResponse);
         console.log(`🔍 Datos procesados de tabla sensor:`, sensorTableData);
         
         const existingSensorsForNode = sensorTableData.filter((sensor: any) => sensor.nodoid === parseInt(nodoid));
         const availableTiposForNode = existingSensorsForNode.map((sensor: any) => sensor.tipoid);
         
         console.log(`🔍 Sensores existentes para nodo ${nodoid}:`, existingSensorsForNode);
         console.log(`🔍 Tipos disponibles para métricas en nodo ${nodoid}:`, availableTiposForNode);
         
         if (availableTiposForNode.length === 0) {
           console.log(`⚠️ No hay sensores para el nodo ${nodoid}`);
           continue;
         }
         
         // Crear todas las combinaciones válidas: (nodoid, metricaid, tipoid)
         for (const metricaid of metricas) {
           console.log(`🔍 Procesando métrica ${metricaid} para nodo ${nodoid}`);
           
           for (const tipoid of availableTiposForNode) {
             console.log(`🔍 Creando combinación (${nodoid}, ${metricaid}, ${tipoid})`);
             
             const tipoInfo = tiposData.find(t => t.tipoid === tipoid);
             const metricaInfo = metricasData.find(m => m.metricaid.toString() === metricaid);
             const nodoInfo = nodosData.find(n => n.nodoid.toString() === nodoid);
             
             console.log(`✅ Creando nueva métrica sensor: ${metricaInfo?.metrica || metricaid} para ${nodoInfo?.nodo || nodoid} (${tipoInfo?.tipo || tipoid})`);
             
             metricasToCreate.push({
               metricaIndex: index++,
               label: `Métrica ${metricaInfo?.metrica || metricaid} para Nodo ${nodoInfo?.nodo || nodoid} (${tipoInfo?.tipo || tipoid})`,
               nodoid: parseInt(nodoid),
               metricaid: parseInt(metricaid),
               tipoid: tipoid,
               statusid: selectedStatus ? 1 : 0
             });
           }
         }
       }
       
       setMultipleMetricas(metricasToCreate);
       
       if (metricasToCreate.length > 0) {
         // Mensaje eliminado - no es necesario
       } else {
         setMessage({ 
           type: 'warning', 
           text: 'No hay combinaciones únicas disponibles para crear nuevas métricas sensor' 
         });
       }
       
     } catch (error) {
       console.error('Error inicializando métricas múltiples:', error);
       setMessage({ 
         type: 'error', 
         text: 'Error al verificar métricas sensor existentes' 
       });
     }
   };

  // Función para manejar inserción múltiple de sensores
  const handleMultipleSensorInsert = async () => {
    if (!selectedTable || !user || multipleSensors.length === 0) return;
    
    try {
      setLoading(true);
      const usuarioid = getCurrentUserId();
      
             // Preparar datos para cada sensor (limpiar campos que no están en la tabla)
       const sensorsToInsert = multipleSensors.map(sensor => {
         const { sensorIndex, label, ...cleanSensor } = sensor; // Remover campos que no están en la tabla
         return {
           ...cleanSensor,
           usercreatedid: usuarioid,
           usermodifiedid: usuarioid,
           datecreated: new Date().toISOString(),
           datemodified: new Date().toISOString()
         };
       });

      // Logging para debugging
      console.log('🔍 Frontend: Datos a enviar para inserción de sensores:', JSON.stringify(sensorsToInsert, null, 2));

             // Insertar sensores simultáneamente (ahora que los datos están limpios)
       console.log(`🔄 Insertando ${sensorsToInsert.length} sensores simultáneamente...`);
       const insertPromises = sensorsToInsert.map((sensor, index) => 
         JoySenseService.insertTableRow(selectedTable, sensor)
           .then(result => {
             console.log(`✅ Sensor ${index + 1} insertado exitosamente:`, sensor);
             return result;
           })
           .catch(error => {
             console.error(`❌ Error insertando sensor ${index + 1}:`, sensor, error);
             throw error;
           })
       );
       
       const results = await Promise.all(insertPromises);
      
      // Agregar cada sensor insertado al sistema de mensajes
      sensorsToInsert.forEach(sensor => {
        addInsertedRecord(sensor);
      });
      
      // Limpiar formulario
      setMultipleSensors([]);
      setSelectedNodo('');
      setSelectedTipo('');
      
      // Recargar datos
      loadTableData();
      loadTableInfo();
      loadCopyData();
      // Recargar datos relacionados para que aparezcan en comboboxes
      loadRelatedTablesData();
      
    } catch (error: any) {
      const errorResponse = handleMultipleInsertError(error, 'sensores');
      setMessage({ type: errorResponse.type, text: errorResponse.message });
    } finally {
      setLoading(false);
    }
  };

     // Función para actualizar el tipo de un sensor específico
   const updateSensorTipo = (sensorIndex: number, tipoid: number) => {
     setMultipleSensors(prev => prev.map(sensor => 
       sensor.sensorIndex === sensorIndex 
         ? { ...sensor, tipoid: tipoid }
         : sensor
     ));
   };

  // Función para actualizar el nodo de un sensor específico
  const updateSensorNodo = (sensorIndex: number, nodoid: number) => {
    setMultipleSensors(prev => prev.map(sensor => 
      sensor.sensorIndex === sensorIndex 
        ? { ...sensor, nodoid: nodoid }
        : sensor
    ));
  };

  // Función para actualizar solo el nodo de todos los sensores existentes (sin reinicializar)
  const updateAllSensorsNodo = (nodoid: string) => {
    setMultipleSensors(prev => prev.map(sensor => ({
      ...sensor,
      nodoid: parseInt(nodoid)
    })));
   };

   // Función para actualizar el tipo de una métrica específica
   const updateMetricaTipo = (metricaIndex: number, tipoid: number) => {
     setMultipleMetricas(prev => prev.map(metrica => 
       metrica.metricaIndex === metricaIndex 
         ? { ...metrica, tipoid: tipoid }
         : metrica
     ));
   };

       // Función para inicializar localizaciones múltiples
    const initializeMultipleLocalizaciones = useCallback(async (ubicaciones: string[], nodos: string[], entidades: string[]) => {
      try {
        // Crear todas las combinaciones válidas (ubicacionid, nodoid, entidadid)
        const localizacionesToCreate = [];
        let index = 1;
        
        for (const ubicacionid of ubicaciones) {
          for (const nodoid of nodos) {
            for (const entidadid of entidades) {
              console.log(`🔍 Creando combinación (${ubicacionid}, ${nodoid}, ${entidadid})`);
              
              const ubicacionInfo = ubicacionesData.find(u => u.ubicacionid.toString() === ubicacionid);
              const nodoInfo = nodosData.find(n => n.nodoid.toString() === nodoid);
              const entidadInfo = entidadesData.find(e => e.entidadid.toString() === entidadid);
              
              console.log(`✅ Creando nueva localización: ${ubicacionInfo?.ubicacion || ubicacionid} - ${nodoInfo?.nodo || nodoid} - ${entidadInfo?.entidad || entidadid}`);
              
              localizacionesToCreate.push({
                localizacionIndex: index++,
                label: `Localización ${ubicacionInfo?.ubicacion || ubicacionid} - ${nodoInfo?.nodo || nodoid} - ${entidadInfo?.entidad || entidadid}`,
                ubicacionid: parseInt(ubicacionid),
                nodoid: parseInt(nodoid),
                entidadid: parseInt(entidadid),
                latitud: 0, // Valor por defecto
                longitud: 0, // Valor por defecto
                referencia: '', // Valor por defecto
                statusid: selectedStatus ? 1 : 0
              });
            }
          }
        }
        
        setMultipleLocalizaciones(localizacionesToCreate);
        
        if (localizacionesToCreate.length > 0) {
          // Mensaje eliminado - no es necesario
        } else {
          setMessage({ 
            type: 'warning', 
            text: 'No hay combinaciones únicas disponibles para crear nuevas localizaciones' 
          });
        }
        
      } catch (error) {
        console.error('Error inicializando localizaciones múltiples:', error);
        setMessage({ 
          type: 'error', 
          text: 'Error al verificar localizaciones existentes' 
        });
      }
    }, [ubicacionesData, nodosData, entidadesData, selectedStatus, setMultipleLocalizaciones, setMessage]);

    // Función para manejar inserción múltiple de métricas sensor
    const handleMultipleMetricaInsert = async () => {
    if (!selectedTable || !user || multipleMetricas.length === 0) return;
    
    try {
      setLoading(true);
      const usuarioid = getCurrentUserId();
      
      // Validar que el nodo seleccionado tenga los sensores necesarios
      const selectedNodoId = selectedNodos[0];
      if (selectedNodoId) {
        try {
          // Obtener datos de sensores específicamente para validación
          const sensorTableDataResponse = await JoySenseService.getTableData('sensor', 1000);
          const sensorTableData: any[] = Array.isArray(sensorTableDataResponse) ? sensorTableDataResponse : ((sensorTableDataResponse as any)?.data || []);
          
          // Obtener sensores del nodo seleccionado
          const sensoresDelNodo = sensorTableData.filter((sensor: any) => sensor.nodoid.toString() === selectedNodoId);
          const tiposDisponibles = sensoresDelNodo.map((sensor: any) => sensor.tipoid);
          
          // Verificar que todas las métricas tengan tipos de sensor disponibles
          const tiposRequeridos = Array.from(new Set(multipleMetricas.map(metrica => metrica.tipoid)));
          const tiposFaltantes = tiposRequeridos.filter(tipo => !tiposDisponibles.includes(tipo));
          
          if (tiposFaltantes.length > 0) {
            const tiposFaltantesNombres = tiposFaltantes.map(tipo => {
              const tipoData = tiposData.find(t => t.tipoid === tipo);
              return tipoData ? tipoData.tipo : `Tipo ${tipo}`;
            });
            
            alert(`❌ El nodo seleccionado no tiene sensores de los siguientes tipos: ${tiposFaltantesNombres.join(', ')}\n\nPor favor, selecciona un nodo que tenga todos los sensores necesarios o crea los sensores faltantes primero.`);
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error('Error validando sensores del nodo:', error);
          // Continuar sin validación si hay error obteniendo datos de sensores
        }
      }
      
             // Preparar datos para cada métrica (limpiar campos que no están en la tabla)
       const metricasToInsert = multipleMetricas.map(metrica => {
         const { metricaIndex, label, ...cleanMetrica } = metrica; // Remover campos que no están en la tabla
         return {
           ...cleanMetrica,
           usercreatedid: usuarioid,
           usermodifiedid: usuarioid,
           datecreated: new Date().toISOString(),
           datemodified: new Date().toISOString()
         };
       });

             // Insertar métricas simultáneamente (ahora que los datos están limpios)
       console.log(`🔄 Insertando ${metricasToInsert.length} métricas simultáneamente...`);
       const insertPromises = metricasToInsert.map((metrica, index) => 
         JoySenseService.insertTableRow(selectedTable, metrica)
           .then(result => {
             console.log(`✅ Métrica ${index + 1} insertada exitosamente:`, metrica);
             return result;
           })
           .catch(error => {
             console.error(`❌ Error insertando métrica ${index + 1}:`, metrica, error);
             throw error;
           })
       );
       
       const results = await Promise.all(insertPromises);
      
      // Agregar cada métrica insertada al sistema de mensajes
      metricasToInsert.forEach(metrica => {
        addInsertedRecord(metrica);
      });
      
      // Limpiar formulario
      setMultipleMetricas([]);
      setSelectedNodos([]);
      setSelectedMetricas([]);
      
      // Recargar datos
      loadTableData();
      loadTableInfo();
      loadCopyData();
      // Recargar datos relacionados para que aparezcan en comboboxes
      loadRelatedTablesData();
      
    } catch (error: any) {
      const errorResponse = handleMultipleInsertError(error, 'métricas');
      setMessage({ type: errorResponse.type, text: errorResponse.message });
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar inserción múltiple de localizaciones
  const handleMultipleLocalizacionInsert = async () => {
    if (!selectedTable || !user || multipleLocalizaciones.length === 0) return;
    
    try {
      setLoading(true);
      const usuarioid = getCurrentUserId();
      
      // Preparar datos para cada localización (limpiar campos que no están en la tabla)
      const localizacionesToInsert = multipleLocalizaciones.map(localizacion => {
        const { localizacionIndex, label, ...cleanLocalizacion } = localizacion; // Remover campos que no están en la tabla
        return {
          ...cleanLocalizacion,
          usercreatedid: usuarioid,
          usermodifiedid: usuarioid,
          datecreated: new Date().toISOString(),
          datemodified: new Date().toISOString()
        };
      });

      // Insertar localizaciones simultáneamente (ahora que los datos están limpios)
      console.log(`🔄 Insertando ${localizacionesToInsert.length} localizaciones simultáneamente...`);
      const insertPromises = localizacionesToInsert.map((localizacion, index) => 
        JoySenseService.insertTableRow(selectedTable, localizacion)
          .then(result => {
            console.log(`✅ Localización ${index + 1} insertada exitosamente:`, localizacion);
            return result;
          })
          .catch(error => {
            console.error(`❌ Error insertando localización ${index + 1}:`, localizacion, error);
            throw error;
          })
      );
      
      const results = await Promise.all(insertPromises);
      
      // Agregar cada localización insertada al sistema de mensajes
      localizacionesToInsert.forEach(localizacion => {
        addInsertedRecord(localizacion);
      });
      
      // Limpiar formulario
      setMultipleLocalizaciones([]);
      setSelectedUbicaciones([]);
      setSelectedNodosLocalizacion([]);
      setSelectedEntidades([]);
      
      // Recargar datos
      loadTableData();
      loadTableInfo();
      loadCopyData();
      // Recargar datos relacionados para que aparezcan en comboboxes
      loadRelatedTablesData();
      
    } catch (error: any) {
      const errorResponse = handleMultipleInsertError(error, 'localizaciones');
      setMessage({ type: errorResponse.type, text: errorResponse.message });
    } finally {
      setLoading(false);
    }
  };

  // Función helper para obtener ID único de fila (usa la función consolidada)
  const getRowIdForSelection = (r: any) => getRowId(r, selectedTable);

  // Funciones para selección manual múltiple
  const handleSelectAllFiltered = () => {
    // Solo seleccionar las filas que no están ya seleccionadas
    const newSelections = updateData.filter(row => 
      !selectedRowsForManualUpdate.some(selected => getRowIdForSelection(selected) === getRowIdForSelection(row))
    );
    
    setSelectedRowsForManualUpdate(prev => [...prev, ...newSelections]);
  };

  const handleSelectRowForManualUpdate = (row: any, isSelected: boolean) => {
    const rowId = getRowIdForSelection(row);
    
    console.log('🔍 handleSelectRowForManualUpdate:', { 
      rowId, 
      isSelected, 
      currentSelection: selectedRowsForManualUpdate.length 
    });
    
    if (isSelected) {
      // Verificar si ya está seleccionada para evitar duplicados
      if (!selectedRowsForManualUpdate.some(r => getRowIdForSelection(r) === rowId)) {
        setSelectedRowsForManualUpdate(prev => [...prev, row]);
        console.log('✅ Fila agregada a la selección');
      } else {
        console.log('⚠️ Fila ya estaba seleccionada');
      }
    } else {
      // Remover de la selección
      setSelectedRowsForManualUpdate(prev => prev.filter(r => getRowIdForSelection(r) !== rowId));
      console.log('❌ Fila removida de la selección');
    }
  };

  const handleDeselectAll = () => {
    setSelectedRowsForManualUpdate([]);
  };

  const handleGoToManualUpdateForm = () => {
    if (selectedRowsForManualUpdate.length === 0) {
      setUpdateMessage({ type: 'warning', text: 'Debes seleccionar al menos una entrada para actualizar' });
      return;
    }
    
    // Validar que los datos relacionados estén cargados
    const needsRelatedData = selectedRowsForManualUpdate.some(row => 
      row.nodoid || row.tipoid || row.metricaid || row.ubicacionid
    );
    
    if (needsRelatedData && (!nodosData || !tiposData || !metricasData || !ubicacionesData)) {
      setMessage({ type: 'warning', text: 'Cargando datos relacionados... Por favor espera un momento.' });
      // Recargar datos relacionados si es necesario
      loadRelatedTablesData();
      return;
    }
    
    setIsMultipleSelectionMode(true);
    setUpdateFormData(selectedRowsForManualUpdate[0]); // Usar la primera como base
    setActiveSubTab('update'); // Cambiar a la pestaña de formulario
  };

  const handleCancelManualUpdate = () => {
    setCancelAction(() => () => {
    setIsMultipleSelectionMode(false);
    setSelectedRowsForManualUpdate([]);
    setUpdateFormData({});
      setShowCancelModal(false);
    });
    setShowCancelModal(true);
  };

  // Funciones para manejar el modal de confirmación
  const handleConfirmCancel = () => {
    if (cancelAction) {
      cancelAction();
    }
    setShowCancelModal(false);
    setCancelAction(null);
  };

  const handleCancelModal = () => {
    setShowCancelModal(false);
    setCancelAction(null);
  };

  // Función para manejar cancelación del formulario de inserción
  const handleCancelInsert = () => {
    setCancelAction(() => () => {
      // Reinicializar formulario
      const initialFormData: Record<string, any> = {};
      columns.forEach(col => {
        if (col.columnName === 'statusid') {
          initialFormData[col.columnName] = 1;
        } else if (!col.isIdentity && !['datecreated', 'datemodified', 'usercreatedid', 'usermodifiedid', 'modified_by', 'modified_at', 'medioid', 'contactoid', 'usuarioid', 'perfilid', 'criticidadid'].includes(col.columnName)) {
          initialFormData[col.columnName] = col.defaultValue || '';
        }
      });
      setFormData(initialFormData);
      setShowCancelModal(false);
    });
    setShowCancelModal(true);
  };



  // Efecto para limpiar selección cuando cambie la tabla
  useEffect(() => {
    setSelectedRowsForManualUpdate([]);
    setIsMultipleSelectionMode(false);
  }, [selectedTable]);

  return (
    <div className="animate-fadeIn">
      {/* Modal de confirmación para cambio de tabla */}
      {pendingTableChange && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 bg-opacity-90 rounded-xl border border-gray-700 border-opacity-50 p-6 w-full max-w-md">
            <div className="text-center">
              <div className="mb-4">
                <div className="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white text-opacity-90 mb-2">¿Confirmar cambio de parámetro?</h3>
                <p className="text-gray-300 text-opacity-80 mb-6">
                Los cambios que has realizado se perderán al cambiar de parámetro. ¿Estás seguro que deseas continuar?
              </p>
              </div>
              <div className="flex gap-3 justify-center">
                  <button
                    onClick={confirmTableChange}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                  Sí, continuar
                  </button>
                  <button
                    onClick={cancelTableChange}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                  >
                  No, cancelar
                  </button>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <div>
        {selectedTable ? (
          <>


            {/* Mensajes */}
                         {message && (
               <div className={`p-4 rounded-lg mb-6 ${
                 message.type === 'success' ? 'bg-blue-600 bg-opacity-20 border border-blue-500' : 
                 message.type === 'warning' ? 'bg-yellow-600 bg-opacity-20 border border-yellow-500' :
                 message.type === 'info' ? 'bg-blue-600 bg-opacity-20 border border-blue-500' :
                 'bg-red-600 bg-opacity-20 border border-red-500'
               } text-white`}>
                 {message.text}
               </div>
             )}

            {/* Contenido basado en la sub-pestaña activa */}
            <div className="space-y-8">
                             {/* Estado de la tabla */}
               {activeSubTab === 'status' && (
                 <div className="bg-gray-800 bg-opacity-50 rounded-xl border border-gray-700 p-6">
                   
                   {tableInfo && (
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                       <div className="bg-gray-700 rounded-lg p-4 text-center">
                         <div className="text-gray-400 text-sm mb-1">Registros</div>
                          <div className="text-2xl font-bold text-blue-400">{tableData.length}</div>
                       </div>
                       <div className="bg-gray-700 rounded-lg p-4 text-center">
                         <div className="text-gray-400 text-sm mb-1">Última actualización</div>
                         <div className="text-2xl font-bold text-blue-400">{new Date().toLocaleDateString('es-ES')}</div>
                       </div>
                       <div className="bg-gray-700 rounded-lg p-4 text-center">
                         <div className="text-gray-400 text-sm mb-1">Último usuario</div>
                         <div className="text-2xl font-bold text-blue-400">
                           {(() => {
                             // Buscar el último registro modificado
                             const lastModified = tableData
                               ?.filter((row: any) => row.usermodifiedid || row.usercreatedid)
                               ?.sort((a: any, b: any) => {
                                 const dateA = new Date(a.datemodified || a.datecreated || 0);
                                 const dateB = new Date(b.datemodified || b.datecreated || 0);
                                 return dateB.getTime() - dateA.getTime();
                               })?.[0];
                             
                             if (lastModified) {
                               const userId = lastModified.usermodifiedid || lastModified.usercreatedid;
                               return getUserName(userId) || 'Usuario';
                             }
                             return 'N/A';
                           })()}
                         </div>
                       </div>
                     </div>
                   )}

                                     {loading ? (
                     <div className="text-center py-8">
                       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                       <p className="text-gray-400 mt-2">Cargando datos...</p>
                     </div>
                   ) : (
                     <>
                       {/* Barra de búsqueda */}
                       <div className="mb-6">
                         <div className="relative">
                           <input
                             type="text"
                             value={statusSearchTerm}
                             onChange={(e) => handleStatusSearch(e.target.value)}
                             placeholder="🔍 Buscar en todos los campos..."
                             className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
                           />
                         </div>
                         {statusSearchTerm && (
                           <div className="mt-2 text-sm text-gray-400">
                             Mostrando {statusFilteredData.length} de {filteredTableData.length} registros
                           </div>
                         )}
                       </div>

                       {/* Tabla con datos */}
                       <div className="overflow-x-auto -mx-2 sm:mx-0">
                         <table className="w-full text-sm text-left text-gray-300">
                           <thead className="text-xs text-gray-400 bg-gray-700">
                             <tr>
                               {visibleColumns.map(col => {
                                 const displayName = getColumnDisplayName(col.columnName);
                                 return displayName ? (
                                   <th key={col.columnName} className="px-6 py-3">
                                     {displayName}
                                   </th>
                                 ) : null;
                               })}
                             </tr>
                           </thead>
                           <tbody>
                             {getStatusPaginatedData().map((row, index) => (
                               <tr key={index} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700">
                                 {visibleColumns.map(col => {
                                   const displayName = getColumnDisplayName(col.columnName);
                                   return displayName ? (
                                     <td key={col.columnName} className="px-6 py-4 text-xs">
                                       {col.columnName === 'usercreatedid' || col.columnName === 'usermodifiedid' 
                                         ? getUserName(row[col.columnName])
                                         : col.columnName === 'statusid'
                                         ? (
                                           <span className={row[col.columnName] === 1 ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
                                             {row[col.columnName] === 1 ? 'Activo' : 'Inactivo'}
                                           </span>
                                         )
                                         : col.columnName === 'datecreated' || col.columnName === 'datemodified'
                                         ? formatDate(row[col.columnName])
                                         : getDisplayValue(row, col.columnName)}
                                     </td>
                                   ) : null;
                                 })}
                               </tr>
                             ))}
                           </tbody>
                         </table>
                       </div>

                       {/* Paginación */}
                       {statusTotalPages > 1 && (
                         <div className="flex justify-center gap-2 mt-6">
                           <button
                             onClick={() => handleStatusPageChange(statusCurrentPage - 1)}
                             disabled={statusCurrentPage <= 1}
                             className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                           >
                             ← Anterior
                           </button>
                           <span className="text-white flex items-center px-3">
                             Página {statusCurrentPage} de {statusTotalPages}
                           </span>
                           <button
                             onClick={() => handleStatusPageChange(statusCurrentPage + 1)}
                             disabled={statusCurrentPage >= statusTotalPages}
                             className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                           >
                             Siguiente →
                           </button>
                         </div>
                       )}
                     </>
                   )}
                </div>
              )}

                                                           {/* Formulario de inserción */}
                {activeSubTab === 'insert' && (
                  <div className="bg-gray-800 bg-opacity-50 rounded-xl border border-gray-700 p-6">
                    {/* Mensaje de registros insertados */}
                    <InsertionMessage
                      insertedRecords={insertedRecords}
                      tableName={selectedTable}
                      onClear={clearInsertedRecords}
                      nodosData={nodosData}
                      tiposData={tiposData}
                    />
                                         {selectedTable === 'sensor' ? (
                                                <MultipleSensorForm
                           selectedNodo={selectedNodo}
                           setSelectedNodo={setSelectedNodo}
                           selectedTipo={selectedTipo}
                           setSelectedTipo={setSelectedTipo}
                           selectedStatus={selectedStatus}
                           setSelectedStatus={setSelectedStatus}
                           selectedSensorCount={selectedSensorCount}
                           setSelectedSensorCount={setSelectedSensorCount}
                           multipleSensors={multipleSensors}
                           nodosData={nodosData}
                           tiposData={tiposData}
                           loading={loading}
                           onInitializeSensors={initializeMultipleSensors}
                           onUpdateSensorTipo={updateSensorTipo}
                           onUpdateSensorNodo={updateSensorNodo}
                           onUpdateAllSensorsNodo={updateAllSensorsNodo}
                           onInsertSensors={handleMultipleSensorInsert}
                           onCancel={() => {
                             setMultipleSensors([]);
                             setSelectedNodo('');
                             setSelectedTipo('');
                             setSelectedSensorCount(0);
                           }}
                           onReplicateClick={openReplicateModalForTable}
                         />
                                          ) : selectedTable === 'metricasensor' ? (
                                                                         <MultipleMetricaSensorForm
                          selectedNodos={selectedNodos}
                          setSelectedNodos={setSelectedNodos}
                          selectedMetricas={selectedMetricas}
                          setSelectedMetricas={setSelectedMetricas}
                          selectedStatus={selectedStatus}
                          setSelectedStatus={setSelectedStatus}
                          multipleMetricas={multipleMetricas}
                          setMultipleMetricas={setMultipleMetricas}
                          nodosData={nodosData}
                          metricasData={metricasData}
                          tiposData={tiposData}
                          loading={loading}
                          onInitializeMetricas={initializeMultipleMetricas}
                          onInsertMetricas={handleMultipleMetricaInsert}
                          onCancel={() => {
                            setMultipleMetricas([]);
                            setSelectedNodos([]);
                            setSelectedMetricas([]);
                            setIsReplicateMode(false);
                          }}
                          onReplicateClick={openReplicateModalForTable}
                          isReplicateMode={isReplicateMode}
                        />
                    ) : selectedTable === 'localizacion' ? (
                      <MultipleLocalizacionForm
                        selectedUbicaciones={selectedUbicaciones}
                        setSelectedUbicaciones={setSelectedUbicaciones}
                        selectedNodos={selectedNodosLocalizacion}
                        setSelectedNodos={setSelectedNodosLocalizacion}
                        selectedEntidades={selectedEntidades}
                        setSelectedEntidades={setSelectedEntidades}
                        selectedStatus={selectedStatus}
                        setSelectedStatus={setSelectedStatus}
                        multipleLocalizaciones={multipleLocalizaciones}
                        setMultipleLocalizaciones={setMultipleLocalizaciones}
                        ubicacionesData={ubicacionesData}
                        nodosData={nodosData}
                        entidadesData={entidadesData}
                        loading={loading}
                        onInitializeLocalizaciones={initializeMultipleLocalizaciones}
                        onInsertLocalizaciones={handleMultipleLocalizacionInsert}
                        onCancel={() => {
                          setMultipleLocalizaciones([]);
                          setSelectedUbicaciones([]);
                          setSelectedNodosLocalizacion([]);
                          setSelectedEntidades([]);
                        }}
                      />
                    ) : (
                      <div className="space-y-6">
                        
                      <NormalInsertForm
                        visibleColumns={visibleColumns}
                        formData={formData}
                        setFormData={setFormData}
                        selectedTable={selectedTable}
                        loading={loading}
                        onInsert={handleInsert}
                          onCancel={handleCancelInsert}
                        getColumnDisplayName={getColumnDisplayName}
                        getUniqueOptionsForField={getUniqueOptionsForField}
                          onPasteFromClipboard={handlePasteFromClipboardForInsert}
                        onReplicateClick={openReplicateModalForTable}
                      />
                      </div>
                    )}
                  </div>
                )}

          {/* Formulario de actualización */}
               {activeSubTab === 'update' && (
                <div className="space-y-6">
                  {/* Mensajes específicos de actualización */}
                  {updateMessage && (
                    <div className={`p-4 rounded-lg mb-6 ${
                      updateMessage.type === 'success' ? 'bg-blue-600 bg-opacity-20 border border-blue-500' : 
                      updateMessage.type === 'warning' ? 'bg-yellow-600 bg-opacity-20 border border-yellow-500' :
                      updateMessage.type === 'info' ? 'bg-blue-600 bg-opacity-20 border border-blue-500' :
                      'bg-red-600 bg-opacity-20 border border-red-500'
                    } text-white`}>
                      {updateMessage.text}
                    </div>
                  )}

                  {/* Overlay Modal para formulario de actualización */}
                  {(selectedRowForUpdate || selectedRowsForUpdate.length > 0 || isMultipleSelectionMode) && (
                    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2 sm:p-4">
                      <div className="bg-gray-800 bg-opacity-95 rounded-xl border border-gray-700 p-4 sm:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-4">
                      
                      {/* Información sobre múltiples filas seleccionadas automáticamente */}
                      {!isMultipleSelectionMode && selectedRowsForUpdate.length > 0 && (
                        <div className="mb-6 p-4 bg-blue-900 bg-opacity-30 border border-blue-600 rounded-lg">
                          <h3 className="text-lg font-bold text-blue-300 mb-2">
                            📋 Actualización Múltiple Automática
                          </h3>
                          <p className="text-blue-200 mb-3">
                            Se han seleccionado <span className="font-bold">{selectedRowsForUpdate.length}</span> entradas del nodo <span className="font-bold">{selectedRowsForUpdate[0]?.nodoid}</span> para actualizar.
                            {(selectedTable === 'sensor' || selectedTable === 'metricasensor') && (
                              <span className="block text-sm text-blue-300 mt-1">
                                📅 Timestamp: {new Date(selectedRowsForUpdate[0]?.datecreated).toLocaleString()}
                              </span>
                            )}
                          </p>
                          <div className="text-sm text-blue-300">
                            <p>• Los cambios se aplicarán a todas las entradas seleccionadas</p>
                            <p>• Los campos clave no se pueden modificar</p>
                            <p>• Solo se actualizarán los campos que modifiques</p>
                          </div>
                        </div>
                      )}
                      
                      {/* Formulario normal para actualización de una sola entrada */}
                      {selectedRowForUpdate && selectedRowsForUpdate.length === 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                        {visibleColumns.map(col => {
                          const displayName = getColumnDisplayName(col.columnName);
                          if (!displayName) return null;
                          
                          const value = updateFormData[col.columnName] || '';
                          
                                                     // Campos automáticos - NO mostrar en formulario de actualización
                           if (['usercreatedid', 'usermodifiedid', 'datecreated', 'datemodified'].includes(col.columnName)) {
                             return null;
                           }

                           // Campos clave - mostrar como solo lectura
                           if (isKeyField(col.columnName)) {
                              const displayValue = col.columnName === 'usercreatedid' || col.columnName === 'usermodifiedid' 
                                 ? getUserName(value)
                                 : col.columnName === 'statusid'
                                 ? (value === 1 ? 'Activo' : 'Inactivo')
                                : selectedRowForUpdate ? getDisplayValue(selectedRowForUpdate, col.columnName) : '';
                             
                             return (
                               <div key={col.columnName} className="mb-4">
                                 <label className="block text-lg font-bold text-white mb-2">
                                   {displayName} 🔒
                                 </label>
                                 <input
                                   type="text"
                                   value={displayValue}
                                   readOnly
                                    className="w-full px-3 py-2 border rounded-lg text-gray-300 cursor-not-allowed bg-gray-600 border-gray-500"
                                    title="Campo clave - No editable"
                                  />
                               </div>
                             );
                           }

                           // Campo statusid como checkbox
                           if (col.columnName === 'statusid') {
                             return (
                               <div key={col.columnName} className="mb-4">
                                 <label className="block text-lg font-bold text-white mb-2">
                                   {displayName}
                                 </label>
                                 <div className="flex items-center space-x-3">
                                   <input
                                     type="checkbox"
                                     id={`update-${col.columnName}`}
                                     checked={value === 1 || value === true}
                                     onChange={(e) => setUpdateFormData(prev => ({
                                       ...prev,
                                       [col.columnName]: e.target.checked ? 1 : 0
                                     }))}
                                     className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                                   />
                                   <label htmlFor={`update-${col.columnName}`} className="text-white text-lg font-medium">
                                     Activo
                                   </label>
                                 </div>
                               </div>
                             );
                           }

                           // Campos de texto normales (editables)
                           return (
                             <div key={col.columnName} className="mb-4">
                               <label className="block text-lg font-bold text-white mb-2">
                                 {displayName}
                               </label>
                               <input
                                 type="text"
                                 value={value}
                                 onChange={(e) => setUpdateFormData(prev => ({
                                   ...prev,
                                   [col.columnName]: e.target.value
                                 }))}
                                 className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white"
                               />
                             </div>
                           );
                        })}
                      </div>
                      )}

                      {/* Tabla de entradas seleccionadas para actualización múltiple */}
                      {(selectedRowsForUpdate.length > 0 || selectedRowsForManualUpdate.length > 0) && (
                        <div className="bg-gray-700 rounded-lg p-4 mb-6">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="text-lg font-bold text-white">Actualizar Status</h4>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  const allRows = selectedRowsForUpdate.length > 0 ? selectedRowsForUpdate : selectedRowsForManualUpdate;
                                  setUpdateFormData(prev => ({
                                    ...prev,
                                    statusid: 1
                                  }));
                                }}
                                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                              >
                                ✓ Activar Todo
                              </button>
                              <button
                                onClick={() => {
                                  setUpdateFormData(prev => ({
                                    ...prev,
                                    statusid: 0
                                  }));
                                }}
                                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
                              >
                                ✗ Desactivar Todo
                              </button>
                            </div>
                          </div>
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-gray-600">
                                  {visibleColumns
                                    .filter(col => !['usercreatedid', 'usermodifiedid', 'datecreated', 'datemodified'].includes(col.columnName))
                                    .map(col => (
                                      <th key={col.columnName} className="text-left py-2 px-2 text-gray-300 font-medium">
                                        {getColumnDisplayName(col.columnName)}
                                      </th>
                                    ))}
                                  <th className="text-left py-2 px-2 text-gray-300 font-medium">Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(selectedRowsForUpdate.length > 0 ? selectedRowsForUpdate : selectedRowsForManualUpdate).map((row, index) => (
                                  <tr key={index} className="border-b border-gray-600">
                                    {visibleColumns
                                      .filter(col => !['usercreatedid', 'usermodifiedid', 'datecreated', 'datemodified'].includes(col.columnName))
                                      .map(col => (
                                        <td key={col.columnName} className="py-2 px-2 text-white">
                                          {col.columnName === 'statusid' 
                                            ? (row[col.columnName] === 1 ? 'Activo' : 'Inactivo')
                                            : getDisplayValue(row, col.columnName)
                                          }
                                        </td>
                                      ))}
                                    <td className="py-2 px-2">
                                      <div className="flex items-center space-x-2">
                                        <input
                                          type="checkbox"
                                          checked={updateFormData.statusid === 1}
                                          onChange={(e) => setUpdateFormData(prev => ({
                                            ...prev,
                                            statusid: e.target.checked ? 1 : 0
                                          }))}
                                          className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                                        />
                                        <span className="text-white text-sm">
                                          {updateFormData.statusid === 1 ? 'Activo' : 'Inactivo'}
                                        </span>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}



                      {/* Botones de acción */}
                      <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mt-6 sm:mt-8 justify-center">
                        <button
                          onClick={handleUpdate}
                          disabled={updateLoading}
                          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                        >
                          <span>➕</span>
                          <span>{updateLoading ? 'Guardando...' : 'Guardar'}</span>
                        </button>
                        <button
                          onClick={handleCancelUpdate}
                          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium flex items-center space-x-2"
                        >
                          <span>❌</span>
                          <span>Cancelar</span>
                        </button>
                      </div>
                      </div>
                    </div>
                  )}

                                     {/* Sección de Selección y Registros - SOLO cuando NO hay selección */}
                   {!selectedRowForUpdate && selectedRowsForUpdate.length === 0 && (
                     <>
                                              {/* Búsqueda simple - Igual que en "Estado" */}
                        <div className="bg-gray-800 bg-opacity-50 rounded-xl border border-gray-700 p-6">
                          <div className="space-y-4">
                            {/* Barra de búsqueda simple como en "Estado" */}
                            <div className="relative">
                              <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => handleSearchTermChange(e.target.value)}
                                placeholder="🔍 Buscar en todos los campos..."
                                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-white placeholder-gray-400"
                              />
                            </div>
                            {searchTerm && (
                              <div className="mt-2 text-sm text-gray-400">
                                Mostrando {updateData.length} registros filtrados
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Botones de selección múltiple para sensor y metricasensor - Solo mostrar cuando hay selecciones */}
                        {(selectedTable === 'sensor' || selectedTable === 'metricasensor') && selectedRowsForManualUpdate.length > 0 && (
                          <div className="bg-gray-800 bg-opacity-50 rounded-xl border border-gray-700 p-4">
                            <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 justify-center">
                              <button
                                onClick={handleGoToManualUpdateForm}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                🔧 Actualizar {selectedRowsForManualUpdate.length} entrada(s)
                              </button>
                              <button
                                onClick={handleDeselectAll}
                                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                              >
                                🗑️ Limpiar Selección
                              </button>
                            </div>
                          </div>
                        )}

                       {/* Tabla de datos para actualizar - Usando la misma lógica que "Estado" */}
                       <div className="bg-gray-800 bg-opacity-50 rounded-xl border border-gray-700 p-6">
                         <div className="overflow-x-auto -mx-2 sm:mx-0">
                           {updateData.length > 0 ? (
                             <table className="w-full text-sm text-left text-gray-300">
                                                                <thead className="text-xs text-gray-400 bg-gray-700">
                                   <tr>
                                     <th className="px-2 py-3 w-12">
                                       {/* Columna de selección sin título */}
                                     </th>
                                     {visibleColumns.map(col => {
                                       const displayName = getColumnDisplayName(col.columnName);
                                       return displayName ? (
                                         <th key={col.columnName} className="px-6 py-3">
                                           {displayName}
                                         </th>
                                       ) : null;
                                     })}
                                   </tr>
                                 </thead>
                                                               <tbody>
                                 {getUpdatePaginatedData().map((row, index) => {
                                   console.log('📋 Renderizando fila:', { 
                                     index, 
                                     nodoid: row.nodoid, 
                                     tipoid: row.tipoid,
                                     currentPage,
                                     totalPages
                                   });
                                   
                                   const isSelected = (selectedTable === 'sensor' || selectedTable === 'metricasensor') 
                                     ? selectedRowsForManualUpdate.some(r => getRowIdForSelection(r) === getRowIdForSelection(row))
                                     : selectedRowForUpdate === row;
                                   
                                   return (
                                   <tr key={(currentPage - 1) * itemsPerPage + index} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700 cursor-pointer" onClick={(e) => {
                                     // Solo ejecutar si no se hizo clic en el checkbox
                                     if ((e.target as HTMLInputElement).type !== 'checkbox') {
                                     if (selectedTable === 'sensor' || selectedTable === 'metricasensor') {
                                       // Toggle selection: if selected, unselect; if not selected, select
                                       handleSelectRowForManualUpdate(row, !isSelected);
                                     } else {
                                       handleSelectRowForUpdate(row);
                                       }
                                     }
                                   }}>
                                     <td className="px-2 py-4 w-12">
                                       <input
                                         type="checkbox"
                                         checked={isSelected}
                                         onChange={(e) => {
                                           e.stopPropagation();
                                           if (selectedTable === 'sensor' || selectedTable === 'metricasensor') {
                                             // Toggle selection: if selected, unselect; if not selected, select
                                             handleSelectRowForManualUpdate(row, !isSelected);
                                           } else {
                                             handleSelectRowForUpdate(row);
                                           }
                                         }}
                                         className="w-4 h-4 text-blue-600 bg-gray-700 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                                       />
                                     </td>
                                     {visibleColumns.map(col => {
                                       const displayName = getColumnDisplayName(col.columnName);
                                       return displayName ? (
                                         <td key={col.columnName} className="px-6 py-4 text-xs">
                                           {col.columnName === 'usercreatedid' || col.columnName === 'usermodifiedid' 
                                             ? getUserName(row[col.columnName])
                                             : col.columnName === 'statusid'
                                             ? (
                                               <span className={row[col.columnName] === 1 ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold'}>
                                                 {row[col.columnName] === 1 ? 'Activo' : 'Inactivo'}
                                               </span>
                                             )
                                             : col.columnName === 'datecreated' || col.columnName === 'datemodified'
                                             ? formatDate(row[col.columnName])
                                             : getDisplayValue(row, col.columnName)}
                                         </td>
                                       ) : null;
                                     })}
                                   </tr>
                                 );
                               })}
                               </tbody>
                             </table>
                           ) : (
                             <div className="text-center text-gray-400 py-8">
                               No hay datos disponibles
                             </div>
                           )}
                         </div>
                         
                                                    {/* Paginación */}
                           {updateData.length > 0 && totalPages > 1 && (
                             <div className="flex justify-center gap-2 mt-4">
                               <button
                                 onClick={prevPage}
                                 disabled={!hasPrevPage}
                                 className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                               >
                                 ← Anterior
                               </button>
                               <span className="text-white flex items-center px-3">
                                 Página {currentPage} de {totalPages}
                               </span>
                               <button
                                 onClick={nextPage}
                                 disabled={!hasNextPage}
                                 className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                               >
                                 Siguiente →
                               </button>
                             </div>
                           )}
                       </div>
                     </>
                   )}
                </div>
              )}

                      </div>
          </>
        ) : (
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="mb-2 p-4 bg-red-600 rounded-lg">
              <p className="text-white font-medium text-center">Selecciona un parámetro desde el menú lateral</p>
                    </div>
                        </div>
                      )}
                  </div>

      {/* Modal de confirmación para cancelar */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 bg-opacity-90 rounded-xl border border-gray-700 border-opacity-50 p-6 w-full max-w-md">
            <div className="text-center">
              <div className="mb-4">
                <div className="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                        </div>
                <h3 className="text-xl font-bold text-white text-opacity-90 mb-2">¿Confirmar cancelación?</h3>
                <p className="text-gray-300 text-opacity-80 mb-6">
                  Se perderá toda la información ingresada en los campos del formulario. Esta acción no se puede deshacer.
                </p>
                    </div>
              <div className="flex gap-3 justify-center">
                        <button
                  onClick={handleConfirmCancel}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                        >
                  Sí, cancelar
                        </button>
                        <button
                  onClick={handleCancelModal}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
                        >
                  No, continuar
                        </button>
                      </div>
                  </div>
            </div>
          </div>
        )}

      {/* Modal de replicación */}
      {replicateOptions && (
        <ReplicateModal
          isOpen={showModal}
          onClose={closeReplicateModal}
          onReplicate={handleReplicate}
          tableName={replicateOptions.tableName}
          tableData={replicateOptions.tableData}
          visibleColumns={replicateOptions.visibleColumns}
          relatedData={replicateOptions.relatedData}
          relatedColumns={replicateOptions.relatedColumns}
          nodosData={replicateOptions.nodosData}
          tiposData={replicateOptions.tiposData}
          metricasData={replicateOptions.metricasData}
          originalTable={replicateOptions.originalTable}
          loading={loading}
        />
      )}
    </div>
  );
};

export default SystemParameters;
