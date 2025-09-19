import { renderHook, act } from '@testing-library/react';
import { useTableRendering } from '../useTableRendering';

// Mock de hooks
jest.mock('../useSearchOperations');
jest.mock('../usePagination');

describe('useTableRendering', () => {
  const mockData = [
    { paisid: 1, pais: 'Perú', paisabrev: 'PE', statusid: 1 },
    { paisid: 2, pais: 'Chile', paisabrev: 'CL', statusid: 1 },
    { paisid: 3, pais: 'Argentina', paisabrev: 'AR', statusid: 0 }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe inicializar con estado por defecto', () => {
    const { result } = renderHook(() => useTableRendering(mockData));

    expect(result.current.filteredData).toEqual(mockData);
    expect(result.current.paginatedData).toEqual(mockData);
    expect(result.current.currentPage).toBe(1);
    expect(result.current.totalPages).toBe(1);
    expect(result.current.hasNextPage).toBe(false);
    expect(result.current.hasPrevPage).toBe(false);
    expect(result.current.searchTerm).toBe('');
    expect(result.current.searchField).toBe('');
    expect(result.current.isSearching).toBe(false);
  });

  it('debe obtener valor de visualización correctamente', () => {
    const { result } = renderHook(() => useTableRendering(mockData));

    const row = mockData[0];
    const displayValue = result.current.getDisplayValue(row, 'pais');

    expect(displayValue).toBe('Perú');
  });

  it('debe manejar valores nulos en getDisplayValue', () => {
    const { result } = renderHook(() => useTableRendering(mockData));

    const row = { paisid: 1, pais: null, paisabrev: 'PE' };
    const displayValue = result.current.getDisplayValue(row, 'pais');

    expect(displayValue).toBe('');
  });

  it('debe formatear valores de celda correctamente', () => {
    const { result } = renderHook(() => useTableRendering(mockData));

    const formattedStatus = result.current.formatCellValue(1, 'statusid');
    const formattedBoolean = result.current.formatCellValue(true, 'active');
    const formattedNumber = result.current.formatCellValue(1234, 'count');

    expect(formattedStatus).toBe('Activo');
    expect(formattedBoolean).toBe('Sí');
    expect(formattedNumber).toBe('1,234');
  });

  it('debe manejar búsqueda', () => {
    const { result } = renderHook(() => useTableRendering(mockData));

    act(() => {
      result.current.setSearchTerm('Perú');
    });

    expect(result.current.searchTerm).toBe('Perú');
  });

  it('debe manejar cambio de campo de búsqueda', () => {
    const { result } = renderHook(() => useTableRendering(mockData));

    act(() => {
      result.current.setSearchField('pais');
    });

    expect(result.current.searchField).toBe('pais');
  });

  it('debe limpiar búsqueda', () => {
    const { result } = renderHook(() => useTableRendering(mockData));

    act(() => {
      result.current.setSearchTerm('Perú');
      result.current.clearSearch();
    });

    expect(result.current.searchTerm).toBe('');
  });

  it('debe manejar paginación', () => {
    const { result } = renderHook(() => useTableRendering(mockData, 2));

    act(() => {
      result.current.goToPage(2);
    });

    expect(result.current.currentPage).toBe(2);
  });

  it('debe navegar entre páginas', () => {
    const { result } = renderHook(() => useTableRendering(mockData, 2));

    act(() => {
      result.current.nextPage();
    });

    expect(result.current.currentPage).toBe(2);

    act(() => {
      result.current.prevPage();
    });

    expect(result.current.currentPage).toBe(1);
  });

  it('debe ir a primera y última página', () => {
    const { result } = renderHook(() => useTableRendering(mockData, 2));

    act(() => {
      result.current.lastPage();
    });

    expect(result.current.currentPage).toBe(2);

    act(() => {
      result.current.firstPage();
    });

    expect(result.current.currentPage).toBe(1);
  });

  it('debe manejar datos vacíos', () => {
    const { result } = renderHook(() => useTableRendering([]));

    expect(result.current.filteredData).toEqual([]);
    expect(result.current.paginatedData).toEqual([]);
    expect(result.current.totalPages).toBe(1);
  });

  it('debe manejar diferentes tamaños de página', () => {
    const { result: result1 } = renderHook(() => useTableRendering(mockData, 1));
    const { result: result2 } = renderHook(() => useTableRendering(mockData, 10));

    expect(result1.current.totalPages).toBe(3);
    expect(result2.current.totalPages).toBe(1);
  });
});
