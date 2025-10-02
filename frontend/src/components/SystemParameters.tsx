// ============================================================================
// IMPORTS
// ============================================================================

// React Core
import React, { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle, useMemo } from 'react';

// Contexts
import { useAuth } from '../contexts/AuthContext';
import { useFilters } from '../contexts/FilterContext';

// Services
import { JoySenseService } from '../services/backend-api';

// Types
import { TableInfo, Message } from '../types/systemParameters';

// Utils
import { handleInsertError, handleMultipleInsertError } from '../utils/errorHandler';
import { 
  getColumnDisplayName, 
  getDisplayValue, 
  formatDate, 
  getUserName, 
  type RelatedData 
} from '../utils/systemParametersUtils';
import { hasSignificantChanges } from '../utils/changeDetection';
import { validateTableData, validateTableUpdate } from '../utils/formValidation';

// Hooks
import { useTableDataManagement } from '../hooks/useTableDataManagement';
import { useSearchAndFilter } from '../hooks/useSearchAndFilter';
import { useMultipleSelection } from '../hooks/useMultipleSelection';
import { usePagination } from '../hooks/usePagination';
import { useSimpleModal } from '../hooks/useSimpleModal';
import { useInsertionMessages } from '../hooks/useInsertionMessages';
import { useReplicate } from '../hooks/useReplicate';
import { useGlobalFilterEffect } from '../hooks/useGlobalFilterEffect';
import { useSystemParametersState } from '../hooks/useSystemParametersState';

// Components - SystemParameters
import { TableChangeConfirmationModal } from './SystemParameters/TableChangeConfirmationModal';
import { TableStatsDisplay } from './SystemParameters/TableStatsDisplay';
import { PaginationControls } from './SystemParameters/PaginationControls';
import { ActionButtons } from './SystemParameters/ActionButtons';
import { MultipleSelectionButtons } from './SystemParameters/MultipleSelectionButtons';
import { LoadingSpinner } from './SystemParameters/LoadingSpinner';
import { SearchBarWithCounter } from './SystemParameters/SearchBarWithCounter';
import { MessageDisplay } from './SystemParameters/MessageDisplay';

// Components - Forms
import MultipleSensorForm from './MultipleSensorForm';
import MultipleUsuarioPerfilForm from './MultipleUsuarioPerfilForm';
import { MassiveSensorForm } from './MassiveSensorForm';
import { MassiveMetricaSensorForm } from './MassiveMetricaSensorForm';
import { AdvancedUsuarioPerfilUpdateForm } from './AdvancedUsuarioPerfilUpdateForm';
import { AdvancedMetricaSensorUpdateForm } from './AdvancedMetricaSensorUpdateForm';
import { AdvancedSensorUpdateForm } from './AdvancedSensorUpdateForm';

// Components - Lazy
import { MultipleMetricaSensorFormLazyWithBoundary } from './LazyComponents';
import { MassiveUmbralFormLazyWithBoundary } from './LazyComponents';
import { NormalInsertFormLazyWithBoundary } from './LazyComponents';

// Components - Other
import SimpleModal from './SimpleModal';
import InsertionMessage from './InsertionMessage';
import ReplicateModal from './ReplicateModal';
import ContactTypeModal from './ContactTypeModal';

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

interface SystemParametersProps {
  selectedTable?: string;
  onTableSelect?: (table: string) => void;
  activeSubTab?: 'status' | 'insert' | 'update' | 'massive';
  onSubTabChange?: (subTab: 'status' | 'insert' | 'update' | 'massive') => void;
  activeTab?: string;
  onParameterChangeWithConfirmation?: (newTable: string) => void;
  onTabChangeWithConfirmation?: (newTab: string) => void;
  onFormDataChange?: (formData: Record<string, any>, multipleData: any[] | any) => void;
  clearFormData?: boolean;
}

export interface SystemParametersRef {
  hasUnsavedChanges: () => boolean;
  handleTabChange: (tab: 'status' | 'insert' | 'update' | 'massive') => void;
  handleTableChange: (table: string) => void;
}

// ============================================================================
// COMPONENT DECLARATION
// ============================================================================

const SystemParameters = forwardRef<SystemParametersRef, SystemParametersProps>(({ 
  selectedTable: propSelectedTable, 
  onTableSelect,
  activeSubTab: propActiveSubTab,
  onSubTabChange,
  activeTab,
  onParameterChangeWithConfirmation,
  onTabChangeWithConfirmation,
  onFormDataChange,
  clearFormData = false,
}, ref) => {

  // ============================================================================
  // HOOKS & CONTEXTS
  // ============================================================================
  
  const { user } = useAuth();
  const { paisSeleccionado, empresaSeleccionada, fundoSeleccionado } = useFilters();

  // Data Management Hook
  const {
    tableData,
    columns,
    tableColumns,
    loading,
    userData,
    paisesData,
    empresasData,
    fundosData,
    ubicacionesData,
    localizacionesData,
    entidadesData,
    nodosData,
    tiposData,
    metricasData,
    criticidadesData,
    perfilesData,
    umbralesData,
    sensorsData,
    metricasensorData,
    perfilumbralData,
    contactosData,
    loadUserData,
    loadRelatedTablesData,
    loadTableData,
    setLoading
  } = useTableDataManagement();

  // Search & Filter Hook
  const {
    searchTerm,
    searchField,
    statusSearchTerm,
    statusFilteredData,
    setSearchTerm,
    setHasSearched,
    setStatusSearchTerm,
    setStatusFilteredData,
    setCopySearchTerm,
    setCopyFilteredData,
    searchByCriteria,
    handleSearchTermChange,
    handleStatusSearch,
  } = useSearchAndFilter();

  // System Parameters State Hook
  const {
    selectedTable,
    activeSubTab,
    updateData,
    updateFilteredData,
    selectedRowForUpdate,
    updateFormData,
    updateLoading,
    statusCurrentPage,
    statusTotalPages,
    setSelectedTable,
    setActiveSubTab,
    setUpdateData,
    setUpdateFilteredData,
    setSelectedRowForUpdate,
    setUpdateFormData,
    setUpdateLoading,
    setStatusCurrentPage,
    setStatusTotalPages,
    setCopyData,
  } = useSystemParametersState(propSelectedTable, propActiveSubTab);

  // Simple Modal Hook
  const {
    modalState,
    showModal: showSimpleModal,
    confirmAction,
    cancelAction: cancelSimpleAction
  } = useSimpleModal();

  // Insertion Messages Hook
  const { insertedRecords, addInsertedRecord, clearInsertedRecords, clearOnTabChange } = useInsertionMessages(activeSubTab, activeTab, selectedTable);

  // Replicate Hook
  const { showModal, replicateOptions, openReplicateModal, closeReplicateModal, handleReplicate } = useReplicate();

  // Multiple Selection Hook
  const { findEntriesByTimestamp } = useMultipleSelection(selectedTable, searchByCriteria);

  // Constants
  const itemsPerPage = 10;

  // Pagination Hook
  const { getPaginatedData, goToPage, hasNextPage, hasPrevPage, currentPage: paginationCurrentPage, totalPages } = usePagination(updateFilteredData, itemsPerPage);

  // ============================================================================
  // STATE MANAGEMENT & EFFECTS
  // ============================================================================
  
  // Estado para modal de tipo de contacto
  const [contactTypeModalOpen, setContactTypeModalOpen] = useState(false);
  const [selectedContactType, setSelectedContactType] = useState<'phone' | 'email' | null>(null);
  const [countryCodes, setCountryCodes] = useState<any[]>([]);

  // Cargar códigos de país cuando se selecciona tipo teléfono
  useEffect(() => {
    if (selectedContactType === 'phone' && countryCodes.length === 0) {
      loadCountryCodes();
    }
  }, [selectedContactType]);

  // Limpiar estado de contacto cuando se cambia de tabla
  useEffect(() => {
    if (selectedTable !== 'contacto') {
      setSelectedContactType(null);
      setCountryCodes([]);
    }
  }, [selectedTable]);

  const loadCountryCodes = async () => {
    try {
      console.log('🔍 Cargando códigos telefónicos...');
      const data = await JoySenseService.getCodigosTelefonicos();
      console.log('📞 Códigos telefónicos cargados:', data);
      setCountryCodes(data || []);
    } catch (error) {
      console.error('❌ Error cargando códigos telefónicos:', error);
    }
  };

  // Sincronizar estado local con props

  useEffect(() => {

    if (propSelectedTable !== undefined && propSelectedTable !== selectedTable) {

      console.log('🔄 SystemParameters: Syncing with propSelectedTable:', { 

        propSelectedTable, 

        currentSelectedTable: selectedTable 

      });

      setSelectedTable(propSelectedTable);

    }

  }, [propSelectedTable, selectedTable, setSelectedTable]);

useEffect(() => {

    if (propActiveSubTab !== undefined && propActiveSubTab !== activeSubTab) {

      setActiveSubTab(propActiveSubTab);

    }

  }, [propActiveSubTab, activeSubTab, setActiveSubTab]);

// Función para ejecutar el cambio de pestaña

// Función para manejar el cambio de pestaña y limpiar mensajes

  const handleTabChange = useCallback((tab: 'status' | 'insert' | 'update' | 'massive') => {

    console.log('🔄 handleTabChange called:', { 

      currentTab: activeSubTab, 

      targetTab: tab, 

      selectedTable,

      formData,

      multipleData: getMultipleData()

    });

// Verificar si hay cambios sin guardar

    const hasChanges = hasSignificantChanges(formData, selectedTable, activeSubTab, getMultipleData());

if (hasChanges) {

// Mostrar modal de confirmación

      showSimpleModal(

        'subtab',

        activeSubTab,

        tab,

        () => {

// Limpiar datos del formulario antes de cambiar

          setFormData(initializeFormData(columns));

          setMultipleUsuarioPerfiles([]);

          setSelectedUsuarios([]);

          setSelectedPerfiles([]);

          setMultipleMetricas([]);

          setSelectedNodos([]);

          setSelectedMetricas([]);

          setIsReplicateMode(false);

          setMultipleSensors([]);

          setSelectedSensorCount(0);

          // Cambiar pestaña internamente y notificar a App.tsx

          handleSubTabNavigation(tab);

        },

        () => {

// No hacer nada, quedarse en la pestaña actual

        }

      );

    } else {

// No hay cambios, proceder normalmente

      handleSubTabNavigation(tab);

    }

  }, [activeSubTab, selectedTable]);

// Efecto para limpiar mensajes cuando cambia la pestaña desde el exterior

  useEffect(() => {

    // Limpiar mensajes cuando cambia activeSubTab desde el exterior

    setMessage(null);

    setUpdateMessage(null);

    // setCopyMessage(null);

    clearOnTabChange();

  }, [activeSubTab]);

const [pendingTableChange, setPendingTableChange] = useState<string>('');

  const [tableInfo, setTableInfo] = useState<TableInfo | null>(null);

  // Estados de datos de tabla ahora manejados por useTableDataManagement

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

  }, [filteredTableData, itemsPerPage, setStatusCurrentPage, setStatusFilteredData, setStatusTotalPages]);

const [formData, setFormData] = useState<Record<string, any>>({});

  // loading y setLoading ahora se importan desde useTableDataManagement

  const [message, setMessage] = useState<Message | null>(null);

// ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  // Función helper para inicializar formData con statusid por defecto
  const initializeFormData = useCallback((cols?: any[]) => {

    const initialFormData: Record<string, any> = {};

    cols?.forEach(col => {

      if (col.columnName === 'statusid') {

        initialFormData[col.columnName] = 1;

      } else if (!col.isIdentity && !['datecreated', 'datemodified', 'usercreatedid', 'usermodifiedid', 'modified_by', 'modified_at', 'contactoid', 'usuarioid', 'perfilid', 'criticidadid'].includes(col.columnName)) {

        // Para campos de dropdown (ID), inicializar como null en lugar de string vacío

        if (col.columnName.endsWith('id') && col.columnName !== 'statusid') {

          initialFormData[col.columnName] = null;

        } else {

          initialFormData[col.columnName] = col.defaultValue || '';

        }

      }

    });

    return initialFormData;

  }, []);

const [updateMessage, setUpdateMessage] = useState<Message | null>(null);

// Estados de datos relacionados ahora manejados por useTableDataManagement

// ============================================================================
  // DATA GROUPING FUNCTIONS
  // ============================================================================

  // Función para agrupar datos de metricasensor por nodo
  const groupMetricaSensorData = (data: any[]) => {

    if (selectedTable !== 'metricasensor') {

      return data;

    }

// Agrupar por nodoid

    const groupedData = data.reduce((acc: any, row: any) => {

      const nodoid = row.nodoid;

      if (!acc[nodoid]) {

        // Buscar el nombre del nodo

        const nodo = nodosData?.find(n => n.nodoid === nodoid);

acc[nodoid] = {

          nodoid: row.nodoid,

          nodo: nodo?.nodo || `Nodo ${nodoid}`,

          tipos: new Set(),

          metricas: new Set(),

          usercreatedid: row.usercreatedid,

          datecreated: row.datecreated,

          usermodifiedid: row.usermodifiedid,

          datemodified: row.datemodified,

          statusid: row.statusid,

          // Mantener referencia a las filas originales para el formulario de edición

          originalRows: []

        };

      }

// Buscar el nombre del tipo y métrica (siempre para enriquecer la fila)

      const tipo = tiposData?.find(t => t.tipoid === row.tipoid);

      const metrica = metricasData?.find(m => m.metricaid === row.metricaid);

// Solo agregar tipos y métricas si están activos (statusid: 1)

      if (row.statusid === 1) {

        if (tipo?.tipo) {

          acc[nodoid].tipos.add(tipo.tipo);

        }

if (metrica?.metrica) {

          acc[nodoid].metricas.add(metrica.metrica);

        }

      }

// Crear fila original con nombres incluidos

      const enrichedRow = {

        ...row,

        tipo: tipo?.tipo || `Tipo ${row.tipoid}`,

        metrica: metrica?.metrica || `Métrica ${row.metricaid}`,

        nodo: acc[nodoid].nodo || `Nodo ${row.nodoid}`,

        entidadid: tipo?.entidadid || row.entidadid // Obtener entidadid del tipo

      };

// Agregar fila original enriquecida

      acc[nodoid].originalRows.push(enrichedRow);

return acc;

    }, {});

// Convertir a array y formatear tipos y métricas

    const result = Object.values(groupedData).map((group: any) => {

      const hasActiveMetrics = group.tipos.size > 0 && group.metricas.size > 0;

return {

        ...group,

        tipos: hasActiveMetrics ? Array.from(group.tipos).join(', ') : 'Sin sensores activos',

        metricas: hasActiveMetrics ? Array.from(group.metricas).join(', ') : '',

        // Para compatibilidad con el sistema de selección

        tipoid: group.originalRows[0]?.tipoid,

        metricaid: group.originalRows[0]?.metricaid

      };

    });

// Ordenar por fecha de modificación más reciente primero

    return result.sort((a: any, b: any) => {

      const dateA = new Date(a.datemodified || a.datecreated || 0);

      const dateB = new Date(b.datemodified || b.datecreated || 0);

      return dateB.getTime() - dateA.getTime();

    });

  };

// Función para agrupar datos de sensor por nodo

  const groupSensorData = (data: any[]) => {

    if (selectedTable !== 'sensor') {

      return data;

    }

// Agrupar por nodoid

    const groupedData = data.reduce((acc: any, row: any) => {

      const nodoid = row.nodoid;

      if (!acc[nodoid]) {

        // Buscar el nombre del nodo

        const nodo = nodosData?.find(n => n.nodoid === nodoid);

acc[nodoid] = {

          nodoid: row.nodoid,

          nodo: nodo?.nodo || `Nodo ${nodoid}`,

          tipos: new Set(),

          usercreatedid: row.usercreatedid,

          datecreated: row.datecreated,

          usermodifiedid: row.usermodifiedid,

          datemodified: row.datemodified,

          statusid: row.statusid,

          // Mantener referencia a las filas originales para el formulario de edición

          originalRows: []

        };

      }

// Buscar el nombre del tipo

      const tipo = tiposData?.find(t => t.tipoid === row.tipoid);

// Solo agregar tipos si están activos (statusid: 1)

      if (row.statusid === 1) {

        if (tipo?.tipo) {

          acc[nodoid].tipos.add(tipo.tipo);

        }

      }

// Crear fila original con nombres incluidos

      const enrichedRow = {

        ...row,

        tipo: tipo?.tipo || `Tipo ${row.tipoid}`,

        nodo: acc[nodoid].nodo || `Nodo ${row.nodoid}`,

        entidadid: tipo?.entidadid || row.entidadid // Obtener entidadid del tipo

      };

// Agregar fila original enriquecida

      acc[nodoid].originalRows.push(enrichedRow);

return acc;

    }, {});

// Convertir a array y formatear tipos

    const result = Object.values(groupedData).map((group: any) => {

      const hasActiveTypes = group.tipos.size > 0;

return {

        ...group,

        tipos: hasActiveTypes ? Array.from(group.tipos).join(', ') : 'Sin sensores activos',

        // Para compatibilidad con el sistema de selección

        tipoid: group.originalRows[0]?.tipoid,

        // Agregar todos los tipos para mostrar en la tabla

        allTipos: Array.from(group.tipos).join(', ')

      };

    });

// Ordenar por fecha de modificación más reciente primero

    return result.sort((a: any, b: any) => {

      const dateA = new Date(a.datemodified || a.datecreated || 0);

      const dateB = new Date(b.datemodified || b.datecreated || 0);

      return dateB.getTime() - dateA.getTime();

    });

  };

// Función para agrupar datos de usuarioperfil por usuario

  const groupUsuarioPerfilData = (data: any[]) => {

    if (selectedTable !== 'usuarioperfil') {

      return data;

    }

// Agrupar por usuarioid

    const groupedData = data.reduce((acc: any, row: any) => {

      const usuarioid = row.usuarioid;

      if (!acc[usuarioid]) {

        // Buscar el nombre del usuario

        const usuario = userData?.find(u => u.usuarioid === usuarioid);

acc[usuarioid] = {

          usuarioid: row.usuarioid,

          usuario: usuario?.login || `Usuario ${usuarioid}`, // Usar login (email) en lugar de nombre

          email: usuario?.email || '',

          perfiles: new Set(),

          usercreatedid: row.usercreatedid,

          datecreated: row.datecreated,

          usermodifiedid: row.usermodifiedid,

          datemodified: row.datemodified,

          statusid: row.statusid,

          // Mantener referencia a las filas originales para el formulario de edición

          originalRows: []

        };

      }

// Buscar el nombre del perfil

      const perfil = perfilesData?.find(p => p.perfilid === row.perfilid);

// Solo agregar perfiles si están activos (statusid: 1)

if (row.statusid === 1) {

        if (perfil?.perfil) {

          acc[usuarioid].perfiles.add(perfil.perfil);

}

      } else {

}

// Crear fila original con nombres incluidos

      const enrichedRow = {

        ...row,

        perfil: perfil?.perfil || `Perfil ${row.perfilid}`,

        usuario: acc[usuarioid].usuario || `Usuario ${row.usuarioid}`, // Ya usa login desde arriba

        email: acc[usuarioid].email || ''

      };

// Agregar fila original enriquecida

      acc[usuarioid].originalRows.push(enrichedRow);

return acc;

    }, {});

// Convertir a array y formatear perfiles

    const result = Object.values(groupedData).map((group: any) => {

      const hasActivePerfiles = group.perfiles.size > 0;

return {

        ...group,

        perfiles: hasActivePerfiles ? Array.from(group.perfiles).join(', ') : 'Sin perfiles activos',

        // Para compatibilidad con el sistema de selección

        perfilid: group.originalRows[0]?.perfilid

      };

    });

// Ordenar por fecha de modificación más reciente primero

    return result.sort((a: any, b: any) => {

      const dateA = new Date(a.datemodified || a.datecreated || 0);

      const dateB = new Date(b.datemodified || b.datecreated || 0);

      return dateB.getTime() - dateA.getTime();

    });

  };

// Estados para actualización con paginación - Ahora manejados por useSystemParametersState

// Aplicar filtros globales a updateData

  const filteredUpdateData = useGlobalFilterEffect({

    tableName: selectedTable,

    data: updateData

  });

// Actualizar updateFilteredData cuando cambien los filtros globales

  useEffect(() => {

    setUpdateFilteredData(filteredUpdateData);

  }, [filteredUpdateData, setUpdateFilteredData]);

// Reagrupar datos de metricasensor cuando cambien los datos relacionados

  // Este useEffect se eliminó para evitar bucles infinitos

  // Los datos relacionados se cargan automáticamente cuando se necesita

  // Estados de actualización - Ahora manejados por useSystemParametersState

// Estados para paginación y búsqueda de la tabla de Estado - Ahora manejados por useSystemParametersState

// Estados para la tabla de equivalencias mejorada (ya no necesitamos estos)

// Estados para la funcionalidad de copiar - Ahora manejados por useSystemParametersState

  // Estados de copia ahora manejados por useSearchAndFilter

// Estados para selección múltiple en actualización

  const [selectedRowsForUpdate, setSelectedRowsForUpdate] = useState<any[]>([]);

const [individualRowStatus, setIndividualRowStatus] = useState<{[key: string]: boolean}>({});

// Estados para modal de confirmación

  const [showCancelModal, setShowCancelModal] = useState(false);

  const [cancelAction, setCancelAction] = useState<(() => void) | null>(null);

// Estados para modal de pérdida de datos

// ============================================================================
  // REPLICATION FUNCTIONS
  // ============================================================================

  const handleReplicateSensor = (nodo: any) => {

    // Obtener todos los sensores del nodo fuente seleccionado

    const sensoresDelNodo = tableData.filter(sensor => sensor.nodoid === nodo.nodoid);

if (sensoresDelNodo.length > 0) {

      // NO cambiar el nodo destino (mantener el que ya está seleccionado en el formulario)

      // Solo extraer los tipos únicos de los sensores del nodo fuente

      const tiposUnicos = Array.from(new Set(sensoresDelNodo.map(sensor => sensor.tipoid)));

// Configurar la cantidad basada en los tipos únicos encontrados

      setSelectedSensorCount(tiposUnicos.length);

// Inicializar sensores con los tipos del nodo fuente, pero para el nodo destino actual

      if (selectedNodo) {

        initializeMultipleSensors(selectedNodo, tiposUnicos.length, tiposUnicos);

      }

    } else {

      // Si no hay sensores en el nodo fuente, mostrar mensaje

      setMessage({ type: 'warning', text: 'El nodo seleccionado no tiene sensores para replicar.' });

    }

  };

const handleReplicateNodo = (nodo: any) => {

    // Llenar el formulario con los datos del nodo seleccionado

    const initialData = initializeFormData(columns);

    setFormData({

      ...initialData,

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

      // NO cambiar el nodo destino (mantener el que ya está seleccionado en el formulario)

      // Solo extraer las métricas únicas de las métricas sensor del nodo fuente

      const metricasUnicas = Array.from(new Set(metricasDelNodo.map(metrica => metrica.metricaid)));

// Seleccionar automáticamente las métricas encontradas

      setSelectedMetricas(metricasUnicas.map(id => id.toString()));

// Inicializar métricas con las métricas del nodo fuente, pero para el nodo destino actual

      if (selectedNodos.length > 0) {

        initializeMultipleMetricas(selectedNodos, metricasUnicas.map(id => id.toString()));

      }

// Mostrar mensaje de confirmación

      setMessage({ 

        type: 'success', 

        text: `Se han seleccionado automáticamente ${metricasUnicas.length} métricas del nodo fuente para replicar.` 

      });

    } else {

      // Si no hay métricas sensor en el nodo fuente, mostrar mensaje

      setMessage({ type: 'warning', text: 'El nodo seleccionado no tiene métricas sensor para replicar.' });

    }

  };

// Función para abrir el modal de replicación según el tipo de tabla

  const openReplicateModalForTable = async () => {

    let modalData = tableData;

    let modalTableName = selectedTable;

    let modalVisibleColumns = updateVisibleColumns;

// Para sensor, mostrar nodos únicos que tienen sensores

    if (selectedTable === 'sensor') {

      try {

        // Cargar datos de nodos directamente desde la API

        const nodosResponse = await JoySenseService.getTableData('nodo', 500);

        const nodos = Array.isArray(nodosResponse) ? nodosResponse : ((nodosResponse as any)?.data || []);

// Obtener nodos únicos que tienen sensores

        const nodosConSensores = Array.from(new Set(tableData.map(sensor => sensor.nodoid)))

          .map(nodoid => {

            const nodo = nodos.find((n: any) => n.nodoid === nodoid);

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

      selectedEntidad: selectedTable === 'sensor' ? selectedEntidad : undefined, // Pasar entidad seleccionada para filtrar nodos

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

// ============================================================================
  // PAGINATION FUNCTIONS
  // ============================================================================

  // Para metricasensor, sensor y usuarioperfil, calcular totalPages basado en datos agrupados
  const getTotalPagesForGroupedTable = () => {

    if ((selectedTable === 'metricasensor' || selectedTable === 'sensor' || selectedTable === 'usuarioperfil') && updateData.length > 0) {

      const groupedData = selectedTable === 'metricasensor' 

        ? groupMetricaSensorData(updateData)

        : selectedTable === 'sensor'

        ? groupSensorData(updateData)

        : groupUsuarioPerfilData(updateData);

      const calculatedPages = Math.ceil(groupedData.length / itemsPerPage);

return calculatedPages;

    }

    return totalPages;

  };

// Total de páginas corregido para tablas agrupadas

  const correctedTotalPages = getTotalPagesForGroupedTable();

// Funciones de navegación corregidas para tablas agrupadas

  const correctedHasNextPage = (selectedTable === 'metricasensor' || selectedTable === 'sensor' || selectedTable === 'usuarioperfil') ? paginationCurrentPage < correctedTotalPages : hasNextPage;

  const correctedHasPrevPage = (selectedTable === 'metricasensor' || selectedTable === 'sensor' || selectedTable === 'usuarioperfil') ? paginationCurrentPage > 1 : hasPrevPage;

// Funciones de navegación personalizadas para metricasensor

const handleMetricaSensorNextPage = () => {

    if (paginationCurrentPage < correctedTotalPages) {

      goToPage(paginationCurrentPage + 1);

    }

  };

const handleMetricaSensorPrevPage = () => {

    if (paginationCurrentPage > 1) {

      goToPage(paginationCurrentPage - 1);

    }

  };

const handleMetricaSensorFirstPage = () => {

    goToPage(1);

  };

const handleMetricaSensorLastPage = () => {

    goToPage(correctedTotalPages);

  };

// Usar paginationCurrentPage para todas las tablas

  const effectiveCurrentPage = paginationCurrentPage;

// Resetear página cuando cambie la tabla

  useEffect(() => {

    goToPage(1);

  }, [selectedTable]); // Removido goToPage de las dependencias

// ============================================================================
  // NAVIGATION & CHANGE HANDLING FUNCTIONS
  // ============================================================================

  // Función simple para verificar si hay cambios sin guardar
  const hasUnsavedChanges = useCallback((): boolean => {

// Verificar pestaña "Crear"

    if (activeSubTab === 'insert') {

      // Para formularios normales (no múltiples)

      if (selectedTable !== 'usuarioperfil' && selectedTable !== 'metricasensor' && selectedTable !== 'sensor') {

        // Campos referenciales que no deben considerarse para detección de cambios

        // Definir campos referenciales específicos por tabla

        let referentialFields: string[] = [];

if (selectedTable === 'pais') {

          // Para pais: pais y paisabrev son campos de entrada

          referentialFields = ['paisid', 'empresaid', 'empresa', 'fundoid', 'fundo', 'entidadid', 'entidad'];

} else if (selectedTable === 'fundo') {

          // Para fundo: fundo y fundoabrev son campos de entrada

          referentialFields = ['paisid', 'pais', 'empresaid', 'empresa', 'fundoid', 'entidadid', 'entidad'];

        } else if (selectedTable === 'ubicacion') {

          // Para ubicacion: ubicacion es campo de entrada

          referentialFields = ['paisid', 'pais', 'empresaid', 'empresa', 'fundoid', 'fundo', 'entidadid', 'entidad'];

        } else if (selectedTable === 'localizacion') {

          // Para localizacion: localizacion es campo de entrada

          referentialFields = ['paisid', 'pais', 'empresaid', 'empresa', 'fundoid', 'fundo', 'entidadid', 'entidad'];

        } else if (selectedTable === 'entidad') {

          // Para entidad: entidad es campo de entrada

          referentialFields = ['paisid', 'pais', 'empresaid', 'empresa', 'fundoid', 'fundo', 'entidadid'];

        } else {

          // Para otras tablas, usar la lista completa

          referentialFields = ['paisid', 'pais', 'empresaid', 'empresa', 'fundoid', 'fundo', 'entidadid', 'entidad'];

        }

const hasChanges = Object.keys(formData).some(key => {

          const value = formData[key];

// Excluir campos referenciales

          if (referentialFields.includes(key)) {

return false;

          }

// Log específico para campos de país

          if (selectedTable === 'pais' && (key === 'pais' || key === 'paisabrev')) {

}

// Excluir statusid si es 1 (valor por defecto)

          if (key === 'statusid') {

            const hasStatusChange = value !== 1;

return hasStatusChange;

          }

// Verificar si hay datos significativos

          if (typeof value === 'string' && value.trim() !== '') {

return true;

          }

          if (typeof value === 'number' && value !== null && value !== undefined) {

return true;

          }

          if (Array.isArray(value) && value.length > 0) {

return true;

          }

          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {

            const hasObjectData = Object.keys(value).some(objKey => {

              const objValue = value[objKey];

              return objValue !== null && objValue !== undefined && objValue !== '';

            });

return hasObjectData;

          }

          if (typeof value === 'boolean' && value === true) {

return true;

          }

return false;

        });

return hasChanges;

      }

// Para Usuario Perfil - Crear

      if (selectedTable === 'usuarioperfil') {

        return selectedUsuarios.length > 0 || selectedPerfiles.length > 0 || multipleUsuarioPerfiles.length > 0;

      }

// Para Sensor Métrica - Crear

      if (selectedTable === 'metricasensor') {

        return selectedNodos.length > 0 || selectedEntidadMetrica !== '' || selectedMetricas.length > 0 || multipleMetricas.length > 0;

      }

// Para Sensor - Crear

      if (selectedTable === 'sensor') {

        return selectedNodo !== '' || selectedEntidad !== '' || selectedTipo !== '' || selectedSensorCount > 0 || multipleSensors.length > 0;

      }

    }

// Verificar pestaña "Actualizar"

    if (activeSubTab === 'update') {
      console.log('🔍 hasUnsavedChanges - Entrando en sección UPDATE');

      // Verificar si hay búsqueda activa
      if (searchField || searchTerm) {
        console.log('🔍 hasUnsavedChanges - Hay búsqueda activa, retornando true');
        return true;
      }

      // Debug de la condición principal
      console.log('🔍 hasUnsavedChanges - Verificando condición principal:', {
        hasSelectedRowForUpdate: !!selectedRowForUpdate,
        updateFormDataKeysLength: Object.keys(updateFormData).length,
        updateFormDataKeys: Object.keys(updateFormData)
      });

      // Verificar si hay cambios reales en el formulario de actualización
      // Solo mostrar modal si se han modificado los datos originales
      if (selectedRowForUpdate && Object.keys(updateFormData).length > 0) {
        
        // Comparar datos originales con datos modificados
        const hasRealChanges = Object.keys(updateFormData).some(key => {
          const originalValue = selectedRowForUpdate[key];
          const currentValue = updateFormData[key];

// Comparar valores, manejando diferentes tipos de datos
          // Considerar null, undefined y string vacío como equivalentes
          const normalizeValue = (val: any) => {
            if (val === null || val === undefined || val === '') return null;
            return val;
          };
          
          const normalizedOriginal = normalizeValue(originalValue);
          const normalizedCurrent = normalizeValue(currentValue);
          
          const isDifferent = normalizedOriginal !== normalizedCurrent;
          
          return isDifferent;
        });

        return hasRealChanges;
      }

// Verificar si hay múltiples filas seleccionadas para actualizar

      if (selectedRowsForUpdate.length > 0) {

        return true;

      }

// Verificar si hay filas seleccionadas para actualización manual

      if (selectedRowsForManualUpdate.length > 0) {

        return true;

      }

    }

// Verificar pestaña "Masivo"

    if (activeSubTab === 'massive') {

      // Para Umbral - Masivo

      if (selectedTable === 'umbral') {

        // Verificar si hay datos en el formulario masivo de umbral

        return Object.keys(formData).some(key => {

          const value = formData[key];

          // Excluir campos referenciales

          const referentialFields = ['paisid', 'empresaid', 'fundoid', 'entidadid'];

          if (referentialFields.includes(key)) return false;

// Verificar si hay datos significativos

          if (typeof value === 'string' && value.trim() !== '') return true;

          if (typeof value === 'number' && value !== null && value !== undefined) return true;

          if (Array.isArray(value) && value.length > 0) return true;

          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {

            return Object.keys(value).some(objKey => {

              const objValue = value[objKey];

              return objValue !== null && objValue !== undefined && objValue !== '';

            });

          }

          if (typeof value === 'boolean' && value === true) return true;

          return false;

        });

      }

// Para Sensor - Masivo

      if (selectedTable === 'sensor') {

        return multipleSensors.length > 0 || selectedNodo !== '' || selectedEntidad !== '' || selectedTipo !== '' || selectedSensorCount > 0;

      }

// Para Métrica Sensor - Masivo

      if (selectedTable === 'metricasensor') {

        return multipleMetricas.length > 0 || selectedNodos.length > 0 || selectedEntidadMetrica !== '' || selectedMetricas.length > 0;

      }

    }

return false;

  }, [activeSubTab, selectedTable]);

// Función simple para manejar el cambio de tabla

  const handleTableChange = useCallback((newTable: string) => {

// Verificar si hay cambios sin guardar

    const hasChanges = hasSignificantChanges(formData, selectedTable, activeSubTab, getMultipleData());

if (hasChanges) {

// Mostrar modal de confirmación

      showSimpleModal(

        'parameter',

        selectedTable,

        newTable,

        () => {

// Limpiar datos del formulario antes de cambiar

          setFormData(initializeFormData(columns));

          setMultipleUsuarioPerfiles([]);

          setSelectedUsuarios([]);

          setSelectedPerfiles([]);

    setMultipleMetricas([]);

    setSelectedNodos([]);

    setSelectedMetricas([]);

          setIsReplicateMode(false);

    setMultipleSensors([]);

    setSelectedSensorCount(0);

          handleParameterNavigation(newTable);

        },

        () => {

// No hacer nada, quedarse en el parámetro actual

        }

      );

    } else {

// No hay cambios, proceder normalmente

      handleParameterNavigation(newTable);

    }

  }, [formData, selectedTable, activeSubTab, selectedRowForUpdate, updateFormData, selectedRowsForUpdate, selectedRowsForManualUpdate, searchField, searchTerm]);

  // Exponer funciones al componente padre
  useImperativeHandle(ref, () => ({
    hasUnsavedChanges,
    handleTabChange,
    handleTableChange
  }), [hasUnsavedChanges, handleTabChange, handleTableChange]);

  // Función executeTableChange eliminada - ahora usamos handleParameterNavigation

// Función simple para manejar el cambio de tabla con confirmación

// Función para limpiar la selección de copiar

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

// SISTEMA ROBUSTO DE NAVEGACIÓN - 3 FUNCIONES ESPECÍFICAS

  const handleParameterNavigation = useCallback((newTable: string) => {

setSelectedTable(newTable);

    setActiveSubTab('status');

    setFormData(initializeFormData(columns));

    setMessage(null);

    setUpdateMessage(null);

    setHasSearched(false);

    setSelectedRowForUpdate(null);

    setSelectedRowsForUpdate([]);

    setUpdateFormData({});

    setIndividualRowStatus({});

// Cargar datos de la nueva tabla

      loadTableDataWrapper();

      loadTableInfo();

      loadTableConstraints();

      loadUpdateData();

      loadCopyData();

// Notificar al componente padre solo si no viene de handleTableChange
    // (para evitar loop infinito)
    // if (onTableSelect) {
    //   onTableSelect(newTable);
    // }

  }, [setSelectedTable, setActiveSubTab]);

const handleSubTabNavigation = useCallback((newSubTab: 'status' | 'insert' | 'update' | 'massive') => {

setActiveSubTab(newSubTab);

    setMessage(null);

    setUpdateMessage(null);

    // Limpiar search terms al cambiar de pestaña para mantener independencia
    setStatusSearchTerm('');
    setSearchTerm('');
    setHasSearched(false);
    
    // Restaurar datos originales al limpiar búsquedas
    setStatusFilteredData(filteredTableData);
    // Recargar datos de actualización originales
    loadUpdateData();

    // Limpiar datos del formulario cuando se cambia de pestaña

setFormData(initializeFormData(columns));

    setMultipleUsuarioPerfiles([]);

    setSelectedUsuarios([]);

    setSelectedPerfiles([]);

    setMultipleMetricas([]);

    setSelectedNodos([]);

    setSelectedMetricas([]);

    setIsReplicateMode(false);

    setMultipleSensors([]);

    setSelectedSensorCount(0);

// Limpiar estados específicos de sensor

    setSelectedNodo('');

    setSelectedEntidad('');

    setSelectedTipo('');

    setSelectedStatus(true);

// Limpiar estados específicos de metricasensor

    setSelectedNodos([]);

    setSelectedEntidadMetrica('');

    setSelectedMetricas([]);

// Notificar al componente padre PRIMERO para sincronizar

    if (onSubTabChange) {

onSubTabChange(newSubTab);

    }

  }, [setActiveSubTab, onSubTabChange]);

// Cargar datos de usuario y tablas relacionadas

  useEffect(() => {

    loadUserData();

    loadRelatedTablesData();

  }, []);

// Cargar datos cuando se selecciona una tabla

  useEffect(() => {

    if (selectedTable) {

loadTableDataWrapper();

      loadTableInfo();

      loadTableConstraints();

      loadUpdateData();

      loadCopyData();

      setHasSearched(false);

    }

  }, [selectedTable]);

// Sincronizar con propSelectedTable - REMOVIDO para evitar bucle infinito

  // El cambio de tabla se maneja directamente en App.tsx

// Efecto para limpiar datos cuando se confirma el cambio

  useEffect(() => {

    if (clearFormData) {

setFormData(initializeFormData(columns));

      setMultipleUsuarioPerfiles([]);

      setSelectedUsuarios([]);

      setSelectedPerfiles([]);

      setMultipleMetricas([]);

      setSelectedNodos([]);

      // setSelectedEntidadMetrica('');

      setSelectedMetricas([]);

      setIsReplicateMode(false);

      setMultipleSensors([]);

      // setSelectedNodo('');

      // setSelectedEntidad('');

      // setSelectedTipo('');

      setSelectedSensorCount(0);

      // Limpiar otros estados específicos si es necesario

    }

  }, [clearFormData]);

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

// loadUserData ahora se importa desde useTableDataManagement

// loadRelatedTablesData ahora se importa desde useTableDataManagement

// ============================================================================
  // DATA LOADING FUNCTIONS
  // ============================================================================

  // Función específica para obtener opciones únicas para usuarioperfil
  const getUniqueOptionsForUsuarioPerfilField = (columnName: string, filterParams?: { usuarioid?: string; perfilid?: string }) => {

    console.log('🔍 getUniqueOptionsForUsuarioPerfilField Debug:', {

      columnName,

      filterParams,

      userDataLength: userData.length,

      perfilesDataLength: perfilesData.length

    });

switch (columnName) {

      case 'usuarioid':

        return userData

          .filter(usuario => usuario.statusid === 1)

          .map(usuario => ({

            value: usuario.usuarioid,

            label: `${usuario.nombre} (${usuario.email})`

          }));

      case 'perfilid':

        return perfilesData

          .filter(perfil => perfil.statusid === 1)

          .map(perfil => ({

            value: perfil.perfilid,

            label: `${perfil.perfil} - ${perfil.descripcion || 'Sin descripción'}`

          }));

      default:

        return [];

    }

  };

// loadTableData ahora se importa desde useTableDataManagement
  // Wrapper para mantener compatibilidad con las llamadas existentes
  const loadTableDataWrapper = useCallback(async () => {
    if (!selectedTable) return;
    await loadTableData(selectedTable, initializeFormData);
  }, [selectedTable, loadTableData, initializeFormData]);

const loadTableInfo = async () => {

    if (!selectedTable) return;

try {

      const [, tableInfo] = await Promise.all([

        JoySenseService.getTableData(selectedTable, 1),

        JoySenseService.getTableInfoByName(selectedTable)

      ]);

      // Actualizar el estado con la información de la tabla
      setTableInfo(tableInfo);

// tableData extraído pero no usado localmente - se usa el del hook useTableDataManagement

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

          !['paisid', 'empresaid', 'fundoid', 'ubicacionid', 'entidadid', 'nodoid', 'tipoid', 'metricaid', 'criticidadid', 'perfilid', 'umbralid', 'usuarioid', 'usercreatedid', 'usermodifiedid', 'statusid'].includes(col.columnName)

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

      // const constraints = await JoySenseService.getTableConstraints(selectedTable);

      // setTableConstraints(constraints);

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

// Ordenar por fecha de modificación (más recientes primero) - igual que en loadTableData

      const sortedData = data.sort((a: any, b: any) => {

        const dateA = new Date(a.datemodified || a.datecreated || 0);

        const dateB = new Date(b.datemodified || b.datecreated || 0);

        return dateB.getTime() - dateA.getTime(); // Orden descendente (más recientes primero)

      });

setUpdateData(sortedData);

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

      // const copyItemsPerPage = (selectedTable === 'sensor' || selectedTable === 'metricasensor') ? 10 : 5;

      // setCopyTotalPages(Math.ceil(data.length / copyItemsPerPage));

setCopySearchTerm('');

    } catch (error) {

      console.error('Error loading copy data:', error);

      setMessage({ type: 'error', text: 'Error cargando datos para copiar' });

    }

  };

// getUserName ahora se importa desde systemParametersUtils

// formatDate ahora se importa desde systemParametersUtils

const getCurrentUserId = () => {

    if (!user || !user.email) return 1;

    const currentUser = userData.find(u => u.email === user.email || u.login === user.email);

    return currentUser?.usuarioid || 1;

  };

// Función para obtener el valor de visualización (nombres en lugar de IDs)

  // Función para validar datos antes de insertar usando el sistema de validación robusto

  // validateInsertData ahora se importa desde systemParametersUtils

  // ============================================================================
  // UI & DISPLAY FUNCTIONS
  // ============================================================================

  const getDisplayValueLocal = (row: any, columnName: string) => {
    // Usar la función importada con los datos relacionados
    const relatedData: RelatedData = {
      paisesData,
      empresasData,
      fundosData,
      ubicacionesData,
      entidadesData,
      nodosData,
      tiposData,
      metricasData,
      localizacionesData,
      criticidadesData,
      perfilesData,
      umbralesData,
      userData: userData,
    };
    
    return getDisplayValue(row, columnName, relatedData);

  };

  // ============================================================================
  // CRUD OPERATIONS
  // ============================================================================

  // Función para manejar la selección del tipo de contacto
  const handleContactTypeSelection = (type: 'phone' | 'email') => {
    setSelectedContactType(type);
    setContactTypeModalOpen(false);
    
    // Inicializar formulario con campos básicos
    setFormData({
      usuarioid: '',
      statusid: 1
    });
  };

  const handleInsert = async () => {

    if (!selectedTable || !user) return;

    // Para la tabla contacto, validar que se haya seleccionado un tipo
    if (selectedTable === 'contacto' && !selectedContactType) {
      setMessage({
        type: 'error',
        text: '❌ Debe seleccionar un tipo de contacto primero'
      });
      return;
    }

// Validar datos antes de insertar usando el sistema robusto
    try {
      // Obtener datos existentes para validación de duplicados
      let existingData: any[] = [];
      
      switch (selectedTable) {
        case 'pais':
          existingData = paisesData || [];
          break;
        case 'empresa':
          existingData = empresasData || [];
          break;
        case 'fundo':
          existingData = fundosData || [];
          break;
        case 'ubicacion':
          existingData = ubicacionesData || [];
          break;
        case 'localizacion':
          existingData = localizacionesData || [];
          break;
        case 'entidad':
          existingData = entidadesData || [];
          break;
        case 'tipo':
          existingData = tiposData || [];
          break;
        case 'nodo':
          existingData = nodosData || [];
          break;
        case 'metrica':
          existingData = metricasData || [];
          break;
        case 'umbral':
          existingData = umbralesData || [];
          break;
        case 'perfilumbral':
          existingData = perfilumbralData || [];
          break;
        case 'criticidad':
          existingData = criticidadesData || [];
          break;
        case 'contacto':
          existingData = contactosData || [];
          break;
        case 'perfil':
          existingData = perfilesData || [];
          break;
        case 'sensor':
          existingData = sensorsData || [];
          break;
        case 'metricasensor':
          existingData = metricasensorData || [];
          break;
        case 'usuario':
          existingData = userData || [];
          break;
        default:
          existingData = [];
      }

      // Usar el sistema de validación robusta
      const validationResult = await validateTableData(selectedTable, formData, existingData);
      
      if (!validationResult.isValid) {
        setMessage({ type: 'warning', text: validationResult.userFriendlyMessage });
        return;
      }
    } catch (error) {
      console.error('Error en validación:', error);
      setMessage({ type: 'error', text: 'Error en la validación de datos' });
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


      } else if (selectedTable === 'contacto') {

        filteredData = {

          usuarioid: preparedData.usuarioid,


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

await JoySenseService.insertTableRow(selectedTable, filteredData);

// Agregar el registro insertado al sistema de mensajes

      addInsertedRecord(preparedData);

// Limpiar mensajes de alerta después de inserción exitosa

      setMessage(null);

loadTableDataWrapper();

      loadTableInfo();

      loadUpdateData();

      loadCopyData();

      // Recargar datos relacionados para que aparezcan en comboboxes

      loadRelatedTablesData();

// Reinicializar formulario

      setFormData(initializeFormData(columns));

} catch (error: any) {

      const errorResponse = handleInsertError(error);

      setMessage({ type: errorResponse.type, text: errorResponse.message });

    } finally {

      setLoading(false);

    }

  };

// Función para manejar la creación masiva de sensores

  const handleMassiveSensorCreation = async (dataToApply: any[]) => {

    if (!selectedTable || !user || selectedTable !== 'sensor') return;

try {

      setLoading(true);

const usuarioid = getCurrentUserId();

      const currentTimestamp = new Date().toISOString();

// Preparar datos con información de auditoría

      const preparedData = dataToApply.map(item => ({

        ...item,

        usercreatedid: usuarioid,

        usermodifiedid: usuarioid,

        datecreated: currentTimestamp,

        datemodified: currentTimestamp

      }));

// Verificar si hay duplicados antes de enviar

      const duplicates = preparedData.filter((item, index, self) => 

        index !== self.findIndex(t => 

          t.nodoid === item.nodoid && 

          t.tipoid === item.tipoid

        )

      );

if (duplicates.length > 0) {

        console.warn('⚠️ Se encontraron duplicados en los datos de sensores:', duplicates);

        // Eliminar duplicados

        const uniqueData = preparedData.filter((item, index, self) => 

          index === self.findIndex(t => 

            t.nodoid === item.nodoid && 

            t.tipoid === item.tipoid

          )

        );

preparedData.length = 0;

        preparedData.push(...uniqueData);

      }

// Verificar que los nodoid y tipoid existen

      const nodosExistentes = nodosData?.map(n => n.nodoid) || [];

      const tiposExistentes = tiposData?.map(t => t.tipoid) || [];

const nodosInvalidos = preparedData.filter(item => !nodosExistentes.includes(item.nodoid));

      const tiposInvalidos = preparedData.filter(item => !tiposExistentes.includes(item.tipoid));

if (nodosInvalidos.length > 0) {

        console.error('❌ Nodos inválidos encontrados:', nodosInvalidos);

      }

if (tiposInvalidos.length > 0) {

        console.error('❌ Tipos inválidos encontrados:', tiposInvalidos);

      }

// Realizar inserción masiva usando insertTableRow para cada registro

      for (const record of preparedData) {

        await JoySenseService.insertTableRow(selectedTable, record);

      }

// Agregar registros insertados al sistema de mensajes

      preparedData.forEach(record => {

        addInsertedRecord(record);

      });

// Limpiar mensajes de alerta después de inserción exitosa

      setMessage(null);

// Recargar datos

      loadTableDataWrapper();

      loadTableInfo();

      loadUpdateData();

      loadCopyData();

      loadRelatedTablesData();

setMessage({ 

        type: 'success', 

        text: `Se crearon ${preparedData.length} sensores exitosamente` 

      });

} catch (error: any) {

      console.error('Error en creación masiva de sensores:', error);

      const errorResponse = handleMultipleInsertError(error, 'sensores');

      setMessage({ type: errorResponse.type, text: errorResponse.message });

    } finally {

      setLoading(false);

    }

  };

// handleSearchTermChange ahora se importa desde useSearchAndFilter

// Función para manejar el cambio de campo de búsqueda

  // handleSearchFieldChange ahora se importa desde useSearchAndFilter

// Función para manejar la búsqueda en la tabla de Estado

  // handleStatusSearch ahora se importa desde useSearchAndFilter

// Función para manejar la búsqueda en la tabla de Copiar

  // handleCopySearch ahora se importa desde useSearchAndFilter

// Función para cambiar página en la tabla de Estado

  const handleStatusPageChange = (page: number) => {

    setStatusCurrentPage(page);

  };

// Función para cambiar página en la tabla de Copiar

// Función para obtener los datos paginados de la tabla de Estado

  const getStatusPaginatedData = () => {

    // Para la tabla de Estado, siempre mostrar datos desagregados (sin agrupar)

// Para otras tablas, usar datos normales

    const startIndex = (statusCurrentPage - 1) * itemsPerPage;

    const endIndex = startIndex + itemsPerPage;

    return statusFilteredData.slice(startIndex, endIndex);

  };

// Función para obtener los datos paginados de la tabla de Actualizar

  const getUpdatePaginatedData = () => {
    // Usar updateFilteredData para la tabla de Actualizar
    const sourceData = updateFilteredData;

    // Para metricasensor, sensor y usuarioperfil, agrupar TODOS los datos primero, luego paginar
    if (selectedTable === 'metricasensor' || selectedTable === 'sensor' || selectedTable === 'usuarioperfil') {
      const groupedData = selectedTable === 'metricasensor' 
        ? groupMetricaSensorData(sourceData)
        : selectedTable === 'sensor'
        ? groupSensorData(sourceData)
        : groupUsuarioPerfilData(sourceData);
      
      // Aplicar paginación a los datos agrupados
      const startIndex = (effectiveCurrentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      return groupedData.slice(startIndex, endIndex);
    }

    // Para otras tablas, usar la paginación normal
    return getPaginatedData();

  };

// Asegurar que groupMetricaSensorData tenga acceso a los datos relacionados

  // Este useEffect se eliminó para evitar bucles infinitos

  // El agrupamiento se maneja directamente en getUpdatePaginatedData

// Asegurar que los datos relacionados se carguen para metricasensor

  // Este useEffect se eliminó para evitar bucles infinitos

  // Los datos relacionados se cargan automáticamente cuando se necesita

// Función para obtener los datos paginados de la tabla de Copiar

const handleSelectRowForUpdate = (row: any) => {

    // Limpiar mensajes de alerta al seleccionar nueva entrada
    setUpdateMessage(null);

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

        setIndividualRowStatus({});

        setMessage({ type: 'success', text: 'Selección cancelada' });

        return;

      }

setSelectedRowsForUpdate(selectedEntries);

// Crear formulario con datos del primer nodo (para mostrar valores comunes)

      const firstRow = selectedEntries[0];

      const newFormData: Record<string, any> = {};

      columns.forEach(col => {

        if (!col.isIdentity && !['datecreated', 'datemodified', 'usercreatedid', 'usermodifiedid'].includes(col.columnName)) {

          // Para statusid, preservar el valor 0 (inactivo) en lugar de convertirlo a cadena vacía
          if (col.columnName === 'statusid') {
            newFormData[col.columnName] = firstRow[col.columnName] !== undefined ? firstRow[col.columnName] : '';
          } else {
          newFormData[col.columnName] = firstRow[col.columnName] || '';
          }

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

      // Limpiar mensajes de alerta al cancelar selección
      setUpdateMessage(null);

      setMessage({ type: 'success', text: 'Selección cancelada' });

      return;

    }

setSelectedRowForUpdate(row);

const newFormData: Record<string, any> = {};

    columns.forEach(col => {

      if (!col.isIdentity && !['datecreated', 'datemodified', 'usercreatedid', 'usermodifiedid'].includes(col.columnName)) {

        // Para statusid, preservar el valor 0 (inactivo) en lugar de convertirlo a cadena vacía
        if (col.columnName === 'statusid') {
          newFormData[col.columnName] = row[col.columnName] !== undefined ? row[col.columnName] : '';
        } else {
        newFormData[col.columnName] = row[col.columnName] || '';
        }

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

const handleCancelUpdate = () => {
    // Debug temporal
    console.log('🔍 handleCancelUpdate Debug:', {
      selectedRowForUpdate: !!selectedRowForUpdate,
      updateFormDataKeys: Object.keys(updateFormData),
      updateFormData: updateFormData,
      selectedRowsForUpdateLength: selectedRowsForUpdate.length,
      selectedRowsForManualUpdateLength: selectedRowsForManualUpdate.length,
      searchField,
      searchTerm
    });

    // Verificar cambios directamente aquí, sin usar hasUnsavedChanges
    let hasChanges = false;
    
    // Verificar si hay búsqueda activa
    if (searchField || searchTerm) {
      hasChanges = true;
      console.log('🔍 Hay búsqueda activa');
    }
    
    // Verificar si hay múltiples filas seleccionadas
    if (selectedRowsForUpdate.length > 0 || selectedRowsForManualUpdate.length > 0) {
      hasChanges = true;
      console.log('🔍 Hay filas seleccionadas para actualización múltiple');
    }
    
    // Verificar si hay cambios reales en el formulario de actualización
    if (selectedRowForUpdate && Object.keys(updateFormData).length > 0) {
      console.log('🔍 Verificando cambios en formulario de actualización');
      
      const hasRealChanges = Object.keys(updateFormData).some(key => {
        const originalValue = selectedRowForUpdate[key];
        const currentValue = updateFormData[key];
        
        // Comparar valores, manejando diferentes tipos de datos
        const normalizeValue = (val: any) => {
          if (val === null || val === undefined || val === '') return null;
          return val;
        };
        
        const normalizedOriginal = normalizeValue(originalValue);
        const normalizedCurrent = normalizeValue(currentValue);
        
        const isDifferent = normalizedOriginal !== normalizedCurrent;
        
        if (isDifferent) {
          console.log(`🔍 Campo ${key} ha cambiado:`, {
            original: originalValue,
            current: currentValue,
            normalizedOriginal,
            normalizedCurrent
          });
        }
        
        return isDifferent;
      });
      
      if (hasRealChanges) {
        hasChanges = true;
        console.log('🔍 Hay cambios reales en el formulario');
      }
    }
    
    console.log('🔍 hasChanges result:', hasChanges);
    
    if (hasChanges) {
      // Solo mostrar modal si hay cambios reales
      console.log('🔍 Mostrando modal de cancelación');
      setCancelAction(() => () => {
        setSelectedRowForUpdate(null);
        setSelectedRowsForUpdate([]);
        setSelectedRowsForManualUpdate([]);
        // Limpiar mensajes de alerta al cancelar
        setUpdateMessage(null);
        setUpdateFormData({});
        setIndividualRowStatus({});
        setIsMultipleSelectionMode(false);
        setShowCancelModal(false);
      });
      setShowCancelModal(true);
    } else {
      // Si no hay cambios, cancelar directamente sin modal
      console.log('🔍 No hay cambios, cancelando directamente');
      setSelectedRowForUpdate(null);
      setSelectedRowsForUpdate([]);
      setSelectedRowsForManualUpdate([]);
      setUpdateMessage(null);
      setUpdateFormData({});
      setIndividualRowStatus({});
      setIsMultipleSelectionMode(false);
    }
  };

// Función para pegar datos del portapapeles en el formulario de inserción

  const handlePasteFromClipboardForInsert = async () => {

    try {

      const text = await navigator.clipboard.readText();

const pastedData = JSON.parse(text);

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

// Funciones para obtener nombres de entidades

  const getPaisName = (paisId: string) => {

    const pais = paisesData?.find(p => p.paisid.toString() === paisId);

    return pais ? pais.pais : `País ${paisId}`;

  };

const getEmpresaName = (empresaId: string) => {

    const empresa = empresasData?.find(e => e.empresaid.toString() === empresaId);

    return empresa ? empresa.empresa : `Empresa ${empresaId}`;

  };

const getFundoName = (fundoId: string) => {

    const fundo = fundosData?.find(f => f.fundoid.toString() === fundoId);

    return fundo ? fundo.fundo : `Fundo ${fundoId}`;

  };

  // Función para renderizar filtros globales en formularios de actualización
  const renderGlobalFiltersForUpdate = () => {
    // Solo mostrar filtros globales para tablas que tienen referencias jerárquicas
    const tablesWithGlobalFilters = ['empresa', 'fundo', 'ubicacion', 'localizacion', 'entidad'];
    
    if (!tablesWithGlobalFilters.includes(selectedTable)) {
      return null;
    }

    const contextualFields = [];
    
    // Mostrar País si está seleccionado y la tabla lo requiere
    if (paisSeleccionado && (selectedTable === 'empresa' || selectedTable === 'fundo' || selectedTable === 'ubicacion' || selectedTable === 'localizacion' || selectedTable === 'entidad')) {
      contextualFields.push(
        <div key="pais-contextual">
          <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
            PAÍS 🔒
          </label>
          <div className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-base font-mono cursor-not-allowed opacity-75">
            {getPaisName(paisSeleccionado)}
          </div>
        </div>
      );
    }
    
    // Mostrar Empresa si está seleccionada y la tabla lo requiere
    if (empresaSeleccionada && (selectedTable === 'fundo' || selectedTable === 'ubicacion' || selectedTable === 'localizacion' || selectedTable === 'entidad')) {
      contextualFields.push(
        <div key="empresa-contextual">
          <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
            EMPRESA 🔒
          </label>
          <div className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-base font-mono cursor-not-allowed opacity-75">
            {getEmpresaName(empresaSeleccionada)}
          </div>
        </div>
      );
    }
    
    // Mostrar Fundo si está seleccionado y la tabla lo requiere
    if (fundoSeleccionado && (selectedTable === 'ubicacion' || selectedTable === 'localizacion' || selectedTable === 'entidad')) {
      contextualFields.push(
        <div key="fundo-contextual">
          <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">
            FUNDO 🔒
          </label>
          <div className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-base font-mono cursor-not-allowed opacity-75">
            {getFundoName(fundoSeleccionado)}
          </div>
        </div>
      );
    }

    if (contextualFields.length > 0) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {contextualFields}
        </div>
      );
    }
    
    return null;
  };

    const getUniqueOptionsForField = (columnName: string, filterParams?: { entidadid?: string; nodoid?: string; fundoid?: string; nodoids?: string }) => {

    console.log('🔍 getUniqueOptionsForField Debug:', {

      columnName,

      paisSeleccionado,

      empresaSeleccionada,

      fundoSeleccionado,

      paisesDataLength: paisesData.length,

      empresasDataLength: empresasData.length,

      fundosDataLength: fundosData.length,

      ubicacionesDataLength: ubicacionesData.length

    });

switch (columnName) {

      case 'paisid':

        // Si hay un país seleccionado en filtros globales, solo mostrar ese país

        if (!paisesData || paisesData.length === 0) {

return [];

        }

        if (paisSeleccionado) {

          const filteredPaises = paisesData.filter(pais => pais && pais.paisid && pais.paisid.toString() === paisSeleccionado);

const paisResult = filteredPaises.map(pais => ({ value: pais.paisid, label: pais.pais }));

return paisResult;

        }

        const paisResultAll = paisesData.map(pais => ({ value: pais.paisid, label: pais.pais }));

return paisResultAll;

      case 'empresaid':

        // Filtrar empresas por filtros globales

        if (!empresasData || empresasData.length === 0) {

return [];

        }

        let filteredEmpresas = empresasData;

        if (empresaSeleccionada) {

          // Si hay empresa seleccionada en filtros globales, devolver solo esa empresa

          filteredEmpresas = empresasData.filter(empresa => empresa && empresa.empresaid && empresa.empresaid.toString() === empresaSeleccionada);

} else if (paisSeleccionado) {

          // Si no hay empresa específica pero sí hay país, filtrar por país

          filteredEmpresas = empresasData.filter(empresa => empresa && empresa.paisid && empresa.paisid.toString() === paisSeleccionado);

}

        const empresaResult = filteredEmpresas.map(empresa => ({ value: empresa.empresaid, label: empresa.empresa }));

return empresaResult;

      case 'fundoid':

        // Filtrar fundos por filtros globales

        if (!fundosData || fundosData.length === 0) {

return [];

        }

        let filteredFundos = fundosData;

        if (fundoSeleccionado) {

          // Si hay fundo seleccionado en filtros globales, devolver solo ese fundo

          filteredFundos = fundosData.filter(fundo => fundo && fundo.fundoid && fundo.fundoid.toString() === fundoSeleccionado);

} else if (empresaSeleccionada) {

          // Si no hay fundo específico pero sí hay empresa, filtrar por empresa

          filteredFundos = fundosData.filter(fundo => fundo && fundo.empresaid && fundo.empresaid.toString() === empresaSeleccionada);

}

        const fundoResult = filteredFundos.map(fundo => ({ value: fundo.fundoid, label: fundo.fundo }));

return fundoResult;

      case 'ubicacionid':

        // Filtrar ubicaciones por fundo seleccionado en filtros globales

        if (!ubicacionesData || ubicacionesData.length === 0) {

return [];

        }

        let filteredUbicaciones = ubicacionesData;

        if (fundoSeleccionado) {

          filteredUbicaciones = ubicacionesData.filter(ubicacion => ubicacion && ubicacion.fundoid && ubicacion.fundoid.toString() === fundoSeleccionado);

}

        const ubicacionResult = filteredUbicaciones.map(ubicacion => ({ value: ubicacion.ubicacionid, label: ubicacion.ubicacion }));

return ubicacionResult;

      case 'entidadid':

        // Las entidades son independientes de la jerarquía geográfica

        // Relación: tipo.entidadid -> entidad.entidadid (directa)

        if (!entidadesData || entidadesData.length === 0) {

return [];

        }

// Si estamos en el contexto de metricasensor y hay parámetros de filtro, filtrar entidades

        if (selectedTable === 'metricasensor' && filterParams && filterParams.nodoid) {

          const nodoId = filterParams.nodoid;

// Obtener los tipos de sensores del nodo seleccionado

          const sensoresDelNodo = sensorsData.filter((sensor: any) => sensor.nodoid === parseInt(nodoId));

          const tiposDelNodo = sensoresDelNodo.map((sensor: any) => sensor.tipoid);

// Obtener las entidades únicas de esos tipos

          const entidadesDelNodo = tiposData

            .filter((tipo: any) => tiposDelNodo.includes(tipo.tipoid))

            .map((tipo: any) => tipo.entidadid);

const entidadesUnicas = Array.from(new Set(entidadesDelNodo));

// Filtrar entidades que corresponden a los tipos del nodo

          const entidadesFiltradas = entidadesData.filter(entidad => 

            entidadesUnicas.includes(entidad.entidadid)

          );

const entidadResult = entidadesFiltradas.map(entidad => ({ value: entidad.entidadid, label: entidad.entidad }));

return entidadResult;

        }

// Mostrar todas las entidades disponibles (no filtrar por fundo)

        const entidadResult = entidadesData.map(entidad => ({ value: entidad.entidadid, label: entidad.entidad }));

return entidadResult;

      case 'nodoid':

        // Filtrar nodos por filtros globales y por ubicación seleccionada (para umbral)

        if (!nodosData || nodosData.length === 0) {

return [];

        }

        let filteredNodos = nodosData;

// Para umbral masivo, filtrar nodos que tienen sensor pero NO tienen metricasensor (como metrica sensor)

        if (selectedTable === 'umbral') {

          console.log('🔍 Debug umbral masivo - Datos disponibles:', {

            sensorsDataLength: sensorsData.length,

            tiposDataLength: tiposData.length,

            metricasensorDataLength: metricasensorData.length,

            umbralesDataLength: umbralesData.length,

            nodosDataLength: nodosData.length,

            filterParams

          });

// Obtener nodos que tienen sensor (desde la tabla sensor)

          let nodosConSensor = sensorsData

            .filter((s: any) => s.nodoid)

            .map((s: any) => s.nodoid);

console.log('🔍 Nodos con sensores (todos):', {

            nodosConSensor: nodosConSensor.length,

            primeros5: nodosConSensor.slice(0, 5),

            todosLosNodosConSensor: nodosConSensor

          });

// Si se proporciona entidadid, filtrar por entidad

          if (filterParams?.entidadid) {

            // Filtrar sensor por entidad (a través de tipoid)

            const tiposConEntidad = tiposData.filter((t: any) => 

              t.entidadid && t.entidadid.toString() === filterParams.entidadid?.toString()

            );

            const tiposIds = tiposConEntidad.map((t: any) => t.tipoid);

console.log('🔍 Tipos con entidad:', {

              entidadid: filterParams.entidadid,

              tiposConEntidad: tiposConEntidad.length,

              tiposIds: tiposIds.slice(0, 5)

            });

const sensoresConEntidad = sensorsData.filter((s: any) => 

              s.tipoid && tiposIds.includes(s.tipoid)

            );

            nodosConSensor = sensoresConEntidad

              .filter((s: any) => s.nodoid)

              .map((s: any) => s.nodoid);

console.log('🔍 Sensores con entidad:', {

              sensoresConEntidad: sensoresConEntidad.length,

              nodosConSensor: nodosConSensor.length,

              primeros5: nodosConSensor.slice(0, 5)

            });

          }

// Obtener nodos que ya tienen metricasensor (desde la tabla metricasensor)

          // Obtener nodos que ya tienen umbrales asignados (no metricasensor)
          const nodosConUmbral = umbralesData
            .filter((umbral: any) => umbral && umbral.nodoid)
            .map((umbral: any) => umbral.nodoid);

          console.log('🔍 Nodos con umbrales:', {
            nodosConUmbral: nodosConUmbral.length,
            primeros5: nodosConUmbral.slice(0, 5),
            todosLosNodosConUmbral: nodosConUmbral
          });

// Filtrar nodos que tienen sensor pero NO tienen umbrales asignados
          // Y que tienen ubicación asignada (requerido para umbrales)

          // Obtener nodos que tienen localización
          const nodosConLocalizacion = localizacionesData
            .filter(loc => loc && loc.nodoid)
            .map(loc => loc.nodoid);

          console.log('🔍 Debug localizaciones para umbral masivo:', {
            localizacionesDataLength: localizacionesData?.length || 0,
            nodosConLocalizacionLength: nodosConLocalizacion.length,
            primeros5NodosConLocalizacion: nodosConLocalizacion.slice(0, 5),
            todosLosNodosConLocalizacion: nodosConLocalizacion
          });

          let nodosFiltrados = nodosData.filter(nodo => 

            nodo && nodo.nodoid && 

            nodosConSensor.includes(nodo.nodoid) && 

            !nodosConUmbral.includes(nodo.nodoid) && // Excluir solo nodos que ya tienen umbrales

            nodosConLocalizacion.includes(nodo.nodoid) // Asegurar que el nodo tenga ubicación

          );

console.log('🔍 Nodos filtrados (sensor sin umbral):', {

            nodosFiltrados: nodosFiltrados.length,

            primeros5: nodosFiltrados.slice(0, 5).map(n => ({ nodoid: n.nodoid, nodo: n.nodo })),

            todosLosNodosFiltrados: nodosFiltrados.map(n => ({ nodoid: n.nodoid, nodo: n.nodo }))

          });

          // Debug detallado del filtrado
          console.log('🔍 Debug detallado del filtrado:', {
            totalNodos: nodosData.length,
            nodosConSensor: nodosConSensor.length,
            nodosConUmbral: nodosConUmbral.length,
            nodosConLocalizacion: nodosConLocalizacion.length,
            nodosFiltrados: nodosFiltrados.length,
            criterios: {
              tieneSensor: nodosData.filter(n => nodosConSensor.includes(n.nodoid)).length,
              noTieneUmbral: nodosData.filter(n => !nodosConUmbral.includes(n.nodoid)).length,
              tieneLocalizacion: nodosData.filter(n => nodosConLocalizacion.includes(n.nodoid)).length
            }
          });

          // Verificar específicamente los nodos RLS que acabas de crear
          const nodosRLS = nodosData.filter(n => n.nodo && n.nodo.includes('RLS 333'));
          console.log('🔍 Verificación nodos RLS 333x:', {
            nodosRLS: nodosRLS.map(n => ({
              nodoid: n.nodoid,
              nodo: n.nodo,
              tieneSensor: nodosConSensor.includes(n.nodoid),
              tieneUmbral: nodosConUmbral.includes(n.nodoid),
              tieneLocalizacion: nodosConLocalizacion.includes(n.nodoid)
            }))
          });

          // Verificar TODOS los nodos RLS para encontrar los que creaste
          const todosLosNodosRLS = nodosData.filter(n => n.nodo && n.nodo.toLowerCase().includes('rls'));
          console.log('🔍 TODOS los nodos RLS encontrados:', {
            totalNodosRLS: todosLosNodosRLS.length,
            nodosRLS: todosLosNodosRLS.map(n => ({
              nodoid: n.nodoid,
              nodo: n.nodo,
              tieneSensor: nodosConSensor.includes(n.nodoid),
              tieneUmbral: nodosConUmbral.includes(n.nodoid),
              tieneLocalizacion: nodosConLocalizacion.includes(n.nodoid)
            }))
          });

// Para umbral masivo, NO aplicar filtro de fundo porque los nodos pueden no tener localización

          // pero sí tener sensores asignados. Sin embargo, filtramos nodos sin ubicación

          // ya que es requerido para crear umbrales (necesitan ubicacionid)

          console.log('🔍 Umbral masivo - Sin filtro de fundo aplicado:', {

            nodosFiltrados: nodosFiltrados.length,

            primeros5: nodosFiltrados.slice(0, 5).map(n => ({ nodoid: n.nodoid, nodo: n.nodo }))

          });

filteredNodos = nodosFiltrados;

console.log('🔗 Nodos para umbral masivo (con sensor, sin umbral):', { 

            fundoid: filterParams?.fundoid,

            entidadid: filterParams?.entidadid,

            nodosConSensor: nodosConSensor.length,

            nodosConUmbral: nodosConUmbral.length,

            filteredCount: filteredNodos.length 

          });

        } else if (filterParams?.fundoid && selectedTable !== 'sensor' && selectedTable !== 'localizacion') {

          // Filtrar nodos que pertenecen a ubicaciones del fundo seleccionado

          // Relación: nodo -> localizacion -> ubicacion -> fundo

          // EXCEPTO para sensor masivo y localizacion, donde queremos todos los nodos sin sensores/localización

          if (ubicacionesData && localizacionesData && localizacionesData.length > 0) {

            const ubicacionesDelFundo = ubicacionesData.filter(u => u && u.fundoid && u.fundoid.toString() === filterParams.fundoid);

            const ubicacionIds = ubicacionesDelFundo.map(u => u.ubicacionid);

// Filtrar nodos que tienen localización en ubicaciones del fundo seleccionado

            const nodosConLocalizacion = localizacionesData.filter(loc => 

              loc && loc.ubicacionid && ubicacionIds.includes(loc.ubicacionid)

            );

            const nodoIdsDelFundo = nodosConLocalizacion.map(loc => loc.nodoid);

filteredNodos = nodosData.filter(nodo => 

              nodo && nodo.nodoid && nodo.statusid === 1 && nodoIdsDelFundo.includes(nodo.nodoid)

            );

console.log('🔗 Nodos filtrados por fundo:', { 

              fundoid: filterParams.fundoid, 

              ubicacionesDelFundo: ubicacionesDelFundo.length,

              ubicacionIds: ubicacionIds.length,

              nodosConLocalizacion: nodosConLocalizacion.length,

              nodoIdsDelFundo: nodoIdsDelFundo.length,

              filteredCount: filteredNodos.length 

            });

          }

        } else if (fundoSeleccionado && selectedTable !== 'sensor' && selectedTable !== 'localizacion') {

          // Filtrar nodos que pertenecen a ubicaciones del fundo seleccionado (filtros globales)

          // Relación: nodo -> localizacion -> ubicacion -> fundo

          // EXCEPTO para localizacion, donde queremos nodos sin localización activa

          if (ubicacionesData && localizacionesData && localizacionesData.length > 0) {

            const ubicacionesDelFundo = ubicacionesData.filter(u => u && u.fundoid && u.fundoid.toString() === fundoSeleccionado);

            const ubicacionIds = ubicacionesDelFundo.map(u => u.ubicacionid);

// Filtrar nodos que tienen localización en ubicaciones del fundo seleccionado

            const nodosConLocalizacion = localizacionesData.filter(loc => 

              loc && loc.ubicacionid && ubicacionIds.includes(loc.ubicacionid)

            );

            const nodoIdsDelFundo = nodosConLocalizacion.map(loc => loc.nodoid);

filteredNodos = nodosData.filter(nodo => 

              nodo && nodo.nodoid && nodo.statusid === 1 && nodoIdsDelFundo.includes(nodo.nodoid)

            );

console.log('🔗 Filtros globales aplicados a nodos:', { 

              fundoSeleccionado, 

              ubicacionesDelFundo: ubicacionesDelFundo.length, 

              ubicacionIds: ubicacionIds.length,

              nodosConLocalizacion: nodosConLocalizacion.length,

              nodoIdsDelFundo: nodoIdsDelFundo.length,

              filteredCount: filteredNodos.length 

            });

          }

        }

// Para sensor y metricasensor masivo, mostrar todos los nodos activos (sin filtros de fundo)

        if (selectedTable === 'sensor' || selectedTable === 'metricasensor') {

filteredNodos = nodosData.filter(nodo => nodo && nodo.nodoid && nodo.statusid === 1);

}

// Filtrar nodos según el contexto

        let finalFilteredNodos = filteredNodos;

// Si estamos en el contexto de sensor, filtrar nodos que estén en nodo pero no en sensor

        if (selectedTable === 'sensor') {

          // Obtener todos los nodos que ya tienen sensores asignados

          const nodosConSensores = new Set(tableData.map(sensor => sensor.nodoid));

finalFilteredNodos = filteredNodos.filter(nodo => {

            // Verificar que el nodo esté activo

            if (nodo.statusid !== 1) {

              return false;

            }

// Verificar que el nodo NO tenga sensores asignados (no esté en tabla sensor)

            const tieneSensores = nodosConSensores.has(nodo.nodoid);

            return !tieneSensores;

          });

}

// Si estamos en el contexto de metricasensor, mostrar nodos que tienen sensores pero NO tienen métricas sensor

        if (selectedTable === 'metricasensor') {

          // Usar datos de sensores cargados específicamente para metricasensor

          const sensorData = sensorsData || [];

// Obtener nodos que ya tienen métricas sensor asignadas

          const nodosConMetricasSensor = new Set(tableData.map(ms => ms.nodoid));

finalFilteredNodos = filteredNodos.filter(nodo => {

            // Verificar que el nodo esté activo

            if (nodo.statusid !== 1) {

              return false;

            }

// Verificar que el nodo tenga sensores (esté en tabla sensor)

            const tieneSensores = sensorData.some((sensor: any) => sensor.nodoid === nodo.nodoid);

            if (!tieneSensores) {

              return false;

            }

// Verificar que el nodo NO tenga métricas sensor asignadas

            const tieneMetricasSensor = nodosConMetricasSensor.has(nodo.nodoid);

            if (tieneMetricasSensor) {

              return false;

            }

// Si hay filtro por entidad, verificar que el nodo tenga sensores con tipos de esa entidad

            if (filterParams && filterParams.entidadid) {

              const entidadId = parseInt(filterParams.entidadid);

// Obtener los sensores del nodo

              const sensoresDelNodo = sensorData.filter((sensor: any) => sensor.nodoid === nodo.nodoid);

// Obtener los tipos de esos sensores

              const tiposDelNodo = sensoresDelNodo.map((sensor: any) => sensor.tipoid);

// Verificar que al menos uno de esos tipos pertenezca a la entidad seleccionada

              const tieneTiposDeEntidad = tiposData.some((tipo: any) => 

                tiposDelNodo.includes(tipo.tipoid) && tipo.entidadid === entidadId

              );

if (!tieneTiposDeEntidad) {

                return false;

              }

            }

return true;

          });

}

// Ordenar nodos por fecha de modificación (más recientes primero)

        const sortedNodos = finalFilteredNodos.sort((a: any, b: any) => {

          const dateA = new Date(a.datemodified || a.datecreated || 0);

          const dateB = new Date(b.datemodified || b.datecreated || 0);

          return dateB.getTime() - dateA.getTime(); // Orden descendente (más recientes primero)

        });

let nodoResult = sortedNodos.map(nodo => {

          // Buscar la localización del nodo para verificar si tiene localización activa

          const localizacion = localizacionesData?.find(loc => loc.nodoid === nodo.nodoid);

return { 

            value: nodo.nodoid, 

            label: nodo.nodo,

            datecreated: nodo.datecreated,

            hasActiveLocalization: !!localizacion // true si tiene localización activa

          };

        });

// Para sensor, metricasensor y umbral masivo, incluir TODOS los nodos (con o sin localización)

        // Para localizacion, solo incluir nodos SIN localización activa (disponibles para asignar)

        // Para otros contextos, solo incluir nodos con localización activa

        if (selectedTable === 'localizacion') {

          // Para localización: mostrar solo nodos que NO tienen localización activa
          nodoResult = nodoResult.filter(nodo => !nodo.hasActiveLocalization);

        } else if (selectedTable !== 'sensor' && selectedTable !== 'metricasensor' && selectedTable !== 'umbral') {

          // Para otros contextos: solo nodos con localización activa
          nodoResult = nodoResult.filter(nodo => nodo.hasActiveLocalization);

        }

return nodoResult;

      case 'tipoid':

        if (!tiposData || tiposData.length === 0) {

return [];

        }

console.log('🏷️ Datos de tipos disponibles:', tiposData.slice(0, 3)); // Mostrar primeros 3 tipos para debug

// Filtrar tipos por entidad si se proporciona

        let filteredTipos = tiposData;

// Para umbral masivo, filtrar tipos por nodos seleccionados

        if (selectedTable === 'umbral' && filterParams?.nodoids && Array.isArray(filterParams.nodoids)) {

          const nodoIds = filterParams.nodoids.map((id: number) => id);

          const sensoresDeNodos = sensorsData.filter(sensor => 

            sensor.nodoid && nodoIds.includes(sensor.nodoid)

          );

          const tiposDeNodos = sensoresDeNodos.map(sensor => sensor.tipoid);

filteredTipos = filteredTipos.filter(tipo => 

            tipo.tipoid && tiposDeNodos.includes(tipo.tipoid)

          );

console.log('🏷️ Tipos filtrados por nodos para umbral masivo:', {

            nodoIds,

            sensoresDeNodos: sensoresDeNodos.length,

            tiposDeNodos: tiposDeNodos.length,

            filteredCount: filteredTipos.length

          });

        } else if (filterParams?.entidadid) {

          // Filtrar tipos por entidad usando la columna entidadid de la tabla tipo

          filteredTipos = tiposData.filter(tipo => 

            tipo.entidadid && tipo.entidadid.toString() === filterParams.entidadid?.toString()

          );

// Si también hay filtro por nodos específicos, filtrar por esos nodos

          if (filterParams?.nodoids && Array.isArray(filterParams.nodoids)) {

            const nodoIds = filterParams.nodoids.map((id: number) => id);

// Obtener tipos que están asociados a estos nodos específicos a través de sensores

            const sensoresDeNodos = sensorsData.filter(sensor => 

              sensor.nodoid && nodoIds.includes(sensor.nodoid)

            );

            const tiposDeNodos = sensoresDeNodos.map(sensor => sensor.tipoid);

filteredTipos = filteredTipos.filter(tipo => 

              tipo.tipoid && tiposDeNodos.includes(tipo.tipoid)

            );

console.log('🏷️ Tipos filtrados por entidad y nodos específicos:', {

              entidadid: filterParams.entidadid,

              nodoIds,

              sensoresDeNodos: sensoresDeNodos.length,

              tiposDeNodos: tiposDeNodos.length,

              totalTipos: tiposData.length,

              tiposFiltrados: filteredTipos.length,

              tiposFiltradosData: filteredTipos.slice(0, 3)

            });

          } else if (filterParams?.nodoid) {
            // Filtrar tipos por nodo específico individual (para metrica sensor)
            const nodoId = parseInt(filterParams.nodoid);
            
            // Obtener sensores que pertenecen a este nodo específico
            const sensoresDelNodo = sensorsData.filter(sensor => 
              sensor.nodoid && sensor.nodoid === nodoId
            );
            
            const tiposDelNodo = sensoresDelNodo.map(sensor => sensor.tipoid);
            
            // Filtrar tipos que están asociados a este nodo específico
            filteredTipos = filteredTipos.filter(tipo => 
              tipo.tipoid && tiposDelNodo.includes(tipo.tipoid)
            );
            
            console.log('🏷️ Tipos filtrados por entidad y nodo específico:', {
              entidadid: filterParams.entidadid,
              nodoid: filterParams.nodoid,
              sensoresDelNodo: sensoresDelNodo.length,
              tiposDelNodo: tiposDelNodo.length,
              tiposFiltrados: filteredTipos.length,
              tiposFiltradosData: filteredTipos.slice(0, 3)
            });

          } else {

          console.log('🏷️ Tipos filtrados por entidad:', {

            entidadid: filterParams.entidadid,

            totalTipos: tiposData.length,

            tiposFiltrados: filteredTipos.length,

              tiposFiltradosData: filteredTipos.slice(0, 3)

          });

          }

        }

const tipoResult = filteredTipos.map(tipo => ({ 
          value: tipo.tipoid, 
          label: tipo.tipo,
          entidadid: tipo.entidadid 
        }));

return tipoResult;

      case 'metricaid':

        if (!metricasData || metricasData.length === 0) {

return [];

        }

        // Si se especifican nodoids, filtrar métricas que existen en metricasensor para esos nodos
        if (filterParams?.nodoids) {
          const nodoidsString = filterParams.nodoids;
          const nodoids = nodoidsString.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
          
          // Obtener métricas que existen en metricasensor para los nodos especificados
          const metricasEnMetricasensor = metricasensorData?.filter(ms => 
            ms && ms.metricaid && nodoids.includes(ms.nodoid)
          ) || [];
          
          const metricaIdsUnicos = Array.from(new Set(metricasEnMetricasensor.map(ms => ms.metricaid)));
          
          const metricaResult = metricasData
            .filter(metrica => metricaIdsUnicos.includes(metrica.metricaid))
            .map(metrica => ({ 
              value: metrica.metricaid, 
              label: metrica.metrica,
              unidad: metrica.unidad 
            }));

          return metricaResult;
        }

        const metricaResult = metricasData.map(metrica => ({ 
          value: metrica.metricaid, 
          label: metrica.metrica,
          unidad: metrica.unidad 
        }));

return metricaResult;

      case 'localizacionid':

        return []; // Por ahora vacío, ya que localizacion se crea después del nodo

      case 'criticidadid':

        if (!criticidadesData || criticidadesData.length === 0) {

return [];

        }

        const criticidadResult = criticidadesData.map(criticidad => ({ value: criticidad.criticidadid, label: criticidad.criticidad }));

return criticidadResult;

      case 'perfilid':

        if (!perfilesData || perfilesData.length === 0) {

return [];

        }

        const perfilResult = perfilesData.map(perfil => ({ value: perfil.perfilid, label: perfil.perfil }));

return perfilResult;

      case 'umbralid':

        if (!umbralesData || umbralesData.length === 0) {

return [];

        }

        const umbralResult = umbralesData.map(umbral => ({ value: umbral.umbralid, label: umbral.umbral }));

return umbralResult;

      case 'usuarioid':

        if (!userData || userData.length === 0) {

return [];

        }

        const usuarioResult = userData.map(user => ({ 

          value: user.usuarioid, 

          label: `${user.firstname} ${user.lastname}` 

        }));

return usuarioResult;


      case 'usercreatedid':
      case 'usermodifiedid':

        if (!userData || userData.length === 0) {

return [];

        }

        const modifiedByResult = userData.map(user => ({ 

          value: user.usuarioid, 

          label: `${user.firstname} ${user.lastname}` 

        }));

return modifiedByResult;

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

      // Para metricasensor agrupado, usar solo nodoid como identificador único

      if (row.nodoid !== undefined) {

        return `grouped-${row.nodoid}`;

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

// Función específica para manejar actualizaciones del formulario avanzado de metricasensor

  const handleAdvancedMetricaSensorUpdate = async (updatedEntries: any[]) => {

    try {

      setUpdateLoading(true);

let successCount = 0;
      let actualChangesCount = 0;
      let errorCount = 0;

for (let i = 0; i < updatedEntries.length; i++) {

        const row = updatedEntries[i];

        const compositeKey = { 

          nodoid: row.nodoid, 

          tipoid: row.tipoid, 

          metricaid: row.metricaid 

        };

// Preparar datos para actualización

        const updateData: any = {

          statusid: row.statusid,

          usermodifiedid: row.usermodifiedid,

          datemodified: row.datemodified

        };

// Para metricasensor, siempre contar como cambio si se está procesando
        // La lógica de detección de cambios reales se maneja en el frontend
        const hasActualChanges = true;

        // Si es una nueva entrada, incluir datos de creación

        if (row.usercreatedid && row.datecreated) {

          updateData.usercreatedid = row.usercreatedid;

          updateData.datecreated = row.datecreated;

        }

try {

          const result = await JoySenseService.updateTableRowByCompositeKey(

            selectedTable,

            compositeKey,

            updateData

          );

if (result && result.success) {

            successCount++;
            
            // Solo contar si realmente hubo cambios
            if (hasActualChanges) {
              actualChangesCount++;
            }

} else {

            errorCount++;

            console.error(`❌ Error en actualización ${i + 1}:`, result?.error || 'Resultado undefined');

          }

        } catch (error) {

          errorCount++;

          console.error(`❌ Error en actualización ${i + 1}:`, error);

        }

      }

if (successCount > 0) {

        setUpdateMessage({ 

          type: 'success', 

          text: `✅ ${actualChangesCount} entradas actualizadas exitosamente` 

        });

// Recargar datos después de la actualización

        await loadUpdateData();

        await loadTableDataWrapper();

// Limpiar selección

        setSelectedRowsForUpdate([]);

        setSelectedRowsForManualUpdate([]);

        setSelectedRowForUpdate(null);

        setUpdateFormData({});

        setIsMultipleSelectionMode(false);

      }

if (errorCount > 0) {

        setUpdateMessage({ 

          type: 'error', 

          text: `❌ ${errorCount} entradas fallaron al actualizar` 

        });

      }

} catch (error) {

      console.error('❌ Error general en actualización avanzada:', error);

      setUpdateMessage({ 

        type: 'error', 

        text: 'Error al actualizar las entradas' 

      });

    } finally {

      setUpdateLoading(false);

    }

  };

// Función específica para manejar actualizaciones del formulario avanzado de sensor

  const handleAdvancedSensorUpdate = async (updatedEntries: any[]) => {

try {

      setUpdateLoading(true);

let successCount = 0;
      let actualChangesCount = 0;
      let errorCount = 0;

for (let i = 0; i < updatedEntries.length; i++) {

        const row = updatedEntries[i];

        const compositeKey = { 

          nodoid: row.nodoid, 

          tipoid: row.tipoid

        };

// Preparar datos para actualización

        const updateData: any = {

          statusid: row.statusid,

          usermodifiedid: row.usermodifiedid,

          datemodified: row.datemodified

        };

// Para sensor, siempre contar como cambio si se está procesando
        // La lógica de detección de cambios reales se maneja en el frontend
        const hasActualChanges = true;

        // Si es una nueva entrada, incluir datos de creación

        if (row.usercreatedid && row.datecreated) {

          updateData.usercreatedid = row.usercreatedid;

          updateData.datecreated = row.datecreated;

        }

try {

          const result = await JoySenseService.updateTableRowByCompositeKey(

            selectedTable,

            compositeKey,

            updateData

          );

if (result && result.success) {

            successCount++;
            
            // Solo contar si realmente hubo cambios
            if (hasActualChanges) {
              actualChangesCount++;
            }

} else {

            errorCount++;

            console.error(`❌ Error en actualización ${i + 1}:`, result?.error || 'Resultado undefined');

          }

        } catch (error) {

          errorCount++;

          console.error(`❌ Error en actualización ${i + 1}:`, error);

        }

      }

if (successCount > 0) {

        setUpdateMessage({ 

          type: 'success', 

          text: `✅ ${actualChangesCount} entradas actualizadas exitosamente` 

        });

// Recargar datos después de la actualización

        await loadUpdateData();

        await loadTableDataWrapper();

// Limpiar selección

        setSelectedRowsForUpdate([]);

        setSelectedRowsForManualUpdate([]);

        setSelectedRowForUpdate(null);

        setUpdateFormData({});

        setIsMultipleSelectionMode(false);

      }

if (errorCount > 0) {

        setUpdateMessage({ 

          type: 'error', 

          text: `❌ ${errorCount} entradas fallaron al actualizar` 

        });

      }

} catch (error) {

      console.error('❌ Error general en actualización avanzada de sensor:', error);

      setUpdateMessage({ 

        type: 'error', 

        text: 'Error al actualizar las entradas de sensor' 

      });

    } finally {

      setUpdateLoading(false);

    }

  };

// Función específica para manejar actualizaciones del formulario avanzado de usuarioperfil

  const handleAdvancedUsuarioPerfilUpdate = async (updatedEntries: any[]) => {

    try {

      setUpdateLoading(true);

let successCount = 0;
      let actualChangesCount = 0;
      let errorCount = 0;

for (let i = 0; i < updatedEntries.length; i++) {

        const row = updatedEntries[i];

        const compositeKey = { 

          usuarioid: row.usuarioid, 

          perfilid: row.perfilid

        };

// Preparar datos para actualización

        const updateData: any = {

          statusid: row.statusid,

          usermodifiedid: row.usermodifiedid,

          datemodified: row.datemodified

        };

// Para usuarioperfil, siempre contar como cambio si se está procesando
        // La lógica de detección de cambios reales se maneja en el frontend
        const hasActualChanges = true;

        // Si es una nueva entrada, incluir datos de creación

        if (row.usercreatedid && row.datecreated) {

          updateData.usercreatedid = row.usercreatedid;

          updateData.datecreated = row.datecreated;

        }

try {

          let result;

// Si es una nueva entrada (sin usercreatedid), usar upsert

          if (!row.usercreatedid) {

result = await JoySenseService.insertTableRow(selectedTable, {

              usuarioid: row.usuarioid,

              perfilid: row.perfilid,

              statusid: row.statusid,

              usercreatedid: getCurrentUserId(),

              datecreated: new Date().toISOString(),

              usermodifiedid: getCurrentUserId(),

              datemodified: new Date().toISOString()

            });

          } else {

            // Si es una entrada existente, usar update

            result = await JoySenseService.updateTableRowByCompositeKey(

              selectedTable,

              compositeKey,

              updateData

            );

          }

if (result && result.success) {

            successCount++;
            
            // Solo contar si realmente hubo cambios
            if (hasActualChanges) {
              actualChangesCount++;
            }

} else {

            errorCount++;

            console.error(`❌ Error en actualización ${i + 1}:`, result?.error || 'Resultado undefined');

          }

        } catch (error) {

          errorCount++;

          console.error(`❌ Error en actualización ${i + 1}:`, error);

        }

      }

if (successCount > 0) {

        setUpdateMessage({ 

          type: 'success', 

          text: `✅ ${actualChangesCount} entradas actualizadas exitosamente` 

        });

// Recargar datos después de la actualización

        await loadUpdateData();

        await loadTableDataWrapper();

// Limpiar selección

        setSelectedRowsForUpdate([]);

        setSelectedRowsForManualUpdate([]);

        setSelectedRowForUpdate(null);

        setUpdateFormData({});

        setIsMultipleSelectionMode(false);

      }

if (errorCount > 0) {

        setUpdateMessage({ 

          type: 'error', 

          text: `❌ ${errorCount} entradas fallaron al actualizar` 

        });

      }

} catch (error) {

      console.error('❌ Error general en actualización avanzada usuarioperfil:', error);

      setUpdateMessage({ 

        type: 'error', 

        text: 'Error al actualizar las entradas' 

      });

    } finally {

      setUpdateLoading(false);

    }

  };

// Función para obtener los campos que se pueden actualizar por tabla
  const getFieldsToUpdate = (tableName: string): string[] => {
    const fieldMappings: Record<string, string[]> = {
      'pais': ['pais', 'paisabrev', 'statusid'],
      'empresa': ['empresa', 'empresabrev', 'paisid', 'statusid'],
      'fundo': ['fundo', 'fundoabrev', 'empresaid', 'statusid'],
      'ubicacion': ['ubicacion', 'fundoid', 'statusid'],
      'localizacion': ['ubicacionid', 'nodoid', 'entidadid', 'latitud', 'longitud', 'referencia', 'statusid'],
      'entidad': ['entidad', 'statusid'],
      'tipo': ['tipo', 'entidadid', 'statusid'],
      'nodo': ['nodo', 'deveui', 'appeui', 'appkey', 'atpin', 'statusid'],
      'metrica': ['metrica', 'unidad', 'statusid'],
    'umbral': ['umbral', 'ubicacionid', 'criticidadid', 'nodoid', 'metricaid', 'tipoid', 'minimo', 'maximo', 'statusid'],
    'perfilumbral': ['perfilid', 'umbralid', 'statusid'],
    'criticidad': ['criticidad', 'criticidadbrev', 'statusid'],
    'perfil': ['perfil', 'nivel', 'statusid'],
    'usuario': ['login', 'nombre', 'apellido', 'rol', 'activo', 'statusid'],
    'contacto': ['usuarioid', 'celular', 'codigotelefonoid', 'statusid'],
    'usuarioperfil': ['usuarioid', 'perfilid', 'statusid']
    };
    
    return fieldMappings[tableName] || ['statusid'];
  };

  // Función para determinar si un campo es opcional
  const isOptionalField = (tableName: string, fieldName: string): boolean => {
    const optionalFields: Record<string, string[]> = {
      'pais': [],
      'empresa': [],
      'fundo': [],
      'ubicacion': [],
      'localizacion': ['latitud', 'longitud', 'referencia', 'entidadid'],
      'entidad': [],
      'tipo': [],
      'nodo': ['deveui', 'appeui', 'appkey', 'atpin'],
      'metrica': [],
      'umbral': ['minimo', 'maximo'],
      'perfilumbral': [],
      'criticidad': [],
      'medio': [],
      'perfil': ['nivel'],
      'usuario': [],
      'contacto': ['celular', 'correo'],
      'usuarioperfil': []
    };
    
    return optionalFields[tableName]?.includes(fieldName) || false;
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

        if (selectedTable === 'metricasensor') {

          // Para metricasensor agrupado, expandir las filas originales

          rowsToUpdate = selectedRowsForManualUpdate.flatMap(row => 

            row.originalRows ? row.originalRows : [row]

          );

} else if (selectedTable === 'usuarioperfil') {

          // Para usuarioperfil agrupado, expandir las filas originales

          rowsToUpdate = selectedRowsForManualUpdate.flatMap(row => 

            row.originalRows ? row.originalRows : [row]

          );

} else {

          rowsToUpdate = selectedRowsForManualUpdate;

}

      } else if (selectedRowsForUpdate && selectedRowsForUpdate.length > 0) {

        // Modo de selección automática (legacy)

        rowsToUpdate = selectedRowsForUpdate;

} else {

        // Modo de actualización individual

        rowsToUpdate = [updateFormData];

}

if (selectedTable === 'sensor' || selectedTable === 'metricasensor') {

        // Actualización múltiple para sensor y metricasensor

        // Ejecutar actualizaciones de forma secuencial para evitar conflictos de concurrencia

        let successCount = 0;
        let actualChangesCount = 0;
        let errorCount = 0;

for (let i = 0; i < rowsToUpdate.length; i++) {

          const row = rowsToUpdate[i];

          const compositeKey = selectedTable === 'sensor' 

            ? { nodoid: row.nodoid, tipoid: row.tipoid }

            : { nodoid: row.nodoid, tipoid: row.tipoid, metricaid: row.metricaid };

// Usar el estado individual de cada fila para el statusid

          const rowKey = `${row.nodoid || row.id || i}-${i}`;

          const individualStatus = individualRowStatus[rowKey];

// Filtrar solo los campos que realmente necesitamos actualizar

          const fieldsToUpdate = ['statusid']; // Solo actualizar statusid por ahora

          const filteredUpdateData: Record<string, any> = {};

          fieldsToUpdate.forEach(field => {

            if (field === 'statusid') {

              // Usar el estado individual de la fila

              filteredUpdateData[field] = individualStatus ? 1 : 0;

            } else if (updateFormData[field] !== undefined) {

              filteredUpdateData[field] = updateFormData[field];

            }

          });

try {

            await JoySenseService.updateTableRowByCompositeKey(

            selectedTable,

            compositeKey,

              filteredUpdateData

            );

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

            text: `✅ ${actualChangesCount} entradas actualizadas exitosamente` 

          });

        }

// Recargar datos después de actualización exitosa

        await loadUpdateData();

        await loadCopyData();

      } else {

        // Actualización individual para otras tablas

        const rowId = getRowId(updateFormData, selectedTable);

if (!rowId) {

          setUpdateMessage({ type: 'error', text: 'No se pudo determinar el ID de la fila a actualizar' });

          setUpdateLoading(false);

          return;

        }

// Validar datos antes de procesar
        try {
          const validationResult = await validateTableUpdate(
            selectedTable,
            updateFormData, // Usar datos originales del formulario
            selectedRowForUpdate, // Datos originales de la BD
            tableData // Datos existentes para validar duplicados
          );
          
          if (!validationResult.isValid) {
            setUpdateMessage({ type: 'warning', text: validationResult.userFriendlyMessage });
            setUpdateLoading(false);
            return;
          }
        } catch (error) {
          console.error('Error en validación de actualización:', error);
          setUpdateMessage({ type: 'error', text: 'Error en la validación de datos' });
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

            const fieldsToUpdate = ['statusid', 'latitud', 'longitud', 'referencia'];

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

result = await JoySenseService.updateTableRowByCompositeKey(

          selectedTable,

            compositeKey,

            filteredUpdateData

          );

        } else {

          // Para otras tablas, usar ID simple

          // Filtrar solo los campos que realmente necesitamos actualizar

          const fieldsToUpdate = getFieldsToUpdate(selectedTable);

          const filteredUpdateData: Record<string, any> = {};

          fieldsToUpdate.forEach(field => {

            if (updateFormData[field] !== undefined) {

              // Para campos opcionales vacíos, no incluir el campo en la actualización
              if (typeof updateFormData[field] === 'string' && 
                  updateFormData[field].trim() === '' && 
                  isOptionalField(selectedTable, field)) {
                // No incluir campos opcionales vacíos en la actualización
                return;
              }

              filteredUpdateData[field] = updateFormData[field];

            }

          });

// Debug específico para metrica
          if (selectedTable === 'metrica') {
          }

          // Validación ya se ejecutó arriba

          await JoySenseService.updateTableRow(

            selectedTable,

            rowId,

            filteredUpdateData

          );

        }

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

      setIndividualRowStatus({});

      setIsMultipleSelectionMode(false);

// Recargar datos

      await loadTableDataWrapper();

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

// Ref para evitar logs repetitivos en getVisibleColumns
  const lastLogKeyRef = useRef<string | null>(null);

  const getVisibleColumns = useCallback((forTable: boolean = true) => {
    const sourceColumns = forTable ? tableColumns : columns;
    
    // Solo hacer log si hay cambios significativos para evitar spam
    const logKey = `${selectedTable}-${forTable}-${sourceColumns?.length}`;
    if (!lastLogKeyRef.current || lastLogKeyRef.current !== logKey) {
      console.log('🔍 getVisibleColumns Debug:', {
        selectedTable,
        forTable,
        columnsLength: sourceColumns?.length,
        allColumns: sourceColumns?.map(c => c.columnName)
      });
      lastLogKeyRef.current = logKey;
    }

    // FIX: Validar que las columnas estén cargadas antes de continuar
    if (!sourceColumns || sourceColumns.length === 0) {
      console.warn('⚠️ getVisibleColumns: columnas no están cargadas aún, retornando array vacío');
      return [];
    }

if (selectedTable === 'fundo') {

}

// Para la tabla nodo, necesitamos incluir campos que están después de usercreatedid

    if (selectedTable === 'nodo') {

      const nodoColumns = sourceColumns.filter(col => {

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

    let filteredColumns = sourceColumns.filter(col => {

      if (selectedTable === 'pais') {

        return ['pais', 'paisabrev', 'statusid', 'usercreatedid', 'datecreated', 'usermodifiedid', 'datemodified'].includes(col.columnName);

      }

if (selectedTable === 'empresa') {

        return ['paisid', 'empresa', 'empresabrev', 'statusid', 'usercreatedid', 'datecreated', 'usermodifiedid', 'datemodified'].includes(col.columnName);

      }

if (selectedTable === 'fundo') {

        const isIncluded = ['paisid', 'empresaid', 'fundo', 'fundoabrev', 'statusid', 'usercreatedid', 'datecreated', 'usermodifiedid', 'datemodified'].includes(col.columnName);

return isIncluded;

      }

if (selectedTable === 'ubicacion') {

        return ['paisid', 'empresaid', 'fundoid', 'ubicacion', 'statusid', 'usercreatedid', 'datecreated', 'usermodifiedid', 'datemodified'].includes(col.columnName);

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

        return ['paisid', 'empresaid', 'fundoid', 'ubicacionid', 'nodoid', 'latitud', 'longitud', 'referencia', 'statusid', 'entidadid', 'usercreatedid', 'datecreated', 'usermodifiedid', 'datemodified'].includes(col.columnName);

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

        return ['usuarioid', 'celular', 'codigotelefonoid', 'statusid', 'usercreatedid', 'datecreated', 'usermodifiedid', 'datemodified'].includes(col.columnName);

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

    // INYECTAR COLUMNAS FALTANTES PARA FORMULARIOS

    const injectedColumns = [...filteredColumns];

if (selectedTable === 'fundo') {

      // Inyectar paisid si no existe

      if (!injectedColumns.some(col => col.columnName === 'paisid')) {

        injectedColumns.unshift({

          columnName: 'paisid',

          dataType: 'integer',

          isNullable: false,

          isIdentity: false,

          isPrimaryKey: false,

          isForeignKey: true,

          defaultValue: null

        });

      }

    }

if (selectedTable === 'ubicacion') {

      // Inyectar paisid y empresaid si no existen

      if (!injectedColumns.some(col => col.columnName === 'paisid')) {

        injectedColumns.unshift({

          columnName: 'paisid',

          dataType: 'integer',

          isNullable: false,

          isIdentity: false,

          isPrimaryKey: false,

          isForeignKey: true,

          defaultValue: null

        });

      }

      if (!injectedColumns.some(col => col.columnName === 'empresaid')) {

        injectedColumns.unshift({

          columnName: 'empresaid',

          dataType: 'integer',

          isNullable: false,

          isIdentity: false,

          isPrimaryKey: false,

          isForeignKey: true,

          defaultValue: null

        });

      }

    }

if (selectedTable === 'localizacion') {

      // Inyectar paisid, empresaid, fundoid si no existen

      if (!injectedColumns.some(col => col.columnName === 'paisid')) {

        injectedColumns.unshift({

          columnName: 'paisid',

          dataType: 'integer',

          isNullable: false,

          isIdentity: false,

          isPrimaryKey: false,

          isForeignKey: true,

          defaultValue: null

        });

      }

      if (!injectedColumns.some(col => col.columnName === 'empresaid')) {

        injectedColumns.unshift({

          columnName: 'empresaid',

          dataType: 'integer',

          isNullable: false,

          isIdentity: false,

          isPrimaryKey: false,

          isForeignKey: true,

          defaultValue: null

        });

      }

      if (!injectedColumns.some(col => col.columnName === 'fundoid')) {

        injectedColumns.unshift({

          columnName: 'fundoid',

          dataType: 'integer',

          isNullable: false,

          isIdentity: false,

          isPrimaryKey: false,

          isForeignKey: true,

          defaultValue: null

        });

      }

    }

// Reordenar columnas según los requerimientos específicos

    const reorderedColumns = [];

    const statusColumn = injectedColumns.find(col => col.columnName === 'statusid');

    const auditColumns = injectedColumns.filter(col => ['usercreatedid', 'datecreated', 'usermodifiedid', 'datemodified'].includes(col.columnName));

    const otherColumns = injectedColumns.filter(col => !['statusid', 'usercreatedid', 'datecreated', 'usermodifiedid', 'datemodified'].includes(col.columnName));

if (selectedTable === 'fundo') {

}

// Para las tablas, reordenar según los requerimientos específicos (tanto para Estado como para Actualizar)

    if (selectedTable === 'pais') {

      // Pais, Abreviatura

      reorderedColumns.push(...otherColumns.filter(col => ['pais'].includes(col.columnName)));

      reorderedColumns.push(...otherColumns.filter(col => ['paisabrev'].includes(col.columnName)));

    } else if (selectedTable === 'empresa') {

        // Pais, Empresa, Abreviatura

        reorderedColumns.push(...otherColumns.filter(col => ['paisid'].includes(col.columnName)));

        reorderedColumns.push(...otherColumns.filter(col => ['empresa'].includes(col.columnName)));

        reorderedColumns.push(...otherColumns.filter(col => ['empresabrev'].includes(col.columnName)));

      } else if (selectedTable === 'fundo') {

        // Empresa, Fundo, Abreviatura (sin País - solo referencial en formulario)

        reorderedColumns.push(...otherColumns.filter(col => ['empresaid'].includes(col.columnName)));

        reorderedColumns.push(...otherColumns.filter(col => ['fundo'].includes(col.columnName)));

      reorderedColumns.push(...otherColumns.filter(col => ['fundoabrev'].includes(col.columnName)));

      } else if (selectedTable === 'ubicacion') {

        // Fundo, Ubicacion (sin Empresa y Pais)

        reorderedColumns.push(...otherColumns.filter(col => ['fundoid'].includes(col.columnName)));

        reorderedColumns.push(...otherColumns.filter(col => ['ubicacion'].includes(col.columnName)));

      } else if (selectedTable === 'localizacion') {

        // Entidad, Ubicacion, Nodo (sin Fundo, Empresa y Pais)

        reorderedColumns.push(...otherColumns.filter(col => ['entidadid'].includes(col.columnName)));

        reorderedColumns.push(...otherColumns.filter(col => ['ubicacionid'].includes(col.columnName)));

        reorderedColumns.push(...otherColumns.filter(col => ['nodoid'].includes(col.columnName)));

        reorderedColumns.push(...otherColumns.filter(col => ['latitud', 'longitud', 'referencia'].includes(col.columnName)));

      } else if (selectedTable === 'tipo') {

        // Entidad, Tipo

        reorderedColumns.push(...otherColumns.filter(col => ['entidadid'].includes(col.columnName)));

        reorderedColumns.push(...otherColumns.filter(col => ['tipo'].includes(col.columnName)));

      } else if (selectedTable === 'metricasensor') {

        if (forTable) {

          // Para metricasensor agrupado en Actualizar: Nodo, Tipos, Metricas

        reorderedColumns.push(...otherColumns.filter(col => ['nodoid'].includes(col.columnName)));

        // Agregar columnas virtuales para tipos y métricas agrupadas

        reorderedColumns.push({

          columnName: 'tipos',

          dataType: 'varchar',

          isNullable: true,

          isIdentity: false,

          isPrimaryKey: false,

          isForeignKey: false,

          defaultValue: null

        });

        reorderedColumns.push({

          columnName: 'metricas',

          dataType: 'varchar',

          isNullable: true,

          isIdentity: false,

          isPrimaryKey: false,

          isForeignKey: false,

          defaultValue: null

        });

        } else {

          // Para metricasensor desagregado en Estado: mantener orden original

          reorderedColumns.push(...otherColumns);

        }

      } else if (selectedTable === 'sensor') {

        if (forTable) {

          // Para sensor agrupado en Actualizar: Nodo, Tipos

          reorderedColumns.push(...otherColumns.filter(col => ['nodoid'].includes(col.columnName)));

          // Agregar columna virtual para tipos agrupados

          reorderedColumns.push({

            columnName: 'tipos',

            dataType: 'varchar',

            isNullable: true,

            isIdentity: false,

            isPrimaryKey: false,

            isForeignKey: false,

            defaultValue: null

          });

        } else {

          // Para sensor desagregado en Estado: mantener orden original

          reorderedColumns.push(...otherColumns);

        }

      } else if (selectedTable === 'umbral') {

        // Ubicacion, Nodo, Tipo, Metrica, Valor Minimo, Valor Maximo, Criticidad, Nombre Umbral, Status

        reorderedColumns.push(...otherColumns.filter(col => ['ubicacionid'].includes(col.columnName)));

        reorderedColumns.push(...otherColumns.filter(col => ['nodoid'].includes(col.columnName)));

        reorderedColumns.push(...otherColumns.filter(col => ['tipoid'].includes(col.columnName)));

        reorderedColumns.push(...otherColumns.filter(col => ['metricaid'].includes(col.columnName)));

        reorderedColumns.push(...otherColumns.filter(col => ['minimo'].includes(col.columnName)));

        reorderedColumns.push(...otherColumns.filter(col => ['maximo'].includes(col.columnName)));

        reorderedColumns.push(...otherColumns.filter(col => ['criticidadid'].includes(col.columnName)));

        reorderedColumns.push(...otherColumns.filter(col => ['umbral'].includes(col.columnName)));

      } else if (selectedTable === 'usuario') {

        // Usuario, Nombre, Apellido

        reorderedColumns.push(...otherColumns.filter(col => ['login'].includes(col.columnName)));

        reorderedColumns.push(...otherColumns.filter(col => ['firstname'].includes(col.columnName)));

        reorderedColumns.push(...otherColumns.filter(col => ['lastname'].includes(col.columnName)));

        reorderedColumns.push(...otherColumns.filter(col => ['email'].includes(col.columnName)));

      } else if (selectedTable === 'usuarioperfil') {

        if (forTable) {

          // Para usuarioperfil agrupado en Actualizar: Usuario, Perfiles (columnas agrupadas)

        reorderedColumns.push({

          columnName: 'usuario',

          dataType: 'varchar',

          isNullable: true,

          isIdentity: false,

          isPrimaryKey: false,

          isForeignKey: false,

          defaultValue: null

        });

        reorderedColumns.push({

          columnName: 'perfiles',

          dataType: 'varchar',

          isNullable: true,

          isIdentity: false,

          isPrimaryKey: false,

          isForeignKey: false,

          defaultValue: null

        });

      } else {

          // Para usuarioperfil desagregado en Estado: mantener orden original

        reorderedColumns.push(...otherColumns);

      }

    } else {

        // Para formularios de insertar (forTable = false), aplicar reordenamiento específico

        if (selectedTable === 'fundo') {

          // País, Empresa, Fundo, Abreviatura

          reorderedColumns.push(...otherColumns.filter(col => ['paisid'].includes(col.columnName)));

          reorderedColumns.push(...otherColumns.filter(col => ['empresaid'].includes(col.columnName)));

          reorderedColumns.push(...otherColumns.filter(col => ['fundo'].includes(col.columnName)));

          reorderedColumns.push(...otherColumns.filter(col => ['fundoabrev'].includes(col.columnName)));

    } else {

        // Para otras tablas, mantener el orden original

      reorderedColumns.push(...otherColumns);

        }

    }

// Agregar columnas de auditoría

    reorderedColumns.push(...auditColumns);

// Agregar status al final

    if (statusColumn) {

      reorderedColumns.push(statusColumn);

    }

// Debug log para usuarioperfil

    if (selectedTable === 'usuarioperfil') {

}

return reorderedColumns;

  }, [selectedTable, columns, tableColumns]);

// Columnas para la tabla de Estado (individuales) - Memoizadas con dependencias correctas
  const statusVisibleColumns = useMemo(() => {
    if (columns.length === 0) return [];
    return getVisibleColumns(false);
  }, [getVisibleColumns, columns]);

  // Columnas para la tabla de Actualizar (agrupadas para metricasensor) - Memoizadas con dependencias correctas
  const updateVisibleColumns = useMemo(() => {
    if (tableColumns.length === 0) return [];
    return getVisibleColumns(true);
  }, [getVisibleColumns, tableColumns]);

  // Debug: verificar columnas para usuarioperfil

  if (selectedTable === 'usuarioperfil') {

}

// Debug: verificar que los campos de auditoría estén incluidos

  // console.log('🔍 Debug - Tabla seleccionada:', selectedTable);

  // console.log('🔍 Debug - Columnas visibles (Estado):', statusVisibleColumns.map(col => col.columnName));

  // console.log('🔍 Debug - Columnas visibles (Actualizar):', updateVisibleColumns.map(col => col.columnName));

// Función para obtener columnas disponibles para búsqueda (excluyendo campos problemáticos)

// getColumnDisplayName ahora se importa desde systemParametersUtils

// Función para obtener las equivalencias de un campo

// Función para determinar si un campo es clave y no debe ser editable

  const isKeyField = (columnName: string): boolean => {

    // Campos que son llaves primarias (siempre no editables)

    const primaryKeys = [

      'paisid', 'empresaid', 'fundoid', 'ubicacionid', 'entidadid', 

      'nodoid', 'tipoid', 'metricaid', 'localizacionid', 'sensorid',

      'usuarioid', 'metricasensorid', 'umbralid', 'perfilid', 'auditid',

      'criticidadid', 'contactoid'

    ];

// Campos que son llaves foráneas (no editables en actualización)

    const foreignKeys = [

      'paisid', 'empresaid', 'fundoid', 'ubicacionid', 'entidadid', 

      'nodoid', 'tipoid', 'metricaid', 'localizacionid', 'sensorid',

      'umbralid', 'perfilid', 'criticidadid', 'usuarioid'

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

           (columnName.endsWith('id') && !['statusid'].includes(columnName));

  };

// Estados para creación múltiple de sensores

   const [multipleSensors, setMultipleSensors] = useState<any[]>([]);

   const [selectedNodo, setSelectedNodo] = useState<string>('');

   const [selectedEntidad, setSelectedEntidad] = useState<string>('');

   const [selectedTipo, setSelectedTipo] = useState<string>('');

   const [selectedStatus, setSelectedStatus] = useState<boolean>(true);

   const [selectedSensorCount, setSelectedSensorCount] = useState<number>(0);

// Estados para creación múltiple de métricas sensor

   const [multipleMetricas, setMultipleMetricas] = useState<any[]>([]);

   const [selectedNodos, setSelectedNodos] = useState<string[]>([]);

   const [selectedEntidadMetrica, setSelectedEntidadMetrica] = useState<string>('');

   const [selectedMetricas, setSelectedMetricas] = useState<string[]>([]);

// Estados para creación múltiple de usuario perfil

   const [multipleUsuarioPerfiles, setMultipleUsuarioPerfiles] = useState<any[]>([]);

   const [selectedUsuarios, setSelectedUsuarios] = useState<string[]>([]);

   const [selectedPerfiles, setSelectedPerfiles] = useState<string[]>([]);

// Función para obtener datos múltiples según la tabla seleccionada

  const getMultipleData = useCallback(() => {

    switch (selectedTable) {

      case 'usuarioperfil':

        return multipleUsuarioPerfiles;

      case 'metricasensor':

        return multipleMetricas;

      case 'sensor':

        return multipleSensors;

      case 'umbral':

        return []; // Umbral no tiene datos múltiples en este contexto

      default:

        return [];

    }

  }, [selectedTable, multipleUsuarioPerfiles, multipleMetricas, multipleSensors]);

// Memoizar getMultipleData para evitar loops infinitos

  const memoizedMultipleData = useMemo(() => {

    return getMultipleData();

  }, [selectedTable, multipleUsuarioPerfiles, multipleMetricas, multipleSensors]);

// Memoizar el objeto extendido para evitar loops infinitos

  const memoizedExtendedMultipleData = useMemo(() => {

    return {

      multipleData: memoizedMultipleData,

      // Estados específicos para sensor y metricasensor

      sensorStates: selectedTable === 'sensor' ? {

        selectedNodo,

        selectedEntidad,

        selectedTipo,

        selectedSensorCount,

        multipleSensors

      } : null,

      metricasensorStates: selectedTable === 'metricasensor' ? {

        selectedNodos,

        selectedEntidadMetrica,

        selectedMetricas,

        multipleMetricas

      } : null

    };

  }, [memoizedMultipleData, selectedTable, selectedNodo, selectedEntidad, selectedTipo, selectedSensorCount, multipleSensors, selectedNodos, selectedEntidadMetrica, selectedMetricas, multipleMetricas]);

// Efecto para notificar cambios en los datos del formulario al componente padre

  useEffect(() => {

    if (onFormDataChange) {

      onFormDataChange(formData, memoizedExtendedMultipleData);

    }

  }, [formData, memoizedExtendedMultipleData, onFormDataChange]);

// Registrar la función de detección de cambios - DESACTIVADO TEMPORALMENTE

  // useEffect(() => {

  //   registerChangeDetector(() => {

  //     return hasUnsavedChanges();

  //   });

  // }, [registerChangeDetector]);

// Estados para creación múltiple de localizaciones

// Estados para campos adicionales de localización

// Estado para detectar si estamos en modo replicación

   const [isReplicateMode, setIsReplicateMode] = useState(false);

// Función para inicializar sensores múltiples

  const initializeMultipleSensors = async (nodoid: string, count: number, specificTipos?: number[]) => {

    try {

      // Primero verificar qué sensores ya existen para este nodo

      const existingSensors = tableData.filter(sensor => sensor.nodoid === parseInt(nodoid));

      const existingTipos = existingSensors.map(sensor => sensor.tipoid);

// Si se especifican tipos específicos (desde pegado), usarlos como predeterminados

      let selectedTipos;

      if (specificTipos && specificTipos.length > 0) {

// Buscar los tipos copiados en los tipos disponibles

        const copiedTipos = tiposData.filter(tipo => specificTipos.includes(tipo.tipoid));

// Si no se encuentran todos los tipos copiados, usar los disponibles

        if (copiedTipos.length !== specificTipos.length) {

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

// Mensaje de datos copiados eliminado por solicitud del usuario

        }

      } else {

        // Filtrar tipos disponibles (excluir los que ya están en uso)

        const availableTipos = tiposData.filter(tipo => !existingTipos.includes(tipo.tipoid));

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

   const initializeMultipleMetricas = React.useCallback(async (nodos: string[], metricas: string[]) => {

     try {

       // Crear todas las combinaciones válidas (nodoid, metricaid, tipoid)

       const metricasToCreate = [];

       let index = 1;

for (const nodoid of nodos) {

         // 🔑 CAMBIO CLAVE: Obtener tipos de la tabla SENSOR, no de metricasensor

         // Necesitamos cargar los datos de la tabla sensor para este nodo

         const sensorTableDataResponse = await JoySenseService.getTableData('sensor', 1000);

         const sensorTableData: any[] = Array.isArray(sensorTableDataResponse) ? sensorTableDataResponse : ((sensorTableDataResponse as any)?.data || []);

const existingSensorsForNode = sensorTableData.filter((sensor: any) => sensor.nodoid === parseInt(nodoid));

         const availableTiposForNode = existingSensorsForNode.map((sensor: any) => sensor.tipoid);

if (availableTiposForNode.length === 0) {

continue;

         }

// Crear todas las combinaciones válidas: (nodoid, metricaid, tipoid)

         for (const metricaid of metricas) {

for (const tipoid of availableTiposForNode) {

const tipoInfo = tiposData.find(t => t.tipoid === tipoid);

             const metricaInfo = metricasData.find(m => m.metricaid.toString() === metricaid);

             const nodoInfo = nodosData.find(n => n.nodoid.toString() === nodoid);

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

   }, [selectedStatus, tiposData, metricasData, nodosData, setMultipleMetricas, setMessage]);

// Función para manejar inserción múltiple de sensores

  const handleMultipleSensorInsert = async () => {

    if (!selectedTable || !user || multipleSensors.length === 0) return;

    // Verificar que hay al menos un sensor sin toDelete para insertar
    const sensorsToInsertCount = multipleSensors.filter(sensor => !sensor.toDelete).length;
    if (sensorsToInsertCount === 0) {
      return;
    }

try {

      setLoading(true);

      const usuarioid = getCurrentUserId();

// Filtrar sensores que NO tienen toDelete: true y preparar datos para inserción

       const sensorsToInsert = multipleSensors
         .filter(sensor => !sensor.toDelete) // Solo sensores que NO están marcados para eliminar
         .map(sensor => {

         const { sensorIndex, label, toDelete, ...cleanSensor } = sensor; // Remover campos que no están en la tabla

         return {

           ...cleanSensor,

           usercreatedid: usuarioid,

           usermodifiedid: usuarioid,

           datecreated: new Date().toISOString(),

           datemodified: new Date().toISOString()

         };

       });

// Logging para debugging

// Insertar sensores simultáneamente (ahora que los datos están limpios)

const insertPromises = sensorsToInsert.map((sensor, index) => 

         JoySenseService.insertTableRow(selectedTable, sensor)

           .then(result => {

return result;

           })

           .catch(error => {

             console.error(`❌ Error insertando sensor ${index + 1}:`, sensor, error);

             throw error;

           })

       );

await Promise.all(insertPromises);

// Agregar cada sensor insertado al sistema de mensajes

      sensorsToInsert.forEach(sensor => {

        addInsertedRecord(sensor);

      });

// Limpiar mensajes de alerta después de inserción exitosa

      setMessage(null);

// Limpiar formulario

      setMultipleSensors([]);

      setSelectedNodo('');

      setSelectedTipo('');

// Recargar datos

      loadTableDataWrapper();

      loadTableInfo();

      loadUpdateData();

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

// Función para manejar la creación masiva de umbrales (SOLO INSERTAR UMBRALES)

  const handleMassiveUmbralCreationSimple = async (dataToApply: any[]) => {

    if (!selectedTable || !user || selectedTable !== 'umbral') return;

try {

      setLoading(true);

const usuarioid = getCurrentUserId();

      const currentTimestamp = new Date().toISOString();

// Preparar datos con campos de auditoría

      const preparedData = dataToApply.map(item => ({

        ...item,

        usercreatedid: usuarioid,

        usermodifiedid: usuarioid,

        datecreated: currentTimestamp,

        datemodified: currentTimestamp

      }));

// Crear umbrales para cada combinación de nodo + tipo + métrica
      
      for (const umbralData of preparedData) {
        
        try {
          // Crear nuevo umbral
          await JoySenseService.insertTableRow('umbral', umbralData);
        } catch (error: any) {
          // Si falla por duplicado, intentar actualizar
          if (error.message?.includes('duplicate key') || 
              error.message?.includes('already exists') ||
              error.response?.status === 500) {
            try {
              // Buscar umbral existente
              const umbralExistente = umbralesData?.find(umbral => 
                umbral.nodoid === umbralData.nodoid && 
                umbral.tipoid === umbralData.tipoid && 
                umbral.metricaid === umbralData.metricaid
              );
              
              if (umbralExistente) {
                await JoySenseService.updateTableRow('umbral', umbralExistente.umbralid, {
                  umbral: umbralData.umbral,
                  minimo: umbralData.minimo,
                  maximo: umbralData.maximo,
                  criticidadid: umbralData.criticidadid,
                  usermodifiedid: umbralData.usermodifiedid,
                  datemodified: umbralData.datemodified
                });
              } else {
              }
            } catch (updateError: any) {
            }
          }
        }
      }

// Recargar datos

      loadTableDataWrapper();

      loadTableInfo();

      loadUpdateData();

      loadCopyData();

      loadRelatedTablesData();

setMessage({ 

        type: 'success', 

        text: `Se procesaron ${preparedData.length} umbrales exitosamente` 

      });

} catch (error: any) {

      console.error('Error en creación masiva de umbrales:', error);

      const errorResponse = handleMultipleInsertError(error, 'umbrales');

      setMessage({ type: errorResponse.type, text: errorResponse.message });

    } finally {

      setLoading(false);

    }

  };

// Función para manejar la creación masiva de umbrales (LEGACY - COMPLEJA) - COMENTADA
  /*
  const handleMassiveUmbralCreation = async (dataToApply: any[]) => {

    if (!selectedTable || !user || selectedTable !== 'umbral') return;

try {

      setLoading(true);

const usuarioid = getCurrentUserId();

      const currentTimestamp = new Date().toISOString();

// Preparar datos con campos de auditoría

      const preparedData = dataToApply.map(item => ({

        ...item,

        usercreatedid: usuarioid,

        usermodifiedid: usuarioid,

        datecreated: currentTimestamp,

        datemodified: currentTimestamp

      }));

// Verificar campos requeridos

      const camposRequeridos = ['ubicacionid', 'nodoid', 'tipoid', 'metricaid', 'criticidadid', 'umbral'];

      const registrosInvalidos = preparedData.filter(record => 

        camposRequeridos.some(campo => !(record as any)[campo] || (record as any)[campo] === null || (record as any)[campo] === undefined)

      );

if (registrosInvalidos.length > 0) {

        console.error('❌ Registros con campos requeridos faltantes:', registrosInvalidos);

        throw new Error(`Faltan campos requeridos en ${registrosInvalidos.length} registros`);

      }

// Verificar que los IDs existen en las tablas referenciadas

      const ubicacionesExistentes = ubicacionesData?.map(u => u.ubicacionid) || [];

      const nodosExistentes = nodosData?.map(n => n.nodoid) || [];

      const tiposExistentes = tiposData?.map(t => t.tipoid) || [];

      const metricasExistentes = metricasData?.map(m => m.metricaid) || [];

      const criticidadesExistentes = criticidadesData?.map(c => c.criticidadid) || [];

const referenciasInvalidas = preparedData.filter(record => 

        !ubicacionesExistentes.includes(record.ubicacionid) ||

        !nodosExistentes.includes(record.nodoid) ||

        !tiposExistentes.includes(record.tipoid) ||

        !metricasExistentes.includes(record.metricaid) ||

        !criticidadesExistentes.includes(record.criticidadid)

      );

if (referenciasInvalidas.length > 0) {

        console.error('❌ Registros con referencias inválidas:', referenciasInvalidas);

        throw new Error(`Referencias inválidas en ${referenciasInvalidas.length} registros`);

      }

// Crear umbrales para cada combinación de nodo + tipo + métrica
      
      for (const umbralData of preparedData) {
        
        try {
          // Crear nuevo umbral
          await JoySenseService.insertTableRow('umbral', umbralData);
        } catch (error: any) {
          // Si falla por duplicado, intentar actualizar
          if (error.message?.includes('duplicate key') || 
              error.message?.includes('already exists') ||
              error.response?.status === 500) {
            try {
              // Buscar umbral existente
              const umbralExistente = umbralesData?.find(umbral => 
                umbral.nodoid === umbralData.nodoid && 
                umbral.tipoid === umbralData.tipoid && 
                umbral.metricaid === umbralData.metricaid
              );
              
              if (umbralExistente) {
                await JoySenseService.updateTableRow('umbral', umbralExistente.umbralid, {
                  umbral: umbralData.umbral,
                  minimo: umbralData.minimo,
                  maximo: umbralData.maximo,
                  criticidadid: umbralData.criticidadid,
                  usermodifiedid: umbralData.usermodifiedid,
                  datemodified: umbralData.datemodified
                });
              } else {
              }
            } catch (updateError: any) {
            }
          }
        }
      }

// Para cada nodo, obtener umbrales existentes y aplicar lógica UPSERT

      for (const nodoid of nodosUnicos) {

// Obtener umbrales existentes para este nodo

        const umbralesExistentes = umbralesData?.filter(umbral => 

          umbral.nodoid === nodoid && umbral.statusid === 1

        ) || [];

// Obtener datos a aplicar para este nodo

        const datosDelNodo = preparedData.filter(item => item.nodoid === nodoid);

// Crear conjunto de combinaciones únicas que se van a activar

        const combinacionesAActivar = new Set(

          datosDelNodo.map(item => `${item.tipoid}-${item.metricaid}`)

        );

// PRIMERO: Crear/actualizar entradas en sensor usando UPSERT

const tiposUnicos = Array.from(new Set(datosDelNodo.map(dato => dato.tipoid)));

for (const tipoid of tiposUnicos) {

          // Verificar si ya existe en sensor

          const sensorExistente = sensorsData?.find((s: any) => 

            s.nodoid === nodoid && s.tipoid === tipoid

          );

const sensorData = {

            nodoid: nodoid,

            tipoid: tipoid,

            statusid: 1,

            usercreatedid: usuarioid,

            usermodifiedid: usuarioid,

            datecreated: currentTimestamp,

            datemodified: currentTimestamp

          };

if (sensorExistente) {

// Actualizar sensor existente usando endpoint con clave compuesta

            await JoySenseService.updateTableRowByCompositeKey('sensor', { nodoid, tipoid }, {

              statusid: 1,

              usercreatedid: usuarioid,

              usermodifiedid: usuarioid,

              datecreated: currentTimestamp,

              datemodified: currentTimestamp

            });

} else {

try {

              // Intentar crear nuevo sensor

              await JoySenseService.insertTableRow('sensor', sensorData);

} catch (error: any) {

// Si falla por duplicado o por error 500 (que puede ser duplicado), intentar actualizar

              if (error.message?.includes('duplicate key') || 

                  error.message?.includes('already exists') ||

                  error.message?.includes('23505') ||

                  error.message?.includes('pk_sensor') ||

                  error.message?.includes('HTTP error! status: 500') ||

                  (error.response?.data?.error && error.response.data.error.includes('duplicate key'))) {

try {

                  await JoySenseService.updateTableRow('sensor', `${nodoid}-${tipoid}`, {

                    statusid: 1,

                    usermodifiedid: usuarioid,

                    datemodified: currentTimestamp

                  });

} catch (updateError: any) {

// Si también falla la actualización, asumir que el sensor ya existe y está activo

}

              } else {

                throw error; // Re-lanzar si es otro tipo de error

              }

            }

          }

        }

// SEGUNDO: Crear/actualizar entradas en metricasensor usando UPSERT

for (const dato of datosDelNodo) {

          const combinacion = `${dato.tipoid}-${dato.metricaid}`;

// Verificar si ya existe en metricasensor

          const metricaSensorExistente = metricasensorData?.find((ms: any) => 

            ms.nodoid === nodoid && ms.tipoid === dato.tipoid && ms.metricaid === dato.metricaid

          );

const metricaSensorData = {

            nodoid: nodoid,

            tipoid: dato.tipoid,

            metricaid: dato.metricaid,

            statusid: 1,

            usercreatedid: usuarioid,

            usermodifiedid: usuarioid,

            datecreated: currentTimestamp,

            datemodified: currentTimestamp

          };

if (metricaSensorExistente) {

try {

              // Actualizar metricasensor existente usando endpoint con clave compuesta

              await JoySenseService.updateTableRowByCompositeKey('metricasensor', { 
                nodoid, 
                tipoid: dato.tipoid, 
                metricaid: dato.metricaid 
              }, {

                statusid: 1,

                usermodifiedid: usuarioid,

                datemodified: currentTimestamp

              });

} catch (updateError: any) {

// Si falla la actualización, asumir que ya está activo

}

          } else {

try {

              // Crear nuevo metricasensor

              await JoySenseService.insertTableRow('metricasensor', metricaSensorData);

} catch (error: any) {

// Si falla por duplicado o por error 500 (que puede ser duplicado), intentar actualizar

              if (error.message?.includes('duplicate key') || 

                  error.message?.includes('already exists') ||

                  error.message?.includes('23505') ||

                  error.message?.includes('pk_metricasensor') ||

                  error.message?.includes('HTTP error! status: 500') ||

                  (error.response?.data?.error && error.response.data.error.includes('duplicate key'))) {

try {

                  await JoySenseService.updateTableRow('metricasensor', `${nodoid}-${dato.metricaid}-${dato.tipoid}`, {

                    statusid: 1,

                    usermodifiedid: usuarioid,

                    datemodified: currentTimestamp

                  });

} catch (updateError: any) {

// Si también falla la actualización, asumir que el metricasensor ya existe y está activo

}

              } else {

                throw error; // Re-lanzar si es otro tipo de error

              }

            }

          }

        }

// TERCERO: Inactivar umbrales existentes que NO están en las combinaciones a activar

        for (const umbralExistente of umbralesExistentes) {

          const combinacion = `${umbralExistente.tipoid}-${umbralExistente.metricaid}`;

if (!combinacionesAActivar.has(combinacion)) {

// Inactivar el umbral existente

            await JoySenseService.updateTableRow('umbral', umbralExistente.umbralid, {

              statusid: 0,

              usermodifiedid: usuarioid,

              datemodified: currentTimestamp

            });

          }

        }

// Insertar/actualizar umbrales para las combinaciones a activar

        for (const dato of datosDelNodo) {

          const combinacion = `${dato.tipoid}-${dato.metricaid}`;

// Buscar si ya existe un umbral para esta combinación

          const umbralExistente = umbralesExistentes.find(umbral => 

            umbral.tipoid === dato.tipoid && umbral.metricaid === dato.metricaid

          );

if (umbralExistente) {

            // Verificar si los valores críticos son diferentes a los existentes

            // Solo se conservan si: minimo, maximo y criticidadid son idénticos

            const valoresCriticosIdenticos = 

              umbralExistente.minimo === dato.minimo &&

              umbralExistente.maximo === dato.maximo &&

              umbralExistente.criticidadid === dato.criticidadid;

if (valoresCriticosIdenticos) {

              // Mantener valores originales de la BD (minimo, maximo, criticidadid)

// Solo actualizar el nombre (umbral) y asegurar que esté activo

              await JoySenseService.updateTableRow('umbral', umbralExistente.umbralid, {

                umbral: dato.umbral, // Solo actualizar el nombre

                statusid: 1,

                usermodifiedid: usuarioid,

                datemodified: currentTimestamp

              });

            } else {

              // Actualizar umbral existente con todos los valores nuevos

await JoySenseService.updateTableRow('umbral', umbralExistente.umbralid, {

                ubicacionid: dato.ubicacionid,

                criticidadid: dato.criticidadid,

                umbral: dato.umbral,

                minimo: dato.minimo,

                maximo: dato.maximo,

                statusid: 1,

                usermodifiedid: usuarioid,

                datemodified: currentTimestamp

              });

            }

          } else {

            // Crear nuevo umbral

await JoySenseService.insertTableRow('umbral', dato);

          }

        }

      }

// Recargar datos

      loadTableDataWrapper();

      loadTableInfo();

      loadUpdateData();

      loadCopyData();

      loadRelatedTablesData();

setMessage({ 

        type: 'success', 

        text: `Se procesaron ${preparedData.length} umbrales exitosamente` 

      });

} catch (error: any) {

      console.error('Error en creación masiva de umbrales:', error);

      const errorResponse = handleMultipleInsertError(error, 'umbrales');

      setMessage({ type: errorResponse.type, text: errorResponse.message });

    } finally {

      setLoading(false);

    }

  };
  */

// Función para manejar la creación masiva de métricas sensor

  const handleMassiveMetricaSensorCreation = async (dataToApply: any[]) => {

    if (!selectedTable || !user || selectedTable !== 'metricasensor') return;

try {

      setLoading(true);

const usuarioid = getCurrentUserId();

      const currentTimestamp = new Date().toISOString();

// Preparar datos con campos de auditoría

      const preparedData = dataToApply.map(item => ({

        ...item,

        usercreatedid: usuarioid,

        usermodifiedid: usuarioid,

        datecreated: currentTimestamp,

        datemodified: currentTimestamp

      }));

// Verificar si hay duplicados antes de enviar

      const duplicates = preparedData.filter((item, index, self) => 

        index !== self.findIndex(t => 

          t.nodoid === item.nodoid && 

          t.tipoid === item.tipoid && 

          t.metricaid === item.metricaid

        )

      );

if (duplicates.length > 0) {

        console.warn('⚠️ Se encontraron duplicados en los datos:', duplicates);

        // Eliminar duplicados

        const uniqueData = preparedData.filter((item, index, self) => 

          index === self.findIndex(t => 

            t.nodoid === item.nodoid && 

            t.tipoid === item.tipoid && 

            t.metricaid === item.metricaid

          )

        );

preparedData.length = 0;

        preparedData.push(...uniqueData);

      }

// Realizar inserciones individuales

      for (const record of preparedData) {

        await JoySenseService.insertTableRow(selectedTable, record);

      }

// Recargar datos

      loadTableDataWrapper();

      loadTableInfo();

      loadUpdateData();

      loadCopyData();

      loadRelatedTablesData();

setMessage({ 

        type: 'success', 

        text: `Se crearon ${preparedData.length} métricas sensor exitosamente` 

      });

} catch (error: any) {

      console.error('Error en creación masiva de métricas sensor:', error);

      const errorResponse = handleMultipleInsertError(error, 'métricas sensor');

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

// Función para toggle del estado de eliminación de un sensor

   const toggleSensorDelete = (sensorIndex: number, toDelete: boolean) => {

     setMultipleSensors(prev => prev.map(sensor => 

       sensor.sensorIndex === sensorIndex 

         ? { ...sensor, toDelete: toDelete }

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

// Función para inicializar localizaciones múltiples

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

const insertPromises = metricasToInsert.map((metrica, index) => 

         JoySenseService.insertTableRow(selectedTable, metrica)

           .then(result => {

return result;

           })

           .catch(error => {

             console.error(`❌ Error insertando métrica ${index + 1}:`, metrica, error);

             throw error;

           })

       );

await Promise.all(insertPromises);

// Agregar cada métrica insertada al sistema de mensajes

      metricasToInsert.forEach(metrica => {

        addInsertedRecord(metrica);

      });

// Limpiar mensajes de alerta después de inserción exitosa

      setMessage(null);

// Limpiar formulario

      setMultipleMetricas([]);

      setSelectedNodos([]);

      setSelectedMetricas([]);

// Recargar datos

      loadTableDataWrapper();

      loadTableInfo();

      loadUpdateData();

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

// Función para inicializar usuario perfiles múltiples

  const initializeMultipleUsuarioPerfiles = React.useCallback(async (usuarios: string[], perfiles: string[]) => {

    try {

      // Crear todas las combinaciones válidas (usuarioid, perfilid)

      const usuarioPerfilesToCreate = [];

      let index = 1;

for (const usuarioid of usuarios) {

        for (const perfilid of perfiles) {

          const usuarioInfo = userData.find(u => u.usuarioid.toString() === usuarioid);

          const perfilInfo = perfilesData.find(p => p.perfilid.toString() === perfilid);

usuarioPerfilesToCreate.push({

            usuarioPerfilIndex: index++,

            label: `${usuarioInfo?.nombre || usuarioid} - ${perfilInfo?.perfil || perfilid}`,

            usuarioid: parseInt(usuarioid),

            perfilid: parseInt(perfilid),

            statusid: selectedStatus ? 1 : 0

          });

        }

      }

setMultipleUsuarioPerfiles(usuarioPerfilesToCreate);

if (usuarioPerfilesToCreate.length > 0) {

        // Mensaje eliminado - no es necesario

      } else {

        setMessage({ 

          type: 'warning', 

          text: 'No hay combinaciones únicas disponibles para crear nuevos usuario perfiles' 

        });

      }

} catch (error) {

      console.error('Error inicializando usuario perfiles múltiples:', error);

      setMessage({ 

        type: 'error', 

        text: 'Error al verificar usuario perfiles existentes' 

      });

    }

  }, [selectedStatus, userData, perfilesData, setMultipleUsuarioPerfiles, setMessage]);

// Función para manejar inserción múltiple de usuario perfiles

  const handleMultipleUsuarioPerfilInsert = async () => {

    if (!selectedTable || !user || multipleUsuarioPerfiles.length === 0) return;

try {

      setLoading(true);

      const usuarioid = getCurrentUserId();

// Preparar datos para cada usuario perfil (limpiar campos que no están en la tabla)

      const usuarioPerfilesToInsert = multipleUsuarioPerfiles.map(usuarioPerfil => {

        const { usuarioPerfilIndex, label, ...cleanUsuarioPerfil } = usuarioPerfil; // Remover campos que no están en la tabla

        return {

          ...cleanUsuarioPerfil,

          usercreatedid: usuarioid,

          datecreated: new Date().toISOString(),

          usermodifiedid: usuarioid,

          datemodified: new Date().toISOString()

        };

      });

// Insertar usuario perfiles simultáneamente (ahora que los datos están limpios)

const insertPromises = usuarioPerfilesToInsert.map((usuarioPerfil, index) => 

        JoySenseService.insertTableRow(selectedTable, usuarioPerfil)

          .then(result => {

return result;

          })

          .catch(error => {

            console.error(`❌ Error insertando usuario perfil ${index + 1}:`, usuarioPerfil, error);

            throw error;

          })

      );

await Promise.all(insertPromises);

// Agregar cada usuario perfil insertado al sistema de mensajes

     usuarioPerfilesToInsert.forEach(usuarioPerfil => {

       addInsertedRecord(usuarioPerfil);

     });

// Limpiar mensajes de alerta después de inserción exitosa

     setMessage(null);

// Limpiar formulario

     setMultipleUsuarioPerfiles([]);

     setSelectedUsuarios([]);

     setSelectedPerfiles([]);

// Recargar datos

     loadTableDataWrapper();

     loadTableInfo();

     loadUpdateData();

     loadCopyData();

     // Recargar datos relacionados para que aparezcan en comboboxes

     loadRelatedTablesData();

} catch (error: any) {

     const errorResponse = handleMultipleInsertError(error, 'usuario perfiles');

     setMessage({ type: errorResponse.type, text: errorResponse.message });

   } finally {

     setLoading(false);

   }

 };

// Función para manejar inserción múltiple de localizaciones

// Función helper para obtener ID único de fila (usa la función consolidada)

  const getRowIdForSelection = (r: any) => getRowId(r, selectedTable);

// Funciones para selección manual múltiple

const handleSelectRowForManualUpdate = (row: any, isSelected: boolean) => {

    const rowId = getRowIdForSelection(row);

console.log('🔍 handleSelectRowForManualUpdate:', { 

      rowId, 

      isSelected, 

      currentSelection: selectedRowsForManualUpdate.length,

      hasOriginalRows: row.originalRows?.length,

      selectedTable

    });

// Para tablas agrupadas (sensor, metricasensor, usuarioperfil), implementar selección única

    if (selectedTable === 'sensor' || selectedTable === 'metricasensor' || selectedTable === 'usuarioperfil') {

    if (isSelected) {

        // Limpiar selección anterior y seleccionar solo esta fila

if (selectedTable === 'metricasensor' && row.originalRows && row.originalRows.length > 0) {

          // Para metricasensor, expandir las originalRows

          setSelectedRowsForManualUpdate([...row.originalRows]);

} else if (selectedTable === 'usuarioperfil' && row.originalRows && row.originalRows.length > 0) {

        // Para usuarioperfil, mantener la fila agrupada

          setSelectedRowsForManualUpdate([row]);

} else if (selectedTable === 'sensor' && row.originalRows && row.originalRows.length > 0) {

          // Para sensor, mantener la fila agrupada

          setSelectedRowsForManualUpdate([row]);

} else {

          // Lógica normal para filas no agrupadas

          setSelectedRowsForManualUpdate([row]);

}

      } else {

        // Deseleccionar (limpiar toda la selección)

        setSelectedRowsForManualUpdate([]);

}

    } else {

      // Para otras tablas, mantener la lógica original de selección múltiple

      if (isSelected) {

        if (!selectedRowsForManualUpdate.some(r => getRowIdForSelection(r) === rowId)) {

          setSelectedRowsForManualUpdate(prev => [...prev, row]);

} else {

}

    } else {

        setSelectedRowsForManualUpdate(prev => prev.filter(r => getRowIdForSelection(r) !== rowId));

}

    }

  };

const handleDeselectAll = () => {

    setSelectedRowsForManualUpdate([]);

  };

// Función para calcular el número correcto de entradas para el botón de actualización

const handleGoToManualUpdateForm = () => {

    if (selectedRowsForManualUpdate.length === 0) {

      setUpdateMessage({ type: 'warning', text: 'Debes seleccionar al menos una entrada para actualizar' });

      return;

    }

// Validar que los datos relacionados estén cargados

    const needsRelatedData = selectedRowsForManualUpdate.some(row => 

      row.nodoid || row.tipoid || row.metricaid || row.ubicacionid || row.usuarioid || row.perfilid

    );

if (needsRelatedData && (!nodosData || !tiposData || !metricasData || !ubicacionesData || !userData || !perfilesData)) {

      setMessage({ type: 'warning', text: 'Cargando datos relacionados... Por favor espera un momento.' });

      // Recargar datos relacionados si es necesario

      loadRelatedTablesData();

      return;

    }

setIsMultipleSelectionMode(true);

    setUpdateFormData(selectedRowsForManualUpdate[0]); // Usar la primera como base

    setActiveSubTab('update'); // Cambiar a la pestaña de formulario

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

// Funciones para manejar el modal de pérdida de datos

// Función para manejar cancelación del formulario de inserción

  const handleCancelInsert = () => {
    // Obtener los valores iniciales del formulario
    const initialFormData = initializeFormData(columns);
    
    // Verificar si hay cambios comparando con los valores iniciales
    const hasChanges = Object.keys(formData).some(key => {
      const currentValue = formData[key];
      const initialValue = initialFormData[key];
      
      // Comparar valores, considerando null, undefined y string vacío como equivalentes
      if (currentValue === null || currentValue === undefined || currentValue === '') {
        return initialValue !== null && initialValue !== undefined && initialValue !== '';
      }
      
      return currentValue !== initialValue;
    });
    
    if (hasChanges) {
      setCancelAction(() => () => {
        // Reinicializar formulario
        setFormData(initializeFormData(columns));
        setShowCancelModal(false);
      });
      setShowCancelModal(true);
    } else {
      // Si no hay cambios, cancelar directamente sin modal
      setFormData(initializeFormData(columns));
    }
  };

// Efecto para limpiar selección cuando cambie la tabla

  useEffect(() => {

    setSelectedRowsForManualUpdate([]);

    setIsMultipleSelectionMode(false);

  }, [selectedTable]);

// Efecto para interceptar cambios de parámetro desde el exterior - DESHABILITADO

  // Los modales ahora se manejan en ProtectedTableSelector

  useEffect(() => {

    if (propSelectedTable !== undefined && propSelectedTable !== selectedTable) {

// Cambiar parámetro directamente sin modal

      handleParameterNavigation(propSelectedTable);

    }

  }, [propSelectedTable, selectedTable, handleParameterNavigation]);

// Efecto para interceptar cambios de pestaña desde el exterior - DESHABILITADO

  // Los modales ahora se manejan en ProtectedSubTabButton

  useEffect(() => {

    if (propActiveSubTab !== undefined && propActiveSubTab !== activeSubTab) {

// Cambiar pestaña directamente sin modal

      handleSubTabNavigation(propActiveSubTab);

    }

  }, [propActiveSubTab, activeSubTab, handleSubTabNavigation]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (

    <div className="animate-fadeIn">

      {/* Modal de confirmación para cambio de tabla */}
      <TableChangeConfirmationModal
        isOpen={!!pendingTableChange}
        onConfirm={confirmTableChange}
        onCancel={cancelTableChange}
      />

{/* Contenido principal */}

      <div>

        {selectedTable ? (

          <>

{/* Mensajes */}

            <MessageDisplay message={message} />

{/* Contenido basado en la sub-pestaña activa */}

            <div className="space-y-8">

                             {/* Estado de la tabla */}

               {activeSubTab === 'status' && (

                 <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6">

{tableInfo && (

                     <TableStatsDisplay tableData={tableData} userData={userData} />

                   )}

{loading ? (

                     <LoadingSpinner message="Cargando datos..." />

                   ) : (

                     <>

                       {/* Barra de búsqueda - Tactical Style */}

                       <SearchBarWithCounter
                         searchTerm={statusSearchTerm}
                         onSearchChange={(value) => {
                           const relatedData = {
                             paisesData,
                             empresasData,
                             fundosData,
                             ubicacionesData,
                             entidadesData,
                             nodosData,
                             tiposData,
                             metricasData,
                             criticidadesData,
                             perfilesData,
                             umbralesData,
                             userData,
                           };
                           handleStatusSearch(value, filteredTableData, statusVisibleColumns, userData, setStatusCurrentPage, relatedData);
                         }}
                         filteredCount={statusFilteredData.length}
                         totalCount={filteredTableData.length}
                       />

{/* Tabla con datos */}

                       <div className="overflow-x-auto -mx-2 sm:mx-0 custom-scrollbar">

                         <table className="w-full text-sm text-left text-neutral-300">

                           <thead className="text-xs text-neutral-400 bg-neutral-800">

                             <tr>

                               {statusVisibleColumns.map(col => {

                                 const displayName = getColumnDisplayName(col.columnName);

                                 return displayName ? (

                                   <th key={col.columnName} className="px-6 py-3 font-mono tracking-wider">

                                     {displayName.toUpperCase()}

                                   </th>

                                 ) : null;

                               })}

                             </tr>

                           </thead>

                           <tbody>

                             {statusVisibleColumns.length === 0 ? (
                               <tr>
                                 <td colSpan={10} className="px-6 py-8 text-center text-neutral-400">
                                   Cargando columnas...
                                 </td>
                               </tr>
                             ) : getStatusPaginatedData().map((row, index) => (

                               <tr key={index} className="bg-neutral-900 border-b border-neutral-700 hover:bg-neutral-800">

                                 {statusVisibleColumns.map(col => {

                                   const displayName = getColumnDisplayName(col.columnName);

                                   return displayName ? (

                                     <td key={col.columnName} className="px-6 py-4 text-xs font-mono">

                                       {col.columnName === 'usercreatedid' || col.columnName === 'usermodifiedid' 

                                         ? getUserName(row[col.columnName], userData)

                                         : col.columnName === 'statusid'

                                         ? (

                                           <span className={(() => {
                                             // Para filas agrupadas, verificar si al menos una fila original está activa
                                             if (row.originalRows && row.originalRows.length > 0) {
                                               const hasActiveRow = row.originalRows.some((originalRow: any) => originalRow.statusid === 1);
                                               return hasActiveRow ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold';
                                             }
                                             // Para filas normales, usar el statusid directamente
                                             return (row[col.columnName] === 1 ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold');
                                           })()}>

                                             {(() => {
                                               // Para filas agrupadas, verificar si al menos una fila original está activa
                                               if (row.originalRows && row.originalRows.length > 0) {
                                                 const hasActiveRow = row.originalRows.some((originalRow: any) => originalRow.statusid === 1);
                                                 return hasActiveRow ? 'Activo' : 'Inactivo';
                                               }
                                               // Para filas normales, usar el statusid directamente
                                               return (row[col.columnName] === 1 ? 'Activo' : 'Inactivo');
                                             })()}

                                           </span>

                                         )

                                         : col.columnName === 'datecreated' || col.columnName === 'datemodified'

                                         ? formatDate(row[col.columnName])

                                         : getDisplayValueLocal(row, col.columnName)}

                                     </td>

                                   ) : null;

                                 })}

                               </tr>

                             ))}

                           </tbody>

                         </table>

                       </div>

{/* Paginación */}

                       <PaginationControls
                         currentPage={statusCurrentPage}
                         totalPages={statusTotalPages}
                         onPageChange={handleStatusPageChange}
                         showPagination={statusTotalPages > 1}
                       />

                     </>

                   )}

                </div>

              )}

{/* Formulario de inserción */}

                {activeSubTab === 'insert' && (

                  <div className={`bg-neutral-900 border border-neutral-700 rounded-xl p-6 ${

                    selectedTable === 'sensor' || selectedTable === 'metricasensor' 

                      ? 'min-h-[800px]' 

                      : ''

                  }`}>

                    {/* Mensaje de registros insertados */}

                    <InsertionMessage

                      insertedRecords={insertedRecords}

                      tableName={selectedTable}

                      onClear={clearInsertedRecords}

                      nodosData={nodosData}

                      tiposData={tiposData}

                      ubicacionesData={ubicacionesData}

                      entidadesData={entidadesData}

                      paisesData={paisesData}

                      empresasData={empresasData}

                      fundosData={fundosData}

                      metricasData={metricasData}

                      criticidadesData={criticidadesData}

                      perfilesData={perfilesData}

                      userData={userData}

                    />

                                         {selectedTable === 'sensor' ? (

                                                <MultipleSensorForm

                           selectedNodo={selectedNodo}

                           setSelectedNodo={setSelectedNodo}

                           selectedEntidad={selectedEntidad}

                           setSelectedEntidad={setSelectedEntidad}

                           selectedTipo={selectedTipo}

                           setSelectedTipo={setSelectedTipo}

                           selectedStatus={selectedStatus}

                           setSelectedStatus={setSelectedStatus}

                           selectedSensorCount={selectedSensorCount}

                           setSelectedSensorCount={setSelectedSensorCount}

                           multipleSensors={multipleSensors}

                           nodosData={nodosData}

                           entidadesData={entidadesData}

                           tiposData={tiposData}

                           loading={loading}

                           onInitializeSensors={initializeMultipleSensors}

                           onUpdateSensorTipo={updateSensorTipo}

                           onToggleSensorDelete={toggleSensorDelete}

                           onUpdateSensorNodo={updateSensorNodo}

                           onUpdateAllSensorsNodo={updateAllSensorsNodo}

                           onInsertSensors={handleMultipleSensorInsert}

                           onCancel={() => {

                             setCancelAction(() => () => {

                             setMultipleSensors([]);

                             setSelectedNodo('');

                               setSelectedEntidad('');

                             setSelectedTipo('');

                               setSelectedSensorCount(0);

                               setMessage(null); // Limpiar mensaje de datos copiados

                             });

                             setShowCancelModal(true);

                           }}

                           getUniqueOptionsForField={getUniqueOptionsForField}

                           onReplicateClick={openReplicateModalForTable}

                           paisSeleccionado={paisSeleccionado}

                           empresaSeleccionada={empresaSeleccionada}

                           fundoSeleccionado={fundoSeleccionado}

                           paisesData={paisesData}

                           empresasData={empresasData}

                           fundosData={fundosData}

                         />

                                          ) : selectedTable === 'metricasensor' ? (

                                                                         <MultipleMetricaSensorFormLazyWithBoundary

                          selectedNodos={selectedNodos}

                          setSelectedNodos={setSelectedNodos}

                          selectedEntidad={selectedEntidadMetrica}

                          setSelectedEntidad={setSelectedEntidadMetrica}

                          selectedMetricas={selectedMetricas}

                          setSelectedMetricas={setSelectedMetricas}

                          selectedStatus={selectedStatus}

                          setSelectedStatus={setSelectedStatus}

                          multipleMetricas={multipleMetricas}

                          setMultipleMetricas={setMultipleMetricas}

                          nodosData={nodosData}

                          entidadesData={entidadesData}

                          metricasData={metricasData}

                          tiposData={tiposData}

                          sensorsData={sensorsData}

                          loading={loading}

                          onInitializeMetricas={initializeMultipleMetricas}

                          onInsertMetricas={handleMultipleMetricaInsert}

                          onCancel={() => {

                            setCancelAction(() => () => {

                            setMultipleMetricas([]);

                            setSelectedNodos([]);

                              setSelectedEntidadMetrica('');

                            setSelectedMetricas([]);

                              setIsReplicateMode(false);

                              setMessage(null); // Limpiar mensaje de datos copiados

                            });

                            setShowCancelModal(true);

                          }}

                          getUniqueOptionsForField={getUniqueOptionsForField}

                          onReplicateClick={openReplicateModalForTable}

                          isReplicateMode={isReplicateMode}

                          paisSeleccionado={paisSeleccionado}

                          empresaSeleccionada={empresaSeleccionada}

                          fundoSeleccionado={fundoSeleccionado}

                          paisesData={paisesData}

                          empresasData={empresasData}

                          fundosData={fundosData}

                        />

                                          ) : selectedTable === 'usuarioperfil' ? (

                                                                         <MultipleUsuarioPerfilForm

                          selectedUsuarios={selectedUsuarios}

                          setSelectedUsuarios={setSelectedUsuarios}

                          selectedPerfiles={selectedPerfiles}

                          setSelectedPerfiles={setSelectedPerfiles}

                          selectedStatus={selectedStatus}

                          setSelectedStatus={setSelectedStatus}

                          multipleUsuarioPerfiles={multipleUsuarioPerfiles}

                          setMultipleUsuarioPerfiles={setMultipleUsuarioPerfiles}

                          userData={userData}

                          perfilesData={perfilesData}

                          loading={loading}

                          onInitializeUsuarioPerfiles={initializeMultipleUsuarioPerfiles}

                          onInsertUsuarioPerfiles={handleMultipleUsuarioPerfilInsert}

                          onCancel={() => {

                            setCancelAction(() => () => {

                            setMultipleUsuarioPerfiles([]);

                            setSelectedUsuarios([]);

                            setSelectedPerfiles([]);

                              setMessage(null); // Limpiar mensaje de datos copiados

                            });

                            setShowCancelModal(true);

                          }}

                          getUniqueOptionsForField={getUniqueOptionsForUsuarioPerfilField}

                          onReplicateClick={openReplicateModalForTable}

                          paisSeleccionado={paisSeleccionado}

                          empresaSeleccionada={empresaSeleccionada}

                          fundoSeleccionado={fundoSeleccionado}

                          paisesData={paisesData}

                          empresasData={empresasData}

                          fundosData={fundosData}

                          usuarioperfilData={updateData}

                        />

                    ) : (

                      <div className={`space-y-6 relative ${

                        selectedTable === 'sensor' || selectedTable === 'metricasensor' 

                          ? 'min-h-[900px]' 

                          : 'min-h-[400px]'

                      }`}>

                        {/* Para contacto, mostrar mensaje si no se ha seleccionado tipo */}
                        {selectedTable === 'contacto' && !selectedContactType ? (
                          <div className="text-center py-8">
                            <p className="text-neutral-400 mb-4">Seleccione un tipo de contacto para continuar</p>
                            <button
                              onClick={() => setContactTypeModalOpen(true)}
                              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                              Seleccionar Tipo de Contacto
                            </button>
                          </div>
                        ) : (
                          <NormalInsertFormLazyWithBoundary

                            visibleColumns={getVisibleColumns(false)}

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

                            paisSeleccionado={paisSeleccionado}

                            empresaSeleccionada={empresaSeleccionada}

                            fundoSeleccionado={fundoSeleccionado}

                            paisesData={paisesData}

                            empresasData={empresasData}

                            fundosData={fundosData}

                            // Props específicas para contacto
                            selectedContactType={selectedContactType}
                            countryCodes={countryCodes}

                          />
                        )}

                      </div>

                    )}

                  </div>

                )}

{/* Formulario de actualización */}

               {activeSubTab === 'update' && (

                <div className="space-y-6">

                  {/* Mensajes específicos de actualización - Movidos al formulario de actualización */}

                  {/* {updateMessage && (

                    <div className={`p-4 rounded-lg mb-6 ${

                      updateMessage.type === 'success' ? 'bg-blue-600 bg-opacity-20 border border-blue-500' : 

                      updateMessage.type === 'warning' ? 'bg-yellow-600 bg-opacity-20 border border-yellow-500' :

                      updateMessage.type === 'info' ? 'bg-blue-600 bg-opacity-20 border border-blue-500' :

                      'bg-red-600 bg-opacity-20 border border-red-500'

                    } text-white font-mono tracking-wider`}>

                      {updateMessage.text}

                    </div>

                  )} */}

{/* Overlay Modal para formulario de actualización */}

                  {(selectedRowForUpdate || selectedRowsForUpdate.length > 0 || isMultipleSelectionMode) && (

                    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2 sm:p-4">

                      <div className="bg-neutral-900 bg-opacity-95 rounded-xl border border-neutral-700 p-4 sm:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-2 sm:mx-4">

{/* Información sobre múltiples filas seleccionadas automáticamente */}

                      {!isMultipleSelectionMode && selectedRowsForUpdate.length > 0 && (

                        <div className="mb-6 p-4 bg-neutral-800 border border-neutral-600 rounded-lg">

                          <h3 className="text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">

                            📋 ACTUALIZACIÓN MÚLTIPLE AUTOMÁTICA

                          </h3>

                          <p className="text-neutral-300 mb-3 font-mono">

                            Se han seleccionado <span className="font-bold text-orange-500">{selectedRowsForUpdate.length}</span> entradas del nodo <span className="font-bold text-orange-500">{selectedRowsForUpdate[0]?.nodoid}</span> para actualizar.

                            {(selectedTable === 'sensor' || selectedTable === 'metricasensor') && (

                              <span className="block text-sm text-neutral-400 mt-1 font-mono">

                                📅 Timestamp: {new Date(selectedRowsForUpdate[0]?.datecreated).toLocaleString()}

                              </span>

                            )}

                          </p>

                          <div className="text-sm text-neutral-400 font-mono">

                            <p>• Los cambios se aplicarán a todas las entradas seleccionadas</p>

                            <p>• Los campos clave no se pueden modificar</p>

                            <p>• Solo se actualizarán los campos que modifiques</p>

                          </div>

                        </div>

                      )}

{/* Formulario normal para actualización de una sola entrada */}

                      {selectedRowForUpdate && selectedRowsForUpdate.length === 0 && (

                        <div>
                          {/* Mensajes de validación para formulario de actualización - Solo mensajes de validación (amarillos) */}
                          {updateMessage && updateMessage.type !== 'success' && (
                            <div className={`p-4 rounded-lg mb-6 ${
                              updateMessage.type === 'warning' ? 'bg-yellow-600 bg-opacity-20 border border-yellow-500' :
                              updateMessage.type === 'info' ? 'bg-blue-600 bg-opacity-20 border border-blue-500' :
                              'bg-red-600 bg-opacity-20 border border-red-500'
                            } text-white font-mono tracking-wider`}>
                              {updateMessage.text}
                            </div>
                          )}
                          
                          {/* Filtros globales para formularios de actualización */}
                          {renderGlobalFiltersForUpdate()}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">

                        {updateVisibleColumns.map(col => {

                          const displayName = getColumnDisplayName(col.columnName);

                          if (!displayName) return null;

const value = updateFormData[col.columnName] || '';

// Campos automáticos - NO mostrar en formulario de actualización

                           if (['usercreatedid', 'usermodifiedid', 'datecreated', 'datemodified'].includes(col.columnName)) {

                             return null;

                           }

                           // Ocultar campos que ya se muestran como filtros globales contextuales
                           if (selectedTable === 'empresa' && col.columnName === 'paisid') {
                             return null;
                           }
                           
                           if (selectedTable === 'fundo' && (col.columnName === 'paisid' || col.columnName === 'empresaid')) {
                             return null;
                           }
                           
                           if (selectedTable === 'ubicacion' && (col.columnName === 'paisid' || col.columnName === 'empresaid' || col.columnName === 'fundoid')) {
                             return null;
                           }
                           
                           if (selectedTable === 'localizacion' && (col.columnName === 'paisid' || col.columnName === 'empresaid' || col.columnName === 'fundoid')) {
                             return null;
                           }
                           
                           if (selectedTable === 'entidad' && (col.columnName === 'paisid' || col.columnName === 'empresaid' || col.columnName === 'fundoid')) {
                             return null;
                           }

// Campos clave - mostrar como solo lectura

                           if (isKeyField(col.columnName)) {

                              const displayValue = col.columnName === 'usercreatedid' || col.columnName === 'usermodifiedid' 

                                 ? getUserName(value, userData)

                                 : col.columnName === 'statusid'

                                 ? (() => {
              // Para filas agrupadas, verificar si al menos una fila original está activa
              if (selectedRowForUpdate && selectedRowForUpdate.originalRows && selectedRowForUpdate.originalRows.length > 0) {
                const hasActiveRow = selectedRowForUpdate.originalRows.some((originalRow: any) => originalRow.statusid === 1);
                return hasActiveRow ? 'Activo' : 'Inactivo';
              }
              // Para filas normales, usar el statusid directamente
              return (value === 1 ? 'Activo' : 'Inactivo');
            })()

                                : selectedRowForUpdate ? getDisplayValueLocal(selectedRowForUpdate, col.columnName) : '';

return (

                               <div key={col.columnName} className="mb-4">

                                 <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">

                                   {displayName.toUpperCase()} 🔒

                                 </label>

                                 <input

                                   type="text"

                                   value={displayValue}

                                   readOnly

                                    className="w-full px-3 py-2 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-base font-mono cursor-not-allowed opacity-75"

                                    title="Campo clave - No editable"

                                  />

                               </div>

                             );

                           }

// Campo statusid como checkbox

                           if (col.columnName === 'statusid') {

                             return (

                               <div key={col.columnName} className="mb-4">

                                 <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">

                                   {displayName.toUpperCase()}

                                 </label>

                                 <div className="flex items-center space-x-3">

                                   <input

                                     type="checkbox"

                                     id={'update-' + col.columnName}

                                     checked={value === 1 || value === true}

                                     onChange={(e) => setUpdateFormData((prev: Record<string, any>) => ({

                                       ...prev,

                                       [col.columnName]: e.target.checked ? 1 : 0

                                     }))}

                                     className="w-4 h-4 text-orange-500 bg-neutral-800 border-neutral-600 rounded focus:ring-orange-500 focus:ring-2"

                                   />

                                   <label htmlFor={'update-' + col.columnName} className="text-white text-lg font-medium font-mono tracking-wider">

                                     ACTIVO

                                   </label>

                                 </div>

                               </div>

                             );

                           }

// Campos de texto normales (editables)

                           return (

                             <div key={col.columnName} className="mb-4">

                               <label className="block text-lg font-bold text-orange-500 mb-2 font-mono tracking-wider">

                                 {displayName.toUpperCase()}

                               </label>

                               <input

                                 type="text"

                                 value={value}

                                 onChange={(e) => setUpdateFormData((prev: Record<string, any>) => ({

                                   ...prev,

                                   [col.columnName]: e.target.value

                                 }))}

                                 className="w-full px-3 py-2 bg-neutral-800 border border-neutral-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white font-mono"

                               />

                             </div>

                           );

                        })}

                          </div>
                      </div>

                      )}

{/* Formulario avanzado para metricasensor */}

                      {(selectedRowsForUpdate.length > 0 || selectedRowsForManualUpdate.length > 0) && selectedTable === 'metricasensor' && (

                        <AdvancedMetricaSensorUpdateForm

                          selectedRows={selectedRowsForUpdate.length > 0 ? selectedRowsForUpdate : selectedRowsForManualUpdate}

                          onUpdate={handleAdvancedMetricaSensorUpdate}

                          onCancel={handleCancelUpdate}

                          getUniqueOptionsForField={getUniqueOptionsForField}

                          entidadesData={entidadesData}

                          tiposData={tiposData}

                          nodosData={nodosData}

                          metricasData={metricasData}

                        />

                      )}

{/* Formulario avanzado para sensor */}

                      {(selectedRowsForUpdate.length > 0 || selectedRowsForManualUpdate.length > 0) && selectedTable === 'sensor' && (

                        <AdvancedSensorUpdateForm

                          selectedRows={selectedRowsForUpdate.length > 0 ? selectedRowsForUpdate : selectedRowsForManualUpdate}

                          onUpdate={handleAdvancedSensorUpdate}

                          onCancel={handleCancelUpdate}

                          getUniqueOptionsForField={getUniqueOptionsForField}

                          entidadesData={entidadesData}

                          tiposData={tiposData}

                          nodosData={nodosData}

                        />

                      )}

{/* Formulario avanzado para usuarioperfil */}

                      {(selectedRowsForUpdate.length > 0 || selectedRowsForManualUpdate.length > 0) && selectedTable === 'usuarioperfil' && (

                        <AdvancedUsuarioPerfilUpdateForm

                          selectedRows={selectedRowsForUpdate.length > 0 ? selectedRowsForUpdate : selectedRowsForManualUpdate}

                          onUpdate={handleAdvancedUsuarioPerfilUpdate}

                          onCancel={handleCancelUpdate}

                          getUniqueOptionsForField={getUniqueOptionsForUsuarioPerfilField}

                          userData={userData}

                          perfilesData={perfilesData}

                        />

                      )}

{/* Tabla de entradas seleccionadas para actualización múltiple (otras tablas) */}

                      {(selectedRowsForUpdate.length > 0 || selectedRowsForManualUpdate.length > 0) && selectedTable !== 'metricasensor' && selectedTable !== 'sensor' && selectedTable !== 'usuarioperfil' && (

                        <div className="bg-neutral-800 border border-neutral-600 rounded-lg p-4 mb-6">

                          <div className="flex justify-between items-center mb-4">

                            <h4 className="text-lg font-bold text-orange-500 font-mono tracking-wider">ACTUALIZAR STATUS</h4>

                            <div className="flex gap-2">

                              <button

                                onClick={() => {

                                  const allRows = selectedRowsForUpdate.length > 0 ? selectedRowsForUpdate : selectedRowsForManualUpdate;

                                  const allSelected = allRows.every((row, index) => {

                                    const rowKey = `${row.nodoid || row.id || index}-${index}`;

                                    return individualRowStatus[rowKey] === true;

                                  });

// Toggle: si todos están seleccionados, deseleccionar todos; si no, seleccionar todos

                                  const newStatus = !allSelected;

                                  const newIndividualStatus: {[key: string]: boolean} = {};

allRows.forEach((row, index) => {

                                    const rowKey = `${row.nodoid || row.id || index}-${index}`;

                                    newIndividualStatus[rowKey] = newStatus;

                                  });

setIndividualRowStatus(newIndividualStatus);

                                }}

                                className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 transition-colors font-mono tracking-wider"

                              >

                                TODO

                              </button>

                            </div>

                          </div>

                          <div className="overflow-x-auto custom-scrollbar">

                            <table className="w-full text-sm">

                              <thead>

                                <tr className="border-b border-neutral-600">

                                  {updateVisibleColumns

                                    .filter(col => !['usercreatedid', 'usermodifiedid', 'datecreated', 'datemodified', 'statusid'].includes(col.columnName))

                                    .map(col => (

                                      <th key={col.columnName} className="text-left py-2 px-2 text-neutral-300 font-medium font-mono tracking-wider">

                                        {getColumnDisplayName(col.columnName).toUpperCase()}

                                      </th>

                                    ))}

                                  <th className="text-left py-2 px-2 text-neutral-300 font-medium font-mono tracking-wider">STATUS</th>

                                </tr>

                              </thead>

                              <tbody>

                                {(selectedRowsForUpdate.length > 0 ? selectedRowsForUpdate : selectedRowsForManualUpdate).map((row, index) => (

                                  <tr key={index} className="border-b border-neutral-600">

                                    {updateVisibleColumns

                                      .filter(col => !['usercreatedid', 'usermodifiedid', 'datecreated', 'datemodified', 'statusid'].includes(col.columnName))

                                      .map(col => (

                                        <td key={col.columnName} className="py-2 px-2 text-white font-mono">

                                          {getDisplayValueLocal(row, col.columnName)}

                                        </td>

                                      ))}

                                    <td className="py-2 px-2">

                                      <div className="flex items-center space-x-2">

                                        <input

                                          type="checkbox"

                                          checked={individualRowStatus[`${row.nodoid || row.id || index}-${index}`] || false}

                                          onChange={(e) => {

                                            const rowKey = `${row.nodoid || row.id || index}-${index}`;

                                            setIndividualRowStatus(prev => ({

                                              ...prev,

                                              [rowKey]: e.target.checked

                                            }));

                                          }}

                                          className="w-4 h-4 text-orange-500 bg-neutral-800 border-neutral-600 rounded focus:ring-orange-500 focus:ring-2"

                                        />

                                        <span className="text-white text-sm font-mono tracking-wider">

                                          {individualRowStatus[`${row.nodoid || row.id || index}-${index}`] ? 'ACTIVO' : 'INACTIVO'}

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

<ActionButtons
                        selectedTable={selectedTable}
                        updateLoading={updateLoading}
                        onUpdate={handleUpdate}
                        onCancelUpdate={handleCancelUpdate}
                      />

                      </div>

                    </div>

                  )}

{/* Sección de Selección y Registros - SOLO cuando NO hay selección */}

                   {!selectedRowForUpdate && selectedRowsForUpdate.length === 0 && (

                     <>

                                              {/* Mensaje de éxito para actualizaciones - Arriba del searchbar */}
                                              {updateMessage && updateMessage.type === 'success' && (
                                                <div className={`p-4 rounded-lg mb-6 ${
                                                  updateMessage.type === 'success' ? 'bg-blue-600 bg-opacity-20 border border-blue-500' : 
                                                  updateMessage.type === 'warning' ? 'bg-yellow-600 bg-opacity-20 border border-yellow-500' :
                                                  updateMessage.type === 'info' ? 'bg-blue-600 bg-opacity-20 border border-blue-500' :
                                                  'bg-red-600 bg-opacity-20 border border-red-500'
                                                } text-white font-mono tracking-wider`}>
                                                  {updateMessage.text}
                                                </div>
                                              )}

                                              {/* Búsqueda simple - Igual que en "Estado" */}

                        <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6">

                          <div className="space-y-4">

                            {/* Barra de búsqueda simple como en "Estado" - Tactical Style */}

                            <div className="relative">

                              <input

                                type="text"

                                value={searchTerm}

                                onChange={(e) => {
                                  const relatedData = {
                                    paisesData,
                                    empresasData,
                                    fundosData,
                                    ubicacionesData,
                                    entidadesData,
                                    nodosData,
                                    tiposData,
                                    metricasData,
                                    localizacionesData,
                                    criticidadesData,
                                    perfilesData,
                                    umbralesData,
                                    userData,
                                  };
                                  handleSearchTermChange(e.target.value, updateData, updateVisibleColumns, userData, updateData, setUpdateFilteredData, relatedData);
                                }}

                                placeholder="🔍 Buscar en todos los campos..."

                                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-white placeholder-neutral-400 font-mono"

                              />

                            </div>

                            {searchTerm && (

                              <div className="mt-2 text-sm text-neutral-400 font-mono">

                                Mostrando {updateFilteredData.length} de {updateData.length} registros

                              </div>

                            )}

                          </div>

                        </div>

{/* Botones de selección múltiple para sensor y metricasensor - Solo mostrar cuando hay selecciones */}

                        <MultipleSelectionButtons
                          selectedTable={selectedTable}
                          selectedRowsForManualUpdate={selectedRowsForManualUpdate}
                          onGoToManualUpdateForm={handleGoToManualUpdateForm}
                          onDeselectAll={handleDeselectAll}
                        />

{/* Tabla de datos para actualizar - Usando la misma lógica que "Estado" */}

                       <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6">

                         <div className="overflow-x-auto -mx-2 sm:mx-0 custom-scrollbar">

                           {(() => {
                             return updateFilteredData.length > 0;
                           })() ? (

                             <table className="w-full text-sm text-left text-neutral-300">

                                                                <thead className="text-xs text-neutral-400 bg-neutral-800">

                                   <tr>

                                     <th className="px-2 py-3 w-12">

                                       {/* Columna de selección sin título */}

                                     </th>

                                     {updateVisibleColumns.map(col => {

                                       const displayName = getColumnDisplayName(col.columnName);

                                       return displayName ? (

                                         <th key={col.columnName} className={`px-6 py-3 font-mono tracking-wider ${col.columnName === 'tipos' ? 'min-w-[300px] max-w-[400px]' : ''}`}>

                                           {displayName.toUpperCase()}

                                         </th>

                                       ) : null;

                                     })}

                                   </tr>

                                 </thead>

                                                               <tbody>

                                 {updateVisibleColumns.length === 0 ? (
                                   <tr>
                                     <td colSpan={10} className="px-6 py-8 text-center text-neutral-400">
                                       Cargando columnas...
                                     </td>
                                   </tr>
                                 ) : (() => {

                                   const data = getUpdatePaginatedData();

                                   return data;

                                 })().map((row, index) => {

const isSelected = (selectedTable === 'sensor' || selectedTable === 'metricasensor' || selectedTable === 'usuarioperfil') 

                                     ? selectedRowsForManualUpdate.some(r => getRowIdForSelection(r) === getRowIdForSelection(row))

                                     : selectedRowForUpdate === row;

// Detectar si no hay métricas activas o perfiles activos

                                   const hasNoActiveMetrics = row.tipos === 'Sin sensores activos';

                                   const hasNoActivePerfiles = row.perfiles === 'Sin perfiles activos';

return (

                                   <tr key={(effectiveCurrentPage - 1) * itemsPerPage + index} className={`bg-neutral-900 border-b border-neutral-700 hover:bg-neutral-800 cursor-pointer ${hasNoActiveMetrics || hasNoActivePerfiles ? 'text-red-400' : ''}`} onClick={(e) => {

                                     // Solo ejecutar si no se hizo clic en el checkbox

                                     if ((e.target as HTMLInputElement).type !== 'checkbox') {

                                     if (selectedTable === 'sensor' || selectedTable === 'metricasensor' || selectedTable === 'usuarioperfil') {

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

                                           if (selectedTable === 'sensor' || selectedTable === 'metricasensor' || selectedTable === 'usuarioperfil') {

                                             // Toggle selection: if selected, unselect; if not selected, select

                                             handleSelectRowForManualUpdate(row, !isSelected);

                                           } else {

                                             handleSelectRowForUpdate(row);

                                           }

                                         }}

                                         className="w-4 h-4 text-orange-500 bg-neutral-800 border-neutral-600 rounded focus:ring-orange-500 focus:ring-2"

                                       />

                                     </td>

                                     {updateVisibleColumns.map(col => {

                                       const displayName = getColumnDisplayName(col.columnName);

                                       return displayName ? (

                                         <td key={col.columnName} className={`px-6 py-4 text-xs font-mono ${col.columnName === 'tipos' || col.columnName === 'perfiles' ? 'min-w-[300px] max-w-[400px]' : ''}`}>

                                           {(() => {

                                             if (col.columnName === 'usercreatedid' || col.columnName === 'usermodifiedid') {

                                               return getUserName(row[col.columnName], userData);

                                             }

if (col.columnName === 'statusid') {

                                               return (

                                                 <span className={(() => {
                                             // Para filas agrupadas, verificar si al menos una fila original está activa
                                             if (row.originalRows && row.originalRows.length > 0) {
                                               const hasActiveRow = row.originalRows.some((originalRow: any) => originalRow.statusid === 1);
                                               return hasActiveRow ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold';
                                             }
                                             // Para filas normales, usar el statusid directamente
                                             return (row[col.columnName] === 1 ? 'text-green-400 font-semibold' : 'text-red-400 font-semibold');
                                           })()}>

                                                   {(() => {
                                               // Para filas agrupadas, verificar si al menos una fila original está activa
                                               if (row.originalRows && row.originalRows.length > 0) {
                                                 const hasActiveRow = row.originalRows.some((originalRow: any) => originalRow.statusid === 1);
                                                 return hasActiveRow ? 'Activo' : 'Inactivo';
                                               }
                                               // Para filas normales, usar el statusid directamente
                                               return (row[col.columnName] === 1 ? 'Activo' : 'Inactivo');
                                             })()}

                                                 </span>

                                               );

                                             }

if (col.columnName === 'datecreated' || col.columnName === 'datemodified') {

                                               return formatDate(row[col.columnName]);

                                             }

if (col.columnName === 'tipos' && selectedTable === 'metricasensor') {

                                               return (

                                                 <div className="whitespace-normal break-words">

                                                   {row.tipos || getDisplayValueLocal(row, col.columnName)}

                                                 </div>

                                               );

                                             }

if (col.columnName === 'tipos' && selectedTable === 'sensor') {

                                               return (

                                                 <div className="whitespace-normal break-words">

                                                   {row.tipos || getDisplayValueLocal(row, col.columnName)}

                                                 </div>

                                               );

                                             }

if (col.columnName === 'perfiles' && selectedTable === 'usuarioperfil') {

return (

                                                 <div className="whitespace-normal break-words">

                                                   {row.perfiles || getDisplayValueLocal(row, col.columnName)}

                                                 </div>

                                               );

                                             }

if (col.columnName === 'usuario' && selectedTable === 'usuarioperfil') {

return (

                                                 <div className="whitespace-normal break-words">

                                                   {row.usuario || getDisplayValueLocal(row, col.columnName)}

                                                 </div>

                                               );

                                             }

return getDisplayValueLocal(row, col.columnName);

                                           })()}

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

                           {updateFilteredData.length > 0 && totalPages > 1 && (

                             <div className="flex justify-center gap-2 mt-4">

                               <button

                                 onClick={handleMetricaSensorFirstPage}

                                 disabled={!correctedHasPrevPage}

                                 className="px-3 py-2 bg-neutral-800 border border-neutral-600 text-white rounded-lg hover:bg-neutral-700 transition-colors disabled:opacity-50 font-mono tracking-wider"

                                 title="Primera página"

                               >

                                 ⏮️

                               </button>

                               <button

                                 onClick={handleMetricaSensorPrevPage}

                                 disabled={!correctedHasPrevPage}

                                 className="px-4 py-2 bg-neutral-800 border border-neutral-600 text-white rounded-lg hover:bg-neutral-700 transition-colors disabled:opacity-50 font-mono tracking-wider"

                               >

                                 ← ANTERIOR

                               </button>

                               <span className="text-white flex items-center px-3 font-mono tracking-wider">

                                 PÁGINA {effectiveCurrentPage} DE {correctedTotalPages}

                               </span>

                               <button

                                 onClick={handleMetricaSensorNextPage}

                                 disabled={!correctedHasNextPage}

                                 className="px-4 py-2 bg-neutral-800 border border-neutral-600 text-white rounded-lg hover:bg-neutral-700 transition-colors disabled:opacity-50 font-mono tracking-wider"

                               >

                                 SIGUIENTE →

                               </button>

                               <button

                                 onClick={handleMetricaSensorLastPage}

                                 disabled={!correctedHasNextPage}

                                 className="px-3 py-2 bg-neutral-800 border border-neutral-600 text-white rounded-lg hover:bg-neutral-700 transition-colors disabled:opacity-50 font-mono tracking-wider"

                                 title="Última página"

                               >

                                 ⏭️

                               </button>

                             </div>

                           )}

                       </div>

                     </>

                   )}

                </div>

              )}

{/* Formulario de creación masiva */}

              {activeSubTab === 'massive' && (

                <div className="bg-neutral-900 border border-neutral-700 rounded-xl p-6">

                  {selectedTable === 'sensor' ? (

                    <MassiveSensorForm

                      getUniqueOptionsForField={getUniqueOptionsForField}

                      onApply={handleMassiveSensorCreation}

                      onCancel={() => {

                        setCancelAction(() => () => {

                          setMessage(null);

                        });

                        setShowCancelModal(true);

                      }}

                      loading={loading}

                      entidadesData={entidadesData}

                    />

                  ) : selectedTable === 'metricasensor' ? (

                    <MassiveMetricaSensorForm

                      getUniqueOptionsForField={getUniqueOptionsForField}

                      onApply={handleMassiveMetricaSensorCreation}

                      onCancel={() => {

                        setCancelAction(() => () => {

                          setMessage(null);

                        });

                        setShowCancelModal(true);

                      }}

                      loading={loading}

                    />

                  ) : selectedTable === 'usuarioperfil' ? (

                    <div className="text-center py-8">

                      <div className="text-neutral-400 text-lg font-mono tracking-wider">

                        CREACIÓN MASIVA DE USUARIO PERFIL

                      </div>

                      <div className="text-neutral-500 text-sm font-mono mt-2">

                        (Próximamente)

                      </div>

                    </div>

                  ) : selectedTable === 'umbral' ? (

                    <MassiveUmbralFormLazyWithBoundary

                      getUniqueOptionsForField={getUniqueOptionsForField}

                      onApply={handleMassiveUmbralCreationSimple}

                      onCancel={() => {

                        setCancelAction(() => () => {

                          setMessage(null);

                        });

                        setShowCancelModal(true);

                      }}

                      loading={loading}

                      paisSeleccionado={paisSeleccionado}

                      empresaSeleccionada={empresaSeleccionada}

                      fundoSeleccionado={fundoSeleccionado}

                      getPaisName={getPaisName}

                      getEmpresaName={getEmpresaName}

                      getFundoName={getFundoName}

                      localizacionesData={localizacionesData}

                    />

                  ) : (

                    <div className="text-center py-8">

                      <div className="text-neutral-400 text-lg font-mono tracking-wider">

                        CREACIÓN MASIVA NO DISPONIBLE

                      </div>

                      <div className="text-neutral-500 text-sm font-mono mt-2">

                        Esta funcionalidad solo está disponible para tablas de inserción múltiple

                      </div>

                    </div>

                   )}

                </div>

              )}

</div>

          </>

        ) : (

          <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">

            <div className="text-center">

              <div className="bg-neutral-900 border border-neutral-700 rounded-lg p-6 max-w-md mx-auto">

                <div className="flex items-center justify-center mb-4">

                  <svg className="w-8 h-8 text-orange-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />

                  </svg>

                  <h2 className="text-2xl font-bold text-orange-500 font-mono tracking-wider">SELECCIONAR PARÁMETRO</h2>

                </div>

                <p className="text-neutral-300 font-mono tracking-wider">SELECCIONA UNA OPCIÓN DEL MENÚ LATERAL PARA CONTINUAR</p>

              </div>

                    </div>

                        </div>

                      )}

                  </div>

{/* Modal de confirmación para cancelar */}

      {showCancelModal && (

        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">

          <div className="bg-neutral-800 border border-orange-500 rounded-lg p-6 max-w-md mx-4">

            {/* Solo el icono centrado */}
            <div className="flex justify-center mb-6">
              <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            
            {/* Mensaje centrado */}
            <div className="mb-6 text-center">
              <p className="text-white font-mono text-sm leading-relaxed">
                Se perderá toda la información ingresada en el formulario.
              </p>
            </div>

            {/* Botones centrados */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleConfirmCancel}
                className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white font-mono tracking-wider rounded-lg transition-colors"
              >
                CONTINUAR
              </button>
              <button
                onClick={handleCancelModal}
                className="px-6 py-2 bg-neutral-600 hover:bg-neutral-500 text-white font-mono tracking-wider rounded-lg transition-colors"
              >
                CANCELAR
              </button>
            </div>
          </div>
        </div>
      )}

{/* Modal de pérdida de datos - Desactivado, usando el sistema de App.tsx */}

      {/* <LostDataModal

        isOpen={showLostDataModal}

        onConfirm={handleConfirmLostData}

        onCancel={handleCancelLostData}

        currentTab={activeSubTab === 'insert' ? 'Crear' : activeSubTab === 'massive' ? 'Masivo' : activeSubTab === 'update' ? 'Actualizar' : 'Estado'}

        targetTab={pendingTabChange === 'insert' ? 'Crear' : pendingTabChange === 'massive' ? 'Masivo' : pendingTabChange === 'update' ? 'Actualizar' : 'Estado'}

      /> */}

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

          selectedEntidad={replicateOptions.selectedEntidad}

          loading={loading}

        />

      )}

{/* Modal simple para confirmación de cambios */}

      {modalState && (

        <SimpleModal

          isOpen={modalState.isOpen}

          onConfirm={confirmAction}

          onCancel={cancelSimpleAction}

          type={modalState.type}

          currentContext={modalState.currentContext}

          targetContext={modalState.targetContext}

        />

      )}

      {/* Modal de selección de tipo de contacto */}
      <ContactTypeModal
        isOpen={contactTypeModalOpen}
        onClose={() => {
          setContactTypeModalOpen(false);
        }}
        onSelectType={handleContactTypeSelection}
      />

</div>

  );

});

SystemParameters.displayName = 'SystemParameters';

export default SystemParameters;

