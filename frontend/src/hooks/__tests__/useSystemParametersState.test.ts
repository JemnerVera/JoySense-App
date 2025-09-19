import { renderHook, act } from '@testing-library/react';
import { useSystemParametersState } from '../useSystemParametersState';

describe('useSystemParametersState', () => {
  it('debe inicializar con valores por defecto', () => {
    const { result } = renderHook(() => useSystemParametersState());

    expect(result.current.selectedTable).toBe('');
    expect(result.current.activeSubTab).toBe('status');
    expect(result.current.updateData).toEqual([]);
    expect(result.current.updateFilteredData).toEqual([]);
    expect(result.current.searchField).toBe('');
    expect(result.current.searchTerm).toBe('');
    expect(result.current.selectedRowForUpdate).toBeNull();
    expect(result.current.updateFormData).toEqual({});
    expect(result.current.updateLoading).toBe(false);
    expect(result.current.hasSearched).toBe(false);
    expect(result.current.statusCurrentPage).toBe(1);
    expect(result.current.statusTotalPages).toBe(1);
    expect(result.current.statusSearchTerm).toBe('');
    expect(result.current.statusFilteredData).toEqual([]);
    expect(result.current.statusLoading).toBe(false);
    expect(result.current.copyData).toEqual([]);
    expect(result.current.selectedRowsForCopy).toEqual([]);
  });

  it('debe inicializar con props proporcionadas', () => {
    const { result } = renderHook(() => 
      useSystemParametersState('pais', 'insert')
    );

    expect(result.current.selectedTable).toBe('pais');
    expect(result.current.activeSubTab).toBe('insert');
  });

  it('debe sincronizar con props cuando cambien', () => {
    const { result, rerender } = renderHook(
      ({ selectedTable, activeSubTab }) => 
        useSystemParametersState(selectedTable, activeSubTab),
      { initialProps: { selectedTable: 'pais', activeSubTab: 'status' as const } }
    );

    expect(result.current.selectedTable).toBe('pais');
    expect(result.current.activeSubTab).toBe('status');

    rerender({ selectedTable: 'empresa', activeSubTab: 'update' as const });

    expect(result.current.selectedTable).toBe('empresa');
    expect(result.current.activeSubTab).toBe('update');
  });

  it('debe actualizar selectedTable', () => {
    const { result } = renderHook(() => useSystemParametersState());

    act(() => {
      result.current.setSelectedTable('fundo');
    });

    expect(result.current.selectedTable).toBe('fundo');
  });

  it('debe actualizar activeSubTab', () => {
    const { result } = renderHook(() => useSystemParametersState());

    act(() => {
      result.current.setActiveSubTab('update');
    });

    expect(result.current.activeSubTab).toBe('update');
  });

  it('debe actualizar updateData', () => {
    const { result } = renderHook(() => useSystemParametersState());
    const testData = [{ id: 1, name: 'Test' }];

    act(() => {
      result.current.setUpdateData(testData);
    });

    expect(result.current.updateData).toEqual(testData);
  });

  it('debe actualizar updateFormData', () => {
    const { result } = renderHook(() => useSystemParametersState());
    const testFormData = { pais: 'Test País', paisabrev: 'TP' };

    act(() => {
      result.current.setUpdateFormData(testFormData);
    });

    expect(result.current.updateFormData).toEqual(testFormData);
  });

  it('debe resetear form data', () => {
    const { result } = renderHook(() => useSystemParametersState());

    // Establecer algunos datos
    act(() => {
      result.current.setUpdateFormData({ pais: 'Test' });
      result.current.setSelectedRowForUpdate({ id: 1 });
      result.current.setUpdateLoading(true);
    });

    // Resetear
    act(() => {
      result.current.resetFormData();
    });

    expect(result.current.updateFormData).toEqual({});
    expect(result.current.selectedRowForUpdate).toBeNull();
    expect(result.current.updateLoading).toBe(false);
  });

  it('debe resetear update form', () => {
    const { result } = renderHook(() => useSystemParametersState());

    // Establecer algunos datos
    act(() => {
      result.current.setUpdateFormData({ pais: 'Test' });
      result.current.setSelectedRowForUpdate({ id: 1 });
      result.current.setUpdateLoading(true);
      result.current.setHasSearched(true);
    });

    // Resetear
    act(() => {
      result.current.resetUpdateForm();
    });

    expect(result.current.updateFormData).toEqual({});
    expect(result.current.selectedRowForUpdate).toBeNull();
    expect(result.current.updateLoading).toBe(false);
    expect(result.current.hasSearched).toBe(false);
  });

  it('debe resetear search', () => {
    const { result } = renderHook(() => useSystemParametersState());

    // Establecer algunos datos de búsqueda
    act(() => {
      result.current.setSearchField('pais');
      result.current.setSearchTerm('test');
      result.current.setHasSearched(true);
    });

    // Resetear
    act(() => {
      result.current.resetSearch();
    });

    expect(result.current.searchField).toBe('');
    expect(result.current.searchTerm).toBe('');
    expect(result.current.hasSearched).toBe(false);
  });

  it('debe resetear status search', () => {
    const { result } = renderHook(() => useSystemParametersState());

    // Establecer algunos datos de búsqueda de estado
    act(() => {
      result.current.setStatusSearchTerm('test');
      result.current.setStatusCurrentPage(3);
    });

    // Resetear
    act(() => {
      result.current.resetStatusSearch();
    });

    expect(result.current.statusSearchTerm).toBe('');
    expect(result.current.statusCurrentPage).toBe(1);
  });
});
