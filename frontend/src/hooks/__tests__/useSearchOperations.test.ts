import { renderHook, act } from '@testing-library/react';
import { useSearchOperations } from '../useSearchOperations';

describe('useSearchOperations', () => {
  it('debe inicializar con valores por defecto', () => {
    const { result } = renderHook(() => useSearchOperations());

    expect(result.current.searchTerm).toBe('');
    expect(result.current.searchField).toBe('');
    expect(result.current.filteredData).toEqual([]);
    expect(result.current.hasSearched).toBe(false);
    expect(result.current.isSearching).toBe(false);
  });

  it('debe inicializar con valores personalizados', () => {
    const { result } = renderHook(() => 
      useSearchOperations('test', 'pais')
    );

    expect(result.current.searchTerm).toBe('test');
    expect(result.current.searchField).toBe('pais');
  });

  it('debe establecer término de búsqueda', () => {
    const { result } = renderHook(() => useSearchOperations());

    act(() => {
      result.current.setSearchTerm('Perú');
    });

    expect(result.current.searchTerm).toBe('Perú');
  });

  it('debe establecer campo de búsqueda', () => {
    const { result } = renderHook(() => useSearchOperations());

    act(() => {
      result.current.setSearchField('pais');
    });

    expect(result.current.searchField).toBe('pais');
  });

  it('debe realizar búsqueda por campo específico', () => {
    const { result } = renderHook(() => useSearchOperations());

    const data = [
      { paisid: 1, pais: 'Perú', paisabrev: 'PE' },
      { paisid: 2, pais: 'Chile', paisabrev: 'CL' },
      { paisid: 3, pais: 'Argentina', paisabrev: 'AR' }
    ];

    const filtered = result.current.performSearch(data, 'Perú', 'pais');

    expect(filtered).toHaveLength(1);
    expect(filtered[0].pais).toBe('Perú');
  });

  it('debe realizar búsqueda general', () => {
    const { result } = renderHook(() => useSearchOperations());

    const data = [
      { paisid: 1, pais: 'Perú', paisabrev: 'PE' },
      { paisid: 2, pais: 'Chile', paisabrev: 'CL' },
      { paisid: 3, pais: 'Argentina', paisabrev: 'AR' }
    ];

    const filtered = result.current.performSearch(data, 'PE', '');

    expect(filtered).toHaveLength(1);
    expect(filtered[0].paisabrev).toBe('PE');
  });

  it('debe realizar búsqueda case-insensitive', () => {
    const { result } = renderHook(() => useSearchOperations());

    const data = [
      { paisid: 1, pais: 'Perú', paisabrev: 'PE' },
      { paisid: 2, pais: 'Chile', paisabrev: 'CL' }
    ];

    const filtered = result.current.performSearch(data, 'perú', 'pais');

    expect(filtered).toHaveLength(1);
    expect(filtered[0].pais).toBe('Perú');
  });

  it('debe manejar búsqueda con espacios', () => {
    const { result } = renderHook(() => useSearchOperations());

    const data = [
      { paisid: 1, pais: 'Perú', paisabrev: 'PE' },
      { paisid: 2, pais: 'Chile', paisabrev: 'CL' }
    ];

    const filtered = result.current.performSearch(data, '  Perú  ', 'pais');

    expect(filtered).toHaveLength(1);
    expect(filtered[0].pais).toBe('Perú');
  });

  it('debe retornar todos los datos cuando no hay término de búsqueda', () => {
    const { result } = renderHook(() => useSearchOperations());

    const data = [
      { paisid: 1, pais: 'Perú', paisabrev: 'PE' },
      { paisid: 2, pais: 'Chile', paisabrev: 'CL' }
    ];

    const filtered = result.current.performSearch(data, '', 'pais');

    expect(filtered).toEqual(data);
  });

  it('debe manejar valores null y undefined', () => {
    const { result } = renderHook(() => useSearchOperations());

    const data = [
      { paisid: 1, pais: 'Perú', paisabrev: 'PE' },
      { paisid: 2, pais: null, paisabrev: 'CL' },
      { paisid: 3, pais: undefined, paisabrev: 'AR' }
    ];

    const filtered = result.current.performSearch(data, 'Perú', 'pais');

    expect(filtered).toHaveLength(1);
    expect(filtered[0].pais).toBe('Perú');
  });

  it('debe limpiar búsqueda', () => {
    const { result } = renderHook(() => useSearchOperations());

    // Establecer algunos valores
    act(() => {
      result.current.setSearchTerm('Perú');
      result.current.setSearchField('pais');
      result.current.setFilteredData([{ paisid: 1, pais: 'Perú' }]);
      result.current.setHasSearched(true);
    });

    // Limpiar
    act(() => {
      result.current.clearSearch();
    });

    expect(result.current.searchTerm).toBe('');
    expect(result.current.searchField).toBe('');
    expect(result.current.filteredData).toEqual([]);
    expect(result.current.hasSearched).toBe(false);
  });

  it('debe establecer datos filtrados', () => {
    const { result } = renderHook(() => useSearchOperations());

    const testData = [{ paisid: 1, pais: 'Perú' }];

    act(() => {
      result.current.setFilteredData(testData);
    });

    expect(result.current.filteredData).toEqual(testData);
  });

  it('debe establecer si se ha buscado', () => {
    const { result } = renderHook(() => useSearchOperations());

    act(() => {
      result.current.setHasSearched(true);
    });

    expect(result.current.hasSearched).toBe(true);
  });

  it('debe establecer estado de búsqueda', () => {
    const { result } = renderHook(() => useSearchOperations());

    act(() => {
      result.current.setIsSearching(true);
    });

    expect(result.current.isSearching).toBe(true);
  });

  it('debe filtrar datos automáticamente cuando se establecen datos filtrados', () => {
    const { result } = renderHook(() => useSearchOperations());

    const data = [
      { paisid: 1, pais: 'Perú', paisabrev: 'PE' },
      { paisid: 2, pais: 'Chile', paisabrev: 'CL' }
    ];

    // Establecer término de búsqueda y datos
    act(() => {
      result.current.setSearchTerm('Perú');
      result.current.setSearchField('pais');
      result.current.setHasSearched(true);
      result.current.setFilteredData(data);
    });

    // Los datos filtrados deben estar automáticamente filtrados
    expect(result.current.filteredData).toHaveLength(1);
    expect(result.current.filteredData[0].pais).toBe('Perú');
  });

  it('debe retornar datos sin filtrar cuando no se ha buscado', () => {
    const { result } = renderHook(() => useSearchOperations());

    const data = [
      { paisid: 1, pais: 'Perú', paisabrev: 'PE' },
      { paisid: 2, pais: 'Chile', paisabrev: 'CL' }
    ];

    // Establecer término de búsqueda pero no marcar como buscado
    act(() => {
      result.current.setSearchTerm('Perú');
      result.current.setSearchField('pais');
      result.current.setHasSearched(false);
      result.current.setFilteredData(data);
    });

    // Los datos filtrados deben ser los originales
    expect(result.current.filteredData).toEqual(data);
  });
});
