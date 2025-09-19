import { renderHook, act } from '@testing-library/react';
import { usePagination } from '../usePagination';

describe('usePagination', () => {
  const mockData = Array.from({ length: 25 }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`
  }));

  it('debe inicializar con estado por defecto', () => {
    const { result } = renderHook(() => usePagination(mockData, 10));

    expect(result.current.currentPage).toBe(1);
    expect(result.current.totalPages).toBe(3);
    expect(result.current.hasNextPage).toBe(true);
    expect(result.current.hasPrevPage).toBe(false);
    expect(result.current.itemsPerPage).toBe(10);
    expect(result.current.totalItems).toBe(25);
  });

  it('debe calcular total de páginas correctamente', () => {
    const { result: result1 } = renderHook(() => usePagination(mockData, 10));
    const { result: result2 } = renderHook(() => usePagination(mockData, 5));
    const { result: result3 } = renderHook(() => usePagination([], 10));

    expect(result1.current.totalPages).toBe(3); // 25 items / 10 por página = 3 páginas
    expect(result2.current.totalPages).toBe(5); // 25 items / 5 por página = 5 páginas
    expect(result3.current.totalPages).toBe(1); // Sin datos = 1 página
  });

  it('debe obtener datos paginados correctamente', () => {
    const { result } = renderHook(() => usePagination(mockData, 10));

    const page1Data = result.current.getPaginatedData();
    expect(page1Data).toHaveLength(10);
    expect(page1Data[0].id).toBe(1);
    expect(page1Data[9].id).toBe(10);

    act(() => {
      result.current.goToPage(2);
    });

    const page2Data = result.current.getPaginatedData();
    expect(page2Data).toHaveLength(10);
    expect(page2Data[0].id).toBe(11);
    expect(page2Data[9].id).toBe(20);

    act(() => {
      result.current.goToPage(3);
    });

    const page3Data = result.current.getPaginatedData();
    expect(page3Data).toHaveLength(5); // Última página con 5 elementos
    expect(page3Data[0].id).toBe(21);
    expect(page3Data[4].id).toBe(25);
  });

  it('debe navegar entre páginas correctamente', () => {
    const { result } = renderHook(() => usePagination(mockData, 10));

    // Página inicial
    expect(result.current.currentPage).toBe(1);
    expect(result.current.hasPrevPage).toBe(false);
    expect(result.current.hasNextPage).toBe(true);

    // Ir a página 2
    act(() => {
      result.current.nextPage();
    });

    expect(result.current.currentPage).toBe(2);
    expect(result.current.hasPrevPage).toBe(true);
    expect(result.current.hasNextPage).toBe(true);

    // Ir a página 3
    act(() => {
      result.current.nextPage();
    });

    expect(result.current.currentPage).toBe(3);
    expect(result.current.hasPrevPage).toBe(true);
    expect(result.current.hasNextPage).toBe(false);

    // Volver a página 2
    act(() => {
      result.current.prevPage();
    });

    expect(result.current.currentPage).toBe(2);
    expect(result.current.hasPrevPage).toBe(true);
    expect(result.current.hasNextPage).toBe(true);
  });

  it('debe ir a primera y última página', () => {
    const { result } = renderHook(() => usePagination(mockData, 10));

    // Ir a última página
    act(() => {
      result.current.lastPage();
    });

    expect(result.current.currentPage).toBe(3);
    expect(result.current.hasNextPage).toBe(false);

    // Ir a primera página
    act(() => {
      result.current.firstPage();
    });

    expect(result.current.currentPage).toBe(1);
    expect(result.current.hasPrevPage).toBe(false);
  });

  it('debe ir a una página específica', () => {
    const { result } = renderHook(() => usePagination(mockData, 10));

    act(() => {
      result.current.goToPage(2);
    });

    expect(result.current.currentPage).toBe(2);

    act(() => {
      result.current.goToPage(3);
    });

    expect(result.current.currentPage).toBe(3);
  });

  it('debe manejar páginas inválidas', () => {
    const { result } = renderHook(() => usePagination(mockData, 10));

    // Página menor a 1
    act(() => {
      result.current.goToPage(0);
    });

    expect(result.current.currentPage).toBe(1);

    // Página mayor al total
    act(() => {
      result.current.goToPage(10);
    });

    expect(result.current.currentPage).toBe(3); // Máximo 3 páginas
  });

  it('debe cambiar número de elementos por página', () => {
    const { result } = renderHook(() => usePagination(mockData, 10));

    expect(result.current.totalPages).toBe(3);
    expect(result.current.itemsPerPage).toBe(10);

    act(() => {
      result.current.setItemsPerPage(5);
    });

    expect(result.current.totalPages).toBe(5);
    expect(result.current.itemsPerPage).toBe(5);
    expect(result.current.currentPage).toBe(1); // Debe resetear a página 1
  });

  it('debe obtener información de página correctamente', () => {
    const { result } = renderHook(() => usePagination(mockData, 10));

    // Página 1
    let pageInfo = result.current.getPageInfo();
    expect(pageInfo.start).toBe(1);
    expect(pageInfo.end).toBe(10);
    expect(pageInfo.total).toBe(25);

    // Página 2
    act(() => {
      result.current.goToPage(2);
    });

    pageInfo = result.current.getPageInfo();
    expect(pageInfo.start).toBe(11);
    expect(pageInfo.end).toBe(20);
    expect(pageInfo.total).toBe(25);

    // Página 3 (última)
    act(() => {
      result.current.goToPage(3);
    });

    pageInfo = result.current.getPageInfo();
    expect(pageInfo.start).toBe(21);
    expect(pageInfo.end).toBe(25);
    expect(pageInfo.total).toBe(25);
  });

  it('debe manejar datos vacíos', () => {
    const { result } = renderHook(() => usePagination([], 10));

    expect(result.current.totalPages).toBe(1);
    expect(result.current.totalItems).toBe(0);
    expect(result.current.hasNextPage).toBe(false);
    expect(result.current.hasPrevPage).toBe(false);

    const pageData = result.current.getPaginatedData();
    expect(pageData).toHaveLength(0);

    const pageInfo = result.current.getPageInfo();
    expect(pageInfo.start).toBe(0);
    expect(pageInfo.end).toBe(0);
    expect(pageInfo.total).toBe(0);
  });

  it('debe manejar navegación en datos vacíos', () => {
    const { result } = renderHook(() => usePagination([], 10));

    act(() => {
      result.current.nextPage();
    });

    expect(result.current.currentPage).toBe(1);

    act(() => {
      result.current.prevPage();
    });

    expect(result.current.currentPage).toBe(1);
  });
});
