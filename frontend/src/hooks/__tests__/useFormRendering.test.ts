import { renderHook, act } from '@testing-library/react';
import { useFormRendering } from '../useFormRendering';

// Mock de hooks
jest.mock('../useProgressiveEnablement');
jest.mock('../useFormValidation');

describe('useFormRendering', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe inicializar con estado por defecto', () => {
    const { result } = renderHook(() => useFormRendering('pais'));

    expect(result.current.enabledFields).toEqual([]);
    expect(result.current.fieldErrors).toEqual({});
    expect(result.current.fieldWarnings).toEqual({});
    expect(result.current.isFormValid).toBe(true);
  });

  it('debe obtener propiedades de campo correctamente', () => {
    const { result } = renderHook(() => useFormRendering('pais'));

    const formData = { pais: 'Perú' };
    const fieldProps = result.current.getFieldProps('pais', formData);

    expect(fieldProps).toHaveProperty('disabled');
    expect(fieldProps).toHaveProperty('required');
    expect(fieldProps).toHaveProperty('error');
    expect(fieldProps).toHaveProperty('warning');
  });

  it('debe determinar si un campo debe mostrarse', () => {
    const { result } = renderHook(() => useFormRendering('pais'));

    const formData = { pais: 'Perú' };
    const shouldShow = result.current.shouldShowField('pais', formData);

    expect(shouldShow).toBe(true);
  });

  it('debe obtener dependencias de campo', () => {
    const { result } = renderHook(() => useFormRendering('pais'));

    const dependencies = result.current.getFieldDependencies('pais');

    expect(Array.isArray(dependencies)).toBe(true);
  });

  it('debe validar formulario completo', async () => {
    const { result } = renderHook(() => useFormRendering('pais'));

    const formData = { pais: 'Perú', paisabrev: 'PE' };

    await act(async () => {
      const validation = await result.current.getFormValidation(formData);
      expect(validation).toHaveProperty('isValid');
      expect(validation).toHaveProperty('errors');
      expect(validation).toHaveProperty('warnings');
    });
  });

  it('debe manejar diferentes tipos de tabla', () => {
    const { result: paisResult } = renderHook(() => useFormRendering('pais'));
    const { result: empresaResult } = renderHook(() => useFormRendering('empresa'));

    expect(paisResult.current.enabledFields).toBeDefined();
    expect(empresaResult.current.enabledFields).toBeDefined();
  });

  it('debe manejar datos de formulario vacíos', () => {
    const { result } = renderHook(() => useFormRendering('pais', {}));

    const fieldProps = result.current.getFieldProps('pais', {});
    expect(fieldProps).toBeDefined();
  });

  it('debe manejar datos de formulario con valores', () => {
    const formData = { pais: 'Perú', paisabrev: 'PE' };
    const { result } = renderHook(() => useFormRendering('pais', formData));

    const fieldProps = result.current.getFieldProps('pais', formData);
    expect(fieldProps).toBeDefined();
  });
});
