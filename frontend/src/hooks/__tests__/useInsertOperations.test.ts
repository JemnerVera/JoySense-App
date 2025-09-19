import { renderHook, act } from '@testing-library/react';
import { useInsertOperations } from '../useInsertOperations';
import { JoySenseService } from '../../services/backend-api';
import { backendAPI } from '../../services/backend-api';
import { useAuth } from '../../contexts/AuthContext';

// Mock de JoySenseService
jest.mock('../../services/backend-api');
const mockJoySenseService = JoySenseService as jest.Mocked<typeof JoySenseService>;
const mockBackendAPI = backendAPI as jest.Mocked<typeof backendAPI>;

// Mock de useAuth
jest.mock('../../contexts/AuthContext');
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;

// Mock de validateTableData
jest.mock('../../utils/formValidation', () => ({
  validateTableData: jest.fn()
}));

// Mock de errorHandler
jest.mock('../../utils/errorHandler', () => ({
  handleInsertError: jest.fn((error) => `Error: ${error.message}`),
  handleMultipleInsertError: jest.fn((error, tableName, index) => 
    `Error en ${tableName} registro ${index}: ${error.message}`
  )
}));

describe('useInsertOperations', () => {
  const mockUser = { id: 1, name: 'Test User' };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: mockUser } as any);
  });

  it('debe inicializar con estado por defecto', () => {
    const { result } = renderHook(() => useInsertOperations());

    expect(result.current.isInserting).toBe(false);
    expect(result.current.insertError).toBeNull();
    expect(result.current.insertSuccess).toBe(false);
    expect(result.current.lastInsertedId).toBeNull();
  });

  it('debe insertar un registro correctamente', async () => {
    const mockResponse = { id: 1, pais: 'Perú', paisabrev: 'PE' };
    mockBackendAPI.post.mockResolvedValue(mockResponse);

    const { validateTableData } = require('../../utils/formValidation');
    validateTableData.mockResolvedValue({
      isValid: true,
      errors: [],
      userFriendlyMessage: 'Datos válidos'
    });

    const { result } = renderHook(() => useInsertOperations());

    const formData = { pais: 'Perú', paisabrev: 'PE' };

    await act(async () => {
      const response = await result.current.insertSingle('pais', formData);
      expect(response.success).toBe(true);
      expect(response.id).toBe(1);
    });

    expect(result.current.insertSuccess).toBe(true);
    expect(result.current.lastInsertedId).toBe(1);
    expect(result.current.insertError).toBeNull();
  });

  it('debe manejar errores de validación', async () => {
    const { validateTableData } = require('../../utils/formValidation');
    validateTableData.mockResolvedValue({
      isValid: false,
      errors: ['Campo obligatorio'],
      userFriendlyMessage: 'El país es obligatorio'
    });

    const { result } = renderHook(() => useInsertOperations());

    const formData = { pais: '', paisabrev: 'PE' };

    await act(async () => {
      const response = await result.current.insertSingle('pais', formData);
      expect(response.success).toBe(false);
      expect(response.error).toBe('El país es obligatorio');
    });

    expect(result.current.insertSuccess).toBe(false);
    expect(result.current.insertError).toBe('El país es obligatorio');
  });

  it('debe manejar errores de inserción', async () => {
    const { validateTableData } = require('../../utils/formValidation');
    validateTableData.mockResolvedValue({
      isValid: true,
      errors: [],
      userFriendlyMessage: 'Datos válidos'
    });

    mockBackendAPI.post.mockRejectedValue(new Error('Error de conexión'));

    const { result } = renderHook(() => useInsertOperations());

    const formData = { pais: 'Perú', paisabrev: 'PE' };

    await act(async () => {
      const response = await result.current.insertSingle('pais', formData);
      expect(response.success).toBe(false);
      expect(response.error).toContain('Error de conexión');
    });

    expect(result.current.insertSuccess).toBe(false);
    expect(result.current.insertError).toContain('Error de conexión');
  });

  it('debe insertar múltiples registros correctamente', async () => {
    const mockResponse = { id: 1, pais: 'Perú', paisabrev: 'PE' };
    mockBackendAPI.post.mockResolvedValue(mockResponse);

    const { validateTableData } = require('../../utils/formValidation');
    validateTableData.mockResolvedValue({
      isValid: true,
      errors: [],
      userFriendlyMessage: 'Datos válidos'
    });

    const { result } = renderHook(() => useInsertOperations());

    const multipleData = [
      { pais: 'Perú', paisabrev: 'PE' },
      { pais: 'Chile', paisabrev: 'CL' }
    ];

    await act(async () => {
      const response = await result.current.insertMultiple('pais', multipleData);
      expect(response.success).toBe(true);
      expect(response.insertedCount).toBe(2);
    });

    expect(result.current.insertSuccess).toBe(true);
    expect(result.current.lastInsertedId).toBe(1);
  });

  it('debe manejar errores en inserción múltiple', async () => {
    const { validateTableData } = require('../../utils/formValidation');
    validateTableData
      .mockResolvedValueOnce({
        isValid: true,
        errors: [],
        userFriendlyMessage: 'Datos válidos'
      })
      .mockResolvedValueOnce({
        isValid: false,
        errors: ['Campo obligatorio'],
        userFriendlyMessage: 'El país es obligatorio'
      });

    mockBackendAPI.post
      .mockResolvedValueOnce({ id: 1, pais: 'Perú', paisabrev: 'PE' })
      .mockRejectedValueOnce(new Error('Error de validación'));

    const { result } = renderHook(() => useInsertOperations());

    const multipleData = [
      { pais: 'Perú', paisabrev: 'PE' },
      { pais: '', paisabrev: 'CL' }
    ];

    await act(async () => {
      const response = await result.current.insertMultiple('pais', multipleData);
      expect(response.success).toBe(true);
      expect(response.insertedCount).toBe(1);
      expect(response.errors).toHaveLength(1);
    });

    expect(result.current.insertSuccess).toBe(true);
    expect(result.current.insertError).toContain('Se insertaron 1 de 2 registros');
  });

  it('debe insertar datos masivos correctamente', async () => {
    const mockResponse = { insertedCount: 100, lastInsertedId: 100 };
    mockBackendAPI.post.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useInsertOperations());

    const massiveData = Array.from({ length: 100 }, (_, i) => ({
      pais: `País ${i}`,
      paisabrev: `P${i}`
    }));

    await act(async () => {
      const response = await result.current.insertMassive('pais', massiveData);
      expect(response.success).toBe(true);
      expect(response.insertedCount).toBe(100);
    });

    expect(result.current.insertSuccess).toBe(true);
    expect(result.current.lastInsertedId).toBe(100);
  });

  it('debe limpiar estado de inserción', () => {
    const { result } = renderHook(() => useInsertOperations());

    // Establecer algunos estados
    act(() => {
      result.current.setInsertSuccess(true);
      result.current.setInsertError('Error de prueba');
    });

    // Limpiar estado
    act(() => {
      result.current.clearInsertState();
    });

    expect(result.current.insertSuccess).toBe(false);
    expect(result.current.insertError).toBeNull();
    expect(result.current.lastInsertedId).toBeNull();
  });

  it('debe establecer estados manualmente', () => {
    const { result } = renderHook(() => useInsertOperations());

    act(() => {
      result.current.setInserting(true);
    });
    expect(result.current.isInserting).toBe(true);

    act(() => {
      result.current.setInsertError('Error manual');
    });
    expect(result.current.insertError).toBe('Error manual');

    act(() => {
      result.current.setInsertSuccess(true);
    });
    expect(result.current.insertSuccess).toBe(true);
  });
});
