import { renderHook, act } from '@testing-library/react';
import { useTableData } from '../useTableData';
import { JoySenseService } from '../../services/backend-api';

// Mock de JoySenseService
jest.mock('../../services/backend-api');
const mockJoySenseService = JoySenseService as jest.Mocked<typeof JoySenseService>;

// Mock de useGlobalFilterEffect
jest.mock('../useGlobalFilterEffect', () => ({
  useGlobalFilterEffect: jest.fn(() => [])
}));

describe('useTableData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe inicializar con estado por defecto', () => {
    const { result } = renderHook(() => useTableData('pais'));

    expect(result.current.data).toEqual([]);
    expect(result.current.filteredData).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.lastFetchTime).toBeNull();
  });

  it('debe cargar datos de País correctamente', async () => {
    const mockData = [
      { paisid: 1, pais: 'Perú', paisabrev: 'PE', statusid: 1 },
      { paisid: 2, pais: 'Chile', paisabrev: 'CL', statusid: 1 }
    ];

    mockJoySenseService.getPaises.mockResolvedValue(mockData);

    const { result } = renderHook(() => useTableData('pais'));

    await act(async () => {
      await result.current.fetchData();
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.lastFetchTime).not.toBeNull();
  });

  it('debe cargar datos de Empresa correctamente', async () => {
    const mockData = [
      { empresaid: 1, empresa: 'Empresa Test', empresabrev: 'ET', paisid: 1, statusid: 1 }
    ];

    mockJoySenseService.getEmpresas.mockResolvedValue(mockData);

    const { result } = renderHook(() => useTableData('empresa'));

    await act(async () => {
      await result.current.fetchData();
    });

    expect(result.current.data).toEqual(mockData);
    expect(mockJoySenseService.getEmpresas).toHaveBeenCalledTimes(1);
  });

  it('debe manejar errores de carga', async () => {
    const errorMessage = 'Error de conexión';
    mockJoySenseService.getPaises.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useTableData('pais'));

    await act(async () => {
      await result.current.fetchData();
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(errorMessage);
  });

  it('debe usar getTableData para tablas no específicas', async () => {
    const mockData = [{ id: 1, name: 'Test' }];
    mockJoySenseService.getTableData.mockResolvedValue(mockData);

    const { result } = renderHook(() => useTableData('tabla_inexistente'));

    await act(async () => {
      await result.current.fetchData();
    });

    expect(result.current.data).toEqual(mockData);
    expect(mockJoySenseService.getTableData).toHaveBeenCalledWith('tabla_inexistente');
  });

  it('debe refrescar datos correctamente', async () => {
    const initialData = [{ paisid: 1, pais: 'Perú', paisabrev: 'PE' }];
    const refreshedData = [{ paisid: 1, pais: 'Perú', paisabrev: 'PE' }, { paisid: 2, pais: 'Chile', paisabrev: 'CL' }];

    mockJoySenseService.getPaises
      .mockResolvedValueOnce(initialData)
      .mockResolvedValueOnce(refreshedData);

    const { result } = renderHook(() => useTableData('pais'));

    // Carga inicial
    await act(async () => {
      await result.current.fetchData();
    });

    expect(result.current.data).toEqual(initialData);

    // Refrescar
    await act(async () => {
      await result.current.refreshData();
    });

    expect(result.current.data).toEqual(refreshedData);
    expect(mockJoySenseService.getPaises).toHaveBeenCalledTimes(2);
  });

  it('debe establecer datos manualmente', () => {
    const { result } = renderHook(() => useTableData('pais'));
    const testData = [{ paisid: 1, pais: 'Test' }];

    act(() => {
      result.current.setData(testData);
    });

    expect(result.current.data).toEqual(testData);
    expect(result.current.lastFetchTime).not.toBeNull();
  });

  it('debe establecer datos filtrados manualmente', () => {
    const { result } = renderHook(() => useTableData('pais'));
    const testData = [{ paisid: 1, pais: 'Test' }];

    act(() => {
      result.current.setFilteredData(testData);
    });

    expect(result.current.filteredData).toEqual(testData);
  });

  it('debe manejar estado de carga', () => {
    const { result } = renderHook(() => useTableData('pais'));

    act(() => {
      result.current.setLoading(true);
    });

    expect(result.current.loading).toBe(true);

    act(() => {
      result.current.setLoading(false);
    });

    expect(result.current.loading).toBe(false);
  });

  it('debe manejar errores', () => {
    const { result } = renderHook(() => useTableData('pais'));

    act(() => {
      result.current.setError('Error de prueba');
    });

    expect(result.current.error).toBe('Error de prueba');

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('no debe cargar datos cuando está deshabilitado', async () => {
    const { result } = renderHook(() => useTableData('pais', false));

    // No debería llamar al servicio
    expect(mockJoySenseService.getPaises).not.toHaveBeenCalled();
    expect(result.current.data).toEqual([]);
  });

  it('debe cargar datos automáticamente cuando se habilita', async () => {
    const mockData = [{ paisid: 1, pais: 'Test' }];
    mockJoySenseService.getPaises.mockResolvedValue(mockData);

    const { result, rerender } = renderHook(
      ({ enabled }) => useTableData('pais', enabled),
      { initialProps: { enabled: false } }
    );

    // No debería cargar inicialmente
    expect(mockJoySenseService.getPaises).not.toHaveBeenCalled();

    // Habilitar
    rerender({ enabled: true });

    await act(async () => {
      // Esperar a que se complete la carga automática
    });

    expect(mockJoySenseService.getPaises).toHaveBeenCalled();
    expect(result.current.data).toEqual(mockData);
  });
});
