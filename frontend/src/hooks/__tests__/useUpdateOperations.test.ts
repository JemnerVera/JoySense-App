import { renderHook, act } from '@testing-library/react';
import { useUpdateOperations } from '../useUpdateOperations';
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

// Mock de validateTableUpdate
jest.mock('../../utils/formValidation', () => ({
  validateTableUpdate: jest.fn()
}));

describe('useUpdateOperations', () => {
  const mockUser = { id: 1, name: 'Test User' };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: mockUser } as any);
  });

  it('debe inicializar con estado por defecto', () => {
    const { result } = renderHook(() => useUpdateOperations());

    expect(result.current.isUpdating).toBe(false);
    expect(result.current.updateError).toBeNull();
    expect(result.current.updateSuccess).toBe(false);
    expect(result.current.lastUpdatedId).toBeNull();
  });

  it('debe actualizar un registro correctamente', async () => {
    const mockResponse = { id: 1, pais: 'Perú Actualizado', paisabrev: 'PE' };
    mockBackendAPI.put.mockResolvedValue(mockResponse);
    mockJoySenseService.getTableData.mockResolvedValue([
      { paisid: 1, pais: 'Perú', paisabrev: 'PE', statusid: 1 }
    ]);

    const { validateTableUpdate } = require('../../utils/formValidation');
    validateTableUpdate.mockResolvedValue({
      isValid: true,
      errors: [],
      userFriendlyMessage: 'Datos válidos'
    });

    const { result } = renderHook(() => useUpdateOperations());

    const formData = { pais: 'Perú Actualizado', paisabrev: 'PE' };
    const originalData = { paisid: 1, pais: 'Perú', paisabrev: 'PE', statusid: 1 };

    await act(async () => {
      const response = await result.current.updateSingle('pais', formData, originalData);
      expect(response.success).toBe(true);
      expect(response.id).toBe(1);
    });

    expect(result.current.updateSuccess).toBe(true);
    expect(result.current.lastUpdatedId).toBe(1);
    expect(result.current.updateError).toBeNull();
  });

  it('debe manejar errores de validación', async () => {
    mockJoySenseService.getTableData.mockResolvedValue([
      { paisid: 1, pais: 'Perú', paisabrev: 'PE', statusid: 1 }
    ]);

    const { validateTableUpdate } = require('../../utils/formValidation');
    validateTableUpdate.mockResolvedValue({
      isValid: false,
      errors: ['Campo obligatorio'],
      userFriendlyMessage: 'El país es obligatorio'
    });

    const { result } = renderHook(() => useUpdateOperations());

    const formData = { pais: '', paisabrev: 'PE' };
    const originalData = { paisid: 1, pais: 'Perú', paisabrev: 'PE', statusid: 1 };

    await act(async () => {
      const response = await result.current.updateSingle('pais', formData, originalData);
      expect(response.success).toBe(false);
      expect(response.error).toBe('El país es obligatorio');
    });

    expect(result.current.updateSuccess).toBe(false);
    expect(result.current.updateError).toBe('El país es obligatorio');
  });

  it('debe manejar errores de actualización', async () => {
    mockJoySenseService.getTableData.mockResolvedValue([
      { paisid: 1, pais: 'Perú', paisabrev: 'PE', statusid: 1 }
    ]);

    const { validateTableUpdate } = require('../../utils/formValidation');
    validateTableUpdate.mockResolvedValue({
      isValid: true,
      errors: [],
      userFriendlyMessage: 'Datos válidos'
    });

    mockBackendAPI.put.mockRejectedValue(new Error('Error de conexión'));

    const { result } = renderHook(() => useUpdateOperations());

    const formData = { pais: 'Perú Actualizado', paisabrev: 'PE' };
    const originalData = { paisid: 1, pais: 'Perú', paisabrev: 'PE', statusid: 1 };

    await act(async () => {
      const response = await result.current.updateSingle('pais', formData, originalData);
      expect(response.success).toBe(false);
      expect(response.error).toBe('Error de conexión');
    });

    expect(result.current.updateSuccess).toBe(false);
    expect(result.current.updateError).toBe('Error de conexión');
  });

  it('debe manejar registro no encontrado', async () => {
    const { result } = renderHook(() => useUpdateOperations());

    const formData = { pais: 'Perú Actualizado', paisabrev: 'PE' };
    const originalData = { pais: 'Perú', paisabrev: 'PE' }; // Sin ID

    await act(async () => {
      const response = await result.current.updateSingle('pais', formData, originalData);
      expect(response.success).toBe(false);
      expect(response.error).toBe('ID del registro no encontrado');
    });

    expect(result.current.updateSuccess).toBe(false);
    expect(result.current.updateError).toBe('ID del registro no encontrado');
  });

  it('debe actualizar múltiples registros correctamente', async () => {
    const mockResponse = { id: 1, pais: 'Perú Actualizado', paisabrev: 'PE' };
    mockBackendAPI.put.mockResolvedValue(mockResponse);
    mockJoySenseService.getTableData.mockResolvedValue([
      { paisid: 1, pais: 'Perú', paisabrev: 'PE', statusid: 1 },
      { paisid: 2, pais: 'Chile', paisabrev: 'CL', statusid: 1 }
    ]);

    const { validateTableUpdate } = require('../../utils/formValidation');
    validateTableUpdate.mockResolvedValue({
      isValid: true,
      errors: [],
      userFriendlyMessage: 'Datos válidos'
    });

    const { result } = renderHook(() => useUpdateOperations());

    const updates = [
      { id: 1, data: { pais: 'Perú Actualizado', paisabrev: 'PE' } },
      { id: 2, data: { pais: 'Chile Actualizado', paisabrev: 'CL' } }
    ];

    await act(async () => {
      const response = await result.current.updateMultiple('pais', updates);
      expect(response.success).toBe(true);
      expect(response.updatedCount).toBe(2);
    });

    expect(result.current.updateSuccess).toBe(true);
    expect(result.current.lastUpdatedId).toBe(2);
  });

  it('debe manejar errores en actualización múltiple', async () => {
    mockJoySenseService.getTableData.mockResolvedValue([
      { paisid: 1, pais: 'Perú', paisabrev: 'PE', statusid: 1 },
      { paisid: 2, pais: 'Chile', paisabrev: 'CL', statusid: 1 }
    ]);

    const { validateTableUpdate } = require('../../utils/formValidation');
    validateTableUpdate
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

    mockBackendAPI.put
      .mockResolvedValueOnce({ id: 1, pais: 'Perú Actualizado', paisabrev: 'PE' })
      .mockRejectedValueOnce(new Error('Error de validación'));

    const { result } = renderHook(() => useUpdateOperations());

    const updates = [
      { id: 1, data: { pais: 'Perú Actualizado', paisabrev: 'PE' } },
      { id: 2, data: { pais: '', paisabrev: 'CL' } }
    ];

    await act(async () => {
      const response = await result.current.updateMultiple('pais', updates);
      expect(response.success).toBe(true);
      expect(response.updatedCount).toBe(1);
      expect(response.errors).toHaveLength(1);
    });

    expect(result.current.updateSuccess).toBe(true);
    expect(result.current.updateError).toContain('Se actualizaron 1 de 2 registros');
  });

  it('debe limpiar estado de actualización', () => {
    const { result } = renderHook(() => useUpdateOperations());

    // Establecer algunos estados
    act(() => {
      result.current.setUpdateSuccess(true);
      result.current.setUpdateError('Error de prueba');
    });

    // Limpiar estado
    act(() => {
      result.current.clearUpdateState();
    });

    expect(result.current.updateSuccess).toBe(false);
    expect(result.current.updateError).toBeNull();
    expect(result.current.lastUpdatedId).toBeNull();
  });

  it('debe establecer estados manualmente', () => {
    const { result } = renderHook(() => useUpdateOperations());

    act(() => {
      result.current.setUpdating(true);
    });
    expect(result.current.isUpdating).toBe(true);

    act(() => {
      result.current.setUpdateError('Error manual');
    });
    expect(result.current.updateError).toBe('Error manual');

    act(() => {
      result.current.setUpdateSuccess(true);
    });
    expect(result.current.updateSuccess).toBe(true);
  });
});
