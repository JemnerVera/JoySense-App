// ============================================================================
// HOOK: useSystemParametersSync - Sincronización de estado y props
// ============================================================================

import { useEffect, useRef } from 'react';
import React from 'react';

interface UseSystemParametersSyncProps {
  propSelectedTable?: string;
  propActiveSubTab?: 'status' | 'insert' | 'update' | 'massive';
  selectedTable: string;
  activeSubTab: 'status' | 'insert' | 'update' | 'massive';
  formState: {
    data: Record<string, any>;
    isDirty: boolean;
  };
  setSelectedTable: (table: string) => void;
  setActiveSubTab: (tab: 'status' | 'insert' | 'update' | 'massive') => void;
  resetForm: () => void;
  setUpdateFormData: (data: Record<string, any>) => void;
  setTableData: (data: any[]) => void;
  setColumns: (columns: any[]) => void;
  setLoading: (loading: boolean) => void;
  setMessage: (message: any) => void;
  setSelectedRow: (row: any) => void;
  onFormDataChange?: (formData: Record<string, any>, multipleData: any[]) => void;
  loadRelatedTablesData: () => void;
  loadTableData: (table: string) => void;
  loadData: () => void;
  loadRelatedData: () => void;
  setInsertedRecords: React.Dispatch<React.SetStateAction<Array<{ id: string; fields: Record<string, any> }>>>;
  skipNextSyncRef?: React.MutableRefObject<boolean>;
  isProcessingTabChangeRef?: React.MutableRefObject<boolean>;
}

export const useSystemParametersSync = ({
  propSelectedTable,
  propActiveSubTab = 'status',
  selectedTable,
  activeSubTab,
  formState,
  setSelectedTable,
  setActiveSubTab,
  resetForm,
  setUpdateFormData,
  setTableData,
  setColumns,
  setLoading,
  setMessage,
  setSelectedRow,
  onFormDataChange,
  loadRelatedTablesData,
  loadTableData,
  loadData,
  loadRelatedData,
  setInsertedRecords,
  skipNextSyncRef,
  isProcessingTabChangeRef
}: UseSystemParametersSyncProps) => {
  
  // Refs para evitar loops infinitos
  const prevFormDataRef = useRef<string>('');
  const prevActiveSubTabRef = useRef<'status' | 'insert' | 'update' | 'massive'>(activeSubTab);
  const onFormDataChangeRef = useRef(onFormDataChange);
  const lastLoadRef = useRef<{ table: string; subTab: string }>({ table: '', subTab: '' });

  // Actualizar el ref cuando cambie la función
  useEffect(() => {
    onFormDataChangeRef.current = onFormDataChange;
  }, [onFormDataChange]);

  // Sync selectedTable con prop
  useEffect(() => {
    if (propSelectedTable && propSelectedTable !== selectedTable) {
      setSelectedTable(propSelectedTable);
    }
  }, [propSelectedTable, selectedTable, setSelectedTable]);

  // Notificar cambios en formData al componente padre (para protección de datos)
  useEffect(() => {
    // Solo notificar si estamos en la pestaña "insert"
    if (activeSubTab === 'insert') {
      // Comparar si el formData realmente cambió (usando JSON.stringify para comparación profunda)
      const formDataString = JSON.stringify(formState.data);
      const activeSubTabChanged = prevActiveSubTabRef.current !== activeSubTab;
      
      // Solo notificar si cambió el formData o si cambió la pestaña activa
      if (formDataString !== prevFormDataRef.current || activeSubTabChanged) {
        if (onFormDataChangeRef.current) {
          onFormDataChangeRef.current(formState.data, []);
        }
        prevFormDataRef.current = formDataString;
        prevActiveSubTabRef.current = activeSubTab;
      }
    } else {
      // Si no estamos en "insert", resetear el ref
      prevFormDataRef.current = '';
      prevActiveSubTabRef.current = activeSubTab;
    }
  }, [formState.data, activeSubTab]);

  // Sincronizar activeSubTab con prop cuando cambia desde fuera
  // NOTA: Cuando propActiveSubTab cambia, significa que App.tsx ya actualizó el estado
  // Necesitamos validar si ese cambio es válido antes de proceder
  // Si hay cambios sin guardar, debemos REVERTIR el cambio en App.tsx
  const lastPropActiveSubTabRef = useRef<string>('');
  const lastValidatedTabRef = useRef<string>('');
  const isProcessingSyncRef = useRef<boolean>(false);
  const internalSkipNextSyncRef = skipNextSyncRef || { current: false };
  
  useEffect(() => {
    // Si se marcó para saltar la próxima sincronización (porque el cambio fue iniciado internamente)
    if (internalSkipNextSyncRef.current) {
      internalSkipNextSyncRef.current = false;
      // Actualizar el ref para evitar procesar este cambio
      lastPropActiveSubTabRef.current = propActiveSubTab || '';
      return;
    }
    
    // Si hay un procesamiento de cambio de tab en curso, no procesar
    if (isProcessingTabChangeRef?.current) {
      return;
    }
    
    // Solo procesar si el prop cambió y es diferente al último validado
    // Y si no hay un procesamiento en curso
    // IMPORTANTE: Si activeSubTab ya coincide con propActiveSubTab, significa que el cambio
    // ya fue procesado por ProtectedSubTabButton, así que no necesitamos validar de nuevo
    if (propActiveSubTab && 
        propActiveSubTab !== activeSubTab && 
        propActiveSubTab !== lastPropActiveSubTabRef.current &&
        !isProcessingSyncRef.current) {
      
      // Marcar que estamos procesando para evitar llamadas duplicadas
      isProcessingSyncRef.current = true;
      lastPropActiveSubTabRef.current = propActiveSubTab;
      
      // Llamar a setActiveSubTab que validará cambios
      // IMPORTANTE: setActiveSubTab ahora puede prevenir el cambio si hay cambios sin guardar
      // y debería revertir propActiveSubTab llamando a onSubTabChange con el tab actual
      setActiveSubTab(propActiveSubTab);
      
      // Resetear el ref después de un delay para permitir futuros cambios
      setTimeout(() => {
        // Si después del delay el activeSubTab NO cambió a propActiveSubTab,
        // significa que el cambio fue bloqueado y debemos revertir propActiveSubTab
        if (activeSubTab !== propActiveSubTab && propActiveSubTab !== lastValidatedTabRef.current) {
          // El cambio fue bloqueado - necesitamos revertir en App.tsx
          // Pero esto puede causar un loop, así que mejor no hacer nada aquí
          // El modal ya debería haber prevenido el cambio visualmente
        } else if (activeSubTab === propActiveSubTab) {
          // El cambio fue exitoso
          lastValidatedTabRef.current = propActiveSubTab;
        }
        // Resetear para permitir futuros cambios
        lastPropActiveSubTabRef.current = '';
        isProcessingSyncRef.current = false;
      }, 500);
    }
  }, [propActiveSubTab, activeSubTab, setActiveSubTab]);

  // Cargar datos relacionados al montar el componente (una sola vez)
  useEffect(() => {
    loadRelatedTablesData();
  }, [loadRelatedTablesData]); // Solo al montar

  // Limpiar datos inmediatamente cuando cambia selectedTable (antes de cargar)
  // PERO NO limpiar columnas si solo cambia activeSubTab
  const prevSelectedTableRef = useRef<string>('');
  useEffect(() => {
    if (selectedTable && selectedTable !== prevSelectedTableRef.current) {
      // Limpiar datos inmediatamente al cambiar de tabla para evitar mostrar datos incorrectos
      setTableData([]); // Limpiar datos de tabla
      setColumns([]); // Limpiar columnas solo cuando cambia la tabla
      setLoading(true); // Establecer loading
      setMessage(null);
      setSelectedRow(null);
      resetForm();
      setUpdateFormData({});
      setInsertedRecords([]); // Limpiar registros insertados al cambiar de tabla
      prevSelectedTableRef.current = selectedTable;
    }
  }, [
    selectedTable,
    setTableData,
    setColumns,
    setLoading,
    setMessage,
    setSelectedRow,
    resetForm,
    setUpdateFormData,
    setInsertedRecords
  ]);

  // Cargar datos cuando cambia la tabla (NO cuando cambia activeSubTab)
  const prevTableForLoadRef = useRef<string>('');
  useEffect(() => {
    if (selectedTable && selectedTable !== prevTableForLoadRef.current) {
      
      // Para StatusTab: usar solo useTableDataManagement (tableData y columns)
      // Para Insert/Update: usar useTableCRUD (tableState.data)
      // SIEMPRE cargar columnas cuando cambia la tabla
      // Las columnas son necesarias para InsertTab y UpdateTab
      loadTableData(selectedTable);
      loadRelatedTablesData(); // También cargar cuando cambia la tabla por si acaso
      
      prevTableForLoadRef.current = selectedTable;
      
      // Cargar datos con useTableCRUD solo si no estamos en StatusTab
      // (se cargará cuando se cambie a Insert o Update)
      if (activeSubTab !== 'status') {
        loadData();
        loadRelatedData();
      }
    }
  }, [selectedTable, loadTableData, loadRelatedTablesData, loadData, loadRelatedData]); // Removido activeSubTab de dependencias para evitar recargas innecesarias

  // Limpiar formulario, mensaje y registros insertados cuando se cambia de pestaña
  useEffect(() => {
    // Si cambiamos de pestaña (cualquier cambio), limpiar el mensaje y registros insertados
    if (activeSubTab !== prevActiveSubTabRef.current) {
      setMessage(null);
      
      // SIEMPRE limpiar el formulario cuando cambiamos de pestaña, independientemente de la dirección
      // Esto asegura que los valores no persistan entre pestañas
      const shouldResetForm = 
        (prevActiveSubTabRef.current === 'insert' && activeSubTab !== 'insert') || // Salimos de insert
        (activeSubTab === 'insert' && prevActiveSubTabRef.current !== 'insert') || // Entramos a insert
        (prevActiveSubTabRef.current === 'update' && activeSubTab !== 'insert' && activeSubTab !== 'update') || // Salimos de update
        (prevActiveSubTabRef.current !== 'insert' && prevActiveSubTabRef.current !== 'update' && activeSubTab === 'insert'); // Entramos a insert desde status/massive
      
      // IMPORTANTE: Si estamos entrando a insert desde cualquier otra pestaña, SIEMPRE resetear
      // Esto asegura que el formulario esté limpio cuando volvemos a insert
      const isEnteringInsert = activeSubTab === 'insert' && prevActiveSubTabRef.current !== 'insert';
      const isLeavingUpdate = prevActiveSubTabRef.current === 'update' && activeSubTab !== 'update';
      
      // CRÍTICO: Si estamos saliendo de UPDATE, siempre resetear ANTES de cualquier otra cosa
      // Esto previene que los datos de UPDATE persistan cuando volvemos a INSERT
      if (isLeavingUpdate) {
        resetForm(); // Resetear inmediatamente al salir de update
        setUpdateFormData({}); // Limpiar datos de actualización
      }
      
      if (shouldResetForm || isEnteringInsert) {
        // Limpiar registros insertados siempre que salimos o entramos a insert
        if (prevActiveSubTabRef.current === 'insert' || activeSubTab === 'insert') {
          setInsertedRecords([]);
        }
        
        // Si no se reseteó ya (por isLeavingUpdate), resetear ahora
        if (!isLeavingUpdate) {
          resetForm();
        }
      }
    }
    prevActiveSubTabRef.current = activeSubTab;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSubTab]); // Removido formState.data de dependencias para evitar ejecuciones múltiples

  // Recargar datos cuando se cambia a la pestaña de Estado
  useEffect(() => {
    // Solo recargar si cambió la tabla o el subTab (evitar loops)
    const key = `${selectedTable}-${activeSubTab}`;
    const lastKey = `${lastLoadRef.current.table}-${lastLoadRef.current.subTab}`;
    if (key !== lastKey && selectedTable && activeSubTab === 'status') {
      lastLoadRef.current = { table: selectedTable, subTab: activeSubTab };
      loadData();
    }
  }, [activeSubTab, selectedTable, loadData]);
};

