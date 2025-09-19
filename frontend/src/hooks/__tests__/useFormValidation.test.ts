import { renderHook, act } from '@testing-library/react';
import { useFormValidation } from '../useFormValidation';
import { JoySenseService } from '../../services/backend-api';

// Mock de JoySenseService
jest.mock('../../services/backend-api');
const mockJoySenseService = JoySenseService as jest.Mocked<typeof JoySenseService>;

describe('useFormValidation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateInsert', () => {
    it('debe validar inserción de País correctamente', async () => {
      const { result } = renderHook(() => useFormValidation('pais'));
      
      const formData = {
        pais: 'Test País',
        paisabrev: 'TP'
      };
      
      await act(async () => {
        const validationResult = await result.current.validateInsert(formData);
        expect(validationResult.isValid).toBe(true);
        expect(validationResult.errors).toHaveLength(0);
      });
    });

    it('debe detectar errores en inserción de País', async () => {
      const { result } = renderHook(() => useFormValidation('pais'));
      
      const formData = {
        pais: '',
        paisabrev: ''
      };
      
      await act(async () => {
        const validationResult = await result.current.validateInsert(formData);
        expect(validationResult.isValid).toBe(false);
        expect(validationResult.errors.length).toBeGreaterThan(0);
      });
    });

    it('debe validar inserción de Empresa correctamente', async () => {
      const { result } = renderHook(() => useFormValidation('empresa'));
      
      const formData = {
        empresa: 'Test Empresa',
        empresabrev: 'TE',
        paisid: 1
      };
      
      await act(async () => {
        const validationResult = await result.current.validateInsert(formData);
        expect(validationResult.isValid).toBe(true);
        expect(validationResult.errors).toHaveLength(0);
      });
    });

    it('debe validar inserción de Nodo correctamente', async () => {
      const { result } = renderHook(() => useFormValidation('nodo'));
      
      const formData = {
        nodo: 'Test Nodo',
        deveui: 'Test Deveui'
      };
      
      await act(async () => {
        const validationResult = await result.current.validateInsert(formData);
        expect(validationResult.isValid).toBe(true);
        expect(validationResult.errors).toHaveLength(0);
      });
    });
  });

  describe('validateUpdate', () => {
    it('debe validar actualización de País correctamente', async () => {
      mockJoySenseService.getTableData.mockResolvedValue([
        { paisid: 1, pais: 'País Existente', paisabrev: 'PE', statusid: 1 }
      ]);

      const { result } = renderHook(() => useFormValidation('pais'));
      
      const formData = {
        pais: 'País Actualizado',
        paisabrev: 'PA'
      };
      
      const originalData = {
        paisid: 1,
        pais: 'País Existente',
        paisabrev: 'PE',
        statusid: 1
      };
      
      await act(async () => {
        const validationResult = await result.current.validateUpdate(formData, originalData);
        expect(validationResult.isValid).toBe(true);
        expect(validationResult.errors).toHaveLength(0);
      });
    });

    it('debe detectar duplicados en actualización', async () => {
      mockJoySenseService.getTableData.mockResolvedValue([
        { paisid: 1, pais: 'País Existente', paisabrev: 'PE', statusid: 1 },
        { paisid: 2, pais: 'Otro País', paisabrev: 'OP', statusid: 1 }
      ]);

      const { result } = renderHook(() => useFormValidation('pais'));
      
      const formData = {
        pais: 'Otro País', // Duplicado
        paisabrev: 'PA'
      };
      
      const originalData = {
        paisid: 1,
        pais: 'País Existente',
        paisabrev: 'PE',
        statusid: 1
      };
      
      await act(async () => {
        const validationResult = await result.current.validateUpdate(formData, originalData);
        expect(validationResult.isValid).toBe(false);
        expect(validationResult.errors.length).toBeGreaterThan(0);
      });
    });
  });

  describe('checkDependencies', () => {
    it('debe detectar dependencias en País', async () => {
      mockJoySenseService.getTableData.mockResolvedValue([
        { empresaid: 1, empresa: 'Empresa Test', paisid: 1 }
      ]);

      const { result } = renderHook(() => useFormValidation('pais'));
      
      await act(async () => {
        const hasDependencies = await result.current.checkDependencies(1);
        expect(hasDependencies).toBe(true);
      });
    });

    it('debe detectar dependencias en Empresa', async () => {
      mockJoySenseService.getTableData.mockResolvedValue([
        { fundoid: 1, fundo: 'Fundo Test', empresaid: 1 }
      ]);

      const { result } = renderHook(() => useFormValidation('empresa'));
      
      await act(async () => {
        const hasDependencies = await result.current.checkDependencies(1);
        expect(hasDependencies).toBe(true);
      });
    });

    it('debe detectar dependencias en Fundo', async () => {
      mockJoySenseService.getTableData.mockResolvedValue([
        { ubicacionid: 1, ubicacion: 'Ubicación Test', fundoid: 1 }
      ]);

      const { result } = renderHook(() => useFormValidation('fundo'));
      
      await act(async () => {
        const hasDependencies = await result.current.checkDependencies(1);
        expect(hasDependencies).toBe(true);
      });
    });

    it('debe retornar false cuando no hay dependencias', async () => {
      mockJoySenseService.getTableData.mockResolvedValue([]);

      const { result } = renderHook(() => useFormValidation('pais'));
      
      await act(async () => {
        const hasDependencies = await result.current.checkDependencies(1);
        expect(hasDependencies).toBe(false);
      });
    });
  });

  describe('validateMultipleInsert', () => {
    it('debe validar inserción múltiple correctamente', async () => {
      const { result } = renderHook(() => useFormValidation('pais'));
      
      const multipleData = [
        { pais: 'País 1', paisabrev: 'P1' },
        { pais: 'País 2', paisabrev: 'P2' }
      ];
      
      await act(async () => {
        const validationResults = await result.current.validateMultipleInsert(multipleData);
        expect(validationResults).toHaveLength(2);
        expect(validationResults[0].isValid).toBe(true);
        expect(validationResults[1].isValid).toBe(true);
      });
    });

    it('debe detectar errores en inserción múltiple', async () => {
      const { result } = renderHook(() => useFormValidation('pais'));
      
      const multipleData = [
        { pais: '', paisabrev: '' }, // Error
        { pais: 'País 2', paisabrev: 'P2' } // OK
      ];
      
      await act(async () => {
        const validationResults = await result.current.validateMultipleInsert(multipleData);
        expect(validationResults).toHaveLength(2);
        expect(validationResults[0].isValid).toBe(false);
        expect(validationResults[1].isValid).toBe(true);
      });
    });
  });

  describe('validateMassiveInsert', () => {
    it('debe validar inserción masiva correctamente', async () => {
      const { result } = renderHook(() => useFormValidation('pais'));
      
      const massiveFormData = {
        pais: 'País Masivo',
        paisabrev: 'PM'
      };
      
      await act(async () => {
        const validationResult = await result.current.validateMassiveInsert(massiveFormData);
        expect(validationResult.isValid).toBe(true);
        expect(validationResult.errors).toHaveLength(0);
      });
    });

    it('debe detectar errores en inserción masiva', async () => {
      const { result } = renderHook(() => useFormValidation('pais'));
      
      const massiveFormData = {
        pais: '',
        paisabrev: ''
      };
      
      await act(async () => {
        const validationResult = await result.current.validateMassiveInsert(massiveFormData);
        expect(validationResult.isValid).toBe(false);
        expect(validationResult.errors.length).toBeGreaterThan(0);
      });
    });
  });
});