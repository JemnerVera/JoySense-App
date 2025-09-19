import { renderHook, act } from '@testing-library/react';
import { useSystemParametersCRUD } from '../useSystemParametersCRUD';
import { useAuth } from '../../contexts/AuthContext';
import { JoySenseService } from '../../services/backend-api';

// Mock de useAuth
jest.mock('../../contexts/AuthContext');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock de JoySenseService
jest.mock('../../services/backend-api');
const mockJoySenseService = JoySenseService as jest.Mocked<typeof JoySenseService>;

// Mock de hooks
jest.mock('../useInsertOperations');
jest.mock('../useUpdateOperations');
jest.mock('../useFormValidation');

describe('useSystemParametersCRUD', () => {
  const mockUser = { id: 1, name: 'Test User' };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: mockUser } as any);
  });

  it('debe inicializar con estado por defecto', () => {
    const { result } = renderHook(() => useSystemParametersCRUD());

    expect(result.current.isProcessing).toBe(false);
    expect(result.current.lastOperation).toBeNull();
    expect(result.current.operationSuccess).toBe(false);
    expect(result.current.operationError).toBeNull();
  });

  it('debe manejar inserción correctamente', async () => {
    const { result } = renderHook(() => useSystemParametersCRUD());

    const formData = { pais: 'Perú', paisabrev: 'PE' };
    const existingData = [];

    await act(async () => {
      const response = await result.current.handleInsert('pais', formData, existingData);
      expect(response.success).toBe(true);
      expect(response.message).toContain('creado exitosamente');
    });
  });

  it('debe manejar actualización correctamente', async () => {
    const { result } = renderHook(() => useSystemParametersCRUD());

    const formData = { pais: 'Perú Actualizado', paisabrev: 'PE' };
    const originalData = { paisid: 1, pais: 'Perú', paisabrev: 'PE' };
    const existingData = [];

    await act(async () => {
      const response = await result.current.handleUpdate('pais', formData, originalData, existingData);
      expect(response.success).toBe(true);
      expect(response.message).toContain('actualizado exitosamente');
    });
  });

  it('debe manejar eliminación correctamente', async () => {
    mockJoySenseService.deleteRecord.mockResolvedValue(undefined);

    const { result } = renderHook(() => useSystemParametersCRUD());

    await act(async () => {
      const response = await result.current.handleDelete('pais', 1);
      expect(response.success).toBe(true);
      expect(response.message).toContain('eliminado exitosamente');
    });

    expect(mockJoySenseService.deleteRecord).toHaveBeenCalledWith('pais', 1);
  });

  it('debe manejar errores de inserción', async () => {
    const { result } = renderHook(() => useSystemParametersCRUD());

    const formData = { pais: '', paisabrev: '' }; // Datos inválidos
    const existingData = [];

    await act(async () => {
      const response = await result.current.handleInsert('pais', formData, existingData);
      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });
  });

  it('debe manejar errores de actualización', async () => {
    const { result } = renderHook(() => useSystemParametersCRUD());

    const formData = { pais: '', paisabrev: '' }; // Datos inválidos
    const originalData = { paisid: 1, pais: 'Perú', paisabrev: 'PE' };
    const existingData = [];

    await act(async () => {
      const response = await result.current.handleUpdate('pais', formData, originalData, existingData);
      expect(response.success).toBe(false);
      expect(response.error).toBeDefined();
    });
  });

  it('debe manejar errores de eliminación', async () => {
    mockJoySenseService.deleteRecord.mockRejectedValue(new Error('Error de eliminación'));

    const { result } = renderHook(() => useSystemParametersCRUD());

    await act(async () => {
      const response = await result.current.handleDelete('pais', 1);
      expect(response.success).toBe(false);
      expect(response.error).toContain('Error de eliminación');
    });
  });

  it('debe validar parámetros requeridos', async () => {
    const { result } = renderHook(() => useSystemParametersCRUD());

    await act(async () => {
      const response = await result.current.handleInsert('', {}, []);
      expect(response.success).toBe(false);
      expect(response.error).toContain('Tabla no seleccionada');
    });
  });

  it('debe limpiar estado de operaciones', () => {
    const { result } = renderHook(() => useSystemParametersCRUD());

    act(() => {
      result.current.clearOperationState();
    });

    // No debería lanzar errores
    expect(result.current.isProcessing).toBe(false);
  });
});
