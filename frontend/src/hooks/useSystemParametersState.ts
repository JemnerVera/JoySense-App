import { useState, useEffect, useCallback } from 'react';

export interface SystemParametersState {
  selectedTable: string;
  activeSubTab: 'status' | 'insert' | 'update' | 'massive';
  updateData: any[];
  updateFilteredData: any[];
  searchField: string;
  searchTerm: string;
  selectedRowForUpdate: any;
  updateFormData: Record<string, any>;
  updateLoading: boolean;
  hasSearched: boolean;
  statusCurrentPage: number;
  statusTotalPages: number;
  statusSearchTerm: string;
  statusFilteredData: any[];
  statusLoading: boolean;
  copyData: any[];
  selectedRowsForCopy: any[];
}

export interface SystemParametersStateActions {
  setSelectedTable: (table: string) => void;
  setActiveSubTab: (tab: 'status' | 'insert' | 'update' | 'massive') => void;
  setUpdateData: (data: any[]) => void;
  setUpdateFilteredData: (data: any[]) => void;
  setSearchField: (field: string) => void;
  setSearchTerm: (term: string) => void;
  setSelectedRowForUpdate: (row: any) => void;
  setUpdateFormData: (data: Record<string, any>) => void;
  setUpdateLoading: (loading: boolean) => void;
  setHasSearched: (searched: boolean) => void;
  setStatusCurrentPage: (page: number) => void;
  setStatusTotalPages: (pages: number) => void;
  setStatusSearchTerm: (term: string) => void;
  setStatusFilteredData: (data: any[]) => void;
  setStatusLoading: (loading: boolean) => void;
  setCopyData: (data: any[]) => void;
  setSelectedRowsForCopy: (rows: any[]) => void;
  resetFormData: () => void;
  resetUpdateForm: () => void;
  resetSearch: () => void;
  resetStatusSearch: () => void;
}

/**
 * Hook personalizado para manejar el estado principal de SystemParameters
 * Centraliza toda la gestión de estado del componente
 */
export const useSystemParametersState = (
  propSelectedTable?: string,
  propActiveSubTab?: 'status' | 'insert' | 'update' | 'massive'
): SystemParametersState & SystemParametersStateActions => {
  
  // Estados principales
  const [selectedTable, setSelectedTable] = useState<string>(propSelectedTable || '');
  const [activeSubTab, setActiveSubTab] = useState<'status' | 'insert' | 'update' | 'massive'>(propActiveSubTab || 'status');
  
  // Estados de datos de actualización
  const [updateData, setUpdateData] = useState<any[]>([]);
  const [updateFilteredData, setUpdateFilteredData] = useState<any[]>([]);
  const [searchField, setSearchField] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedRowForUpdate, setSelectedRowForUpdate] = useState<any>(null);
  const [updateFormData, setUpdateFormData] = useState<Record<string, any>>({});
  const [updateLoading, setUpdateLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Estados de paginación y búsqueda de la tabla de Estado
  const [statusCurrentPage, setStatusCurrentPage] = useState(1);
  const [statusTotalPages, setStatusTotalPages] = useState(1);
  const [statusSearchTerm, setStatusSearchTerm] = useState<string>('');
  const [statusFilteredData, setStatusFilteredData] = useState<any[]>([]);
  const [statusLoading, setStatusLoading] = useState(false);
  
  // Estados para la funcionalidad de copiar
  const [copyData, setCopyData] = useState<any[]>([]);
  const [selectedRowsForCopy, setSelectedRowsForCopy] = useState<any[]>([]);

  // Sincronizar estado local con props
  useEffect(() => {
    if (propSelectedTable !== undefined && propSelectedTable !== selectedTable) {
      console.log('🔄 useSystemParametersState: Syncing with propSelectedTable:', { 
        propSelectedTable, 
        currentSelectedTable: selectedTable 
      });
      setSelectedTable(propSelectedTable);
    }
  }, [propSelectedTable, selectedTable]);

  useEffect(() => {
    if (propActiveSubTab !== undefined && propActiveSubTab !== activeSubTab) {
      setActiveSubTab(propActiveSubTab);
    }
  }, [propActiveSubTab, activeSubTab]);

  // Funciones de reset
  const resetFormData = useCallback(() => {
    setUpdateFormData({});
    setSelectedRowForUpdate(null);
    setUpdateLoading(false);
  }, []);

  const resetUpdateForm = useCallback(() => {
    setUpdateFormData({});
    setSelectedRowForUpdate(null);
    setUpdateLoading(false);
    setHasSearched(false);
  }, []);

  const resetSearch = useCallback(() => {
    setSearchField('');
    setSearchTerm('');
    setHasSearched(false);
  }, []);

  const resetStatusSearch = useCallback(() => {
    setStatusSearchTerm('');
    setStatusCurrentPage(1);
  }, []);

  return {
    // Estado
    selectedTable,
    activeSubTab,
    updateData,
    updateFilteredData,
    searchField,
    searchTerm,
    selectedRowForUpdate,
    updateFormData,
    updateLoading,
    hasSearched,
    statusCurrentPage,
    statusTotalPages,
    statusSearchTerm,
    statusFilteredData,
    statusLoading,
    copyData,
    selectedRowsForCopy,
    
    // Acciones
    setSelectedTable,
    setActiveSubTab,
    setUpdateData,
    setUpdateFilteredData,
    setSearchField,
    setSearchTerm,
    setSelectedRowForUpdate,
    setUpdateFormData,
    setUpdateLoading,
    setHasSearched,
    setStatusCurrentPage,
    setStatusTotalPages,
    setStatusSearchTerm,
    setStatusFilteredData,
    setStatusLoading,
    setCopyData,
    setSelectedRowsForCopy,
    resetFormData,
    resetUpdateForm,
    resetSearch,
    resetStatusSearch
  };
};
