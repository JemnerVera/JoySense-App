// ============================================================================
// HOOK: useSystemParametersSync - Sincronización de estado y props
// ============================================================================

import { useEffect, useRef } from 'react';

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
  loadRelatedData
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
  useEffect(() => {
    if (propActiveSubTab && propActiveSubTab !== activeSubTab) {
      // Si veníamos de 'insert' o 'update' y cambiamos a otra pestaña, limpiar formulario
      if ((activeSubTab === 'insert' || activeSubTab === 'update') && 
          propActiveSubTab !== 'insert' && propActiveSubTab !== 'update') {
        resetForm();
        setUpdateFormData({});
      }
      
      setActiveSubTab(propActiveSubTab);
    }
  }, [propActiveSubTab, activeSubTab, resetForm, setActiveSubTab, setUpdateFormData]);

  // Cargar datos relacionados al montar el componente (una sola vez)
  useEffect(() => {
    loadRelatedTablesData();
  }, [loadRelatedTablesData]); // Solo al montar

  // Limpiar datos inmediatamente cuando cambia selectedTable (antes de cargar)
  useEffect(() => {
    if (selectedTable) {
      // Limpiar datos inmediatamente al cambiar de tabla para evitar mostrar datos incorrectos
      setTableData([]); // Limpiar datos de tabla
      setColumns([]); // Limpiar columnas
      setLoading(true); // Establecer loading
      setMessage(null);
      setSelectedRow(null);
      resetForm();
      setUpdateFormData({});
    }
  }, [
    selectedTable,
    setTableData,
    setColumns,
    setLoading,
    setMessage,
    setSelectedRow,
    resetForm,
    setUpdateFormData
  ]);

  // Cargar datos cuando cambia la tabla
  useEffect(() => {
    if (selectedTable) {
      // Para StatusTab: usar solo useTableDataManagement (tableData y columns)
      // Para Insert/Update: usar useTableCRUD (tableState.data)
      // Cargar datos de tabla y columnas (para StatusTab)
      loadTableData(selectedTable);
      loadRelatedTablesData(); // También cargar cuando cambia la tabla por si acaso
      
      // Cargar datos con useTableCRUD solo si no estamos en StatusTab
      // (se cargará cuando se cambie a Insert o Update)
      if (activeSubTab !== 'status') {
        loadData();
        loadRelatedData();
      }
    }
  }, [selectedTable, activeSubTab, loadTableData, loadRelatedTablesData, loadData, loadRelatedData]);

  // Limpiar formulario cuando se cambia de pestaña (si veníamos de insert o update)
  useEffect(() => {
    // Si cambiamos desde 'insert' o 'update' a otra pestaña, limpiar formulario
    if ((prevActiveSubTabRef.current === 'insert' || prevActiveSubTabRef.current === 'update') && 
        activeSubTab !== prevActiveSubTabRef.current && 
        activeSubTab !== 'insert' && activeSubTab !== 'update') {
      resetForm();
      setUpdateFormData({});
    }
    prevActiveSubTabRef.current = activeSubTab;
  }, [activeSubTab, resetForm, setUpdateFormData, formState.data]);

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

