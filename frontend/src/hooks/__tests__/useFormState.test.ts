import { renderHook, act } from '@testing-library/react';
import { useFormState } from '../useFormState';

describe('useFormState', () => {
  it('debe inicializar con valores por defecto', () => {
    const { result } = renderHook(() => useFormState());

    expect(result.current.formData).toEqual({});
    expect(result.current.originalData).toBeNull();
    expect(result.current.hasChanges).toBe(false);
    expect(result.current.isValid).toBe(true);
    expect(result.current.errors).toEqual([]);
    expect(result.current.warnings).toEqual([]);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.lastSaved).toBeNull();
  });

  it('debe inicializar con datos iniciales', () => {
    const initialData = { pais: 'Perú', paisabrev: 'PE' };
    const { result } = renderHook(() => useFormState(initialData));

    expect(result.current.formData).toEqual(initialData);
  });

  it('debe establecer datos del formulario', () => {
    const { result } = renderHook(() => useFormState());
    const formData = { pais: 'Chile', paisabrev: 'CL' };

    act(() => {
      result.current.setFormData(formData);
    });

    expect(result.current.formData).toEqual(formData);
  });

  it('debe actualizar un campo específico', () => {
    const { result } = renderHook(() => useFormState({ pais: 'Perú' }));

    act(() => {
      result.current.updateFormData('paisabrev', 'PE');
    });

    expect(result.current.formData).toEqual({ pais: 'Perú', paisabrev: 'PE' });
  });

  it('debe detectar cambios cuando se establecen datos originales', () => {
    const { result } = renderHook(() => useFormState({ pais: 'Perú' }));

    act(() => {
      result.current.setOriginalData({ pais: 'Chile' });
    });

    expect(result.current.hasChanges).toBe(true);
  });

  it('debe detectar cambios cuando se modifican datos', () => {
    const originalData = { pais: 'Perú', paisabrev: 'PE' };
    const { result } = renderHook(() => useFormState(originalData));

    act(() => {
      result.current.setOriginalData(originalData);
    });

    expect(result.current.hasChanges).toBe(false);

    act(() => {
      result.current.updateFormData('pais', 'Chile');
    });

    expect(result.current.hasChanges).toBe(true);
  });

  it('debe establecer datos originales', () => {
    const { result } = renderHook(() => useFormState());
    const originalData = { pais: 'Perú', paisabrev: 'PE' };

    act(() => {
      result.current.setOriginalData(originalData);
    });

    expect(result.current.originalData).toEqual(originalData);
  });

  it('debe establecer si hay cambios', () => {
    const { result } = renderHook(() => useFormState());

    act(() => {
      result.current.setHasChanges(true);
    });

    expect(result.current.hasChanges).toBe(true);
  });

  it('debe establecer si es válido', () => {
    const { result } = renderHook(() => useFormState());

    act(() => {
      result.current.setIsValid(false);
    });

    expect(result.current.isValid).toBe(false);
  });

  it('debe establecer errores', () => {
    const { result } = renderHook(() => useFormState());
    const errors = ['Error 1', 'Error 2'];

    act(() => {
      result.current.setErrors(errors);
    });

    expect(result.current.errors).toEqual(errors);
  });

  it('debe establecer advertencias', () => {
    const { result } = renderHook(() => useFormState());
    const warnings = ['Advertencia 1', 'Advertencia 2'];

    act(() => {
      result.current.setWarnings(warnings);
    });

    expect(result.current.warnings).toEqual(warnings);
  });

  it('debe establecer estado de envío', () => {
    const { result } = renderHook(() => useFormState());

    act(() => {
      result.current.setIsSubmitting(true);
    });

    expect(result.current.isSubmitting).toBe(true);
  });

  it('debe establecer timestamp de último guardado', () => {
    const { result } = renderHook(() => useFormState());
    const timestamp = Date.now();

    act(() => {
      result.current.setLastSaved(timestamp);
    });

    expect(result.current.lastSaved).toBe(timestamp);
  });

  it('debe resetear formulario', () => {
    const initialData = { pais: 'Perú' };
    const { result } = renderHook(() => useFormState(initialData));

    // Establecer algunos datos
    act(() => {
      result.current.setFormData({ pais: 'Chile', paisabrev: 'CL' });
      result.current.setOriginalData({ pais: 'Perú' });
      result.current.setHasChanges(true);
      result.current.setIsValid(false);
      result.current.setErrors(['Error']);
      result.current.setWarnings(['Advertencia']);
      result.current.setIsSubmitting(true);
      result.current.setLastSaved(Date.now());
    });

    // Resetear
    act(() => {
      result.current.resetForm();
    });

    expect(result.current.formData).toEqual(initialData);
    expect(result.current.originalData).toBeNull();
    expect(result.current.hasChanges).toBe(false);
    expect(result.current.isValid).toBe(true);
    expect(result.current.errors).toEqual([]);
    expect(result.current.warnings).toEqual([]);
    expect(result.current.isSubmitting).toBe(false);
    expect(result.current.lastSaved).toBeNull();
  });

  it('debe resetear a datos originales', () => {
    const originalData = { pais: 'Perú', paisabrev: 'PE' };
    const { result } = renderHook(() => useFormState({ pais: 'Chile' }));

    act(() => {
      result.current.setOriginalData(originalData);
      result.current.setFormData({ pais: 'Chile', paisabrev: 'CL' });
    });

    act(() => {
      result.current.resetToOriginal();
    });

    expect(result.current.formData).toEqual(originalData);
    expect(result.current.hasChanges).toBe(false);
  });

  it('debe limpiar validación', () => {
    const { result } = renderHook(() => useFormState());

    // Establecer errores y advertencias
    act(() => {
      result.current.setIsValid(false);
      result.current.setErrors(['Error']);
      result.current.setWarnings(['Advertencia']);
    });

    // Limpiar validación
    act(() => {
      result.current.clearValidation();
    });

    expect(result.current.isValid).toBe(true);
    expect(result.current.errors).toEqual([]);
    expect(result.current.warnings).toEqual([]);
  });

  it('debe marcar como guardado', () => {
    const { result } = renderHook(() => useFormState({ pais: 'Perú' }));

    act(() => {
      result.current.setFormData({ pais: 'Chile' });
      result.current.setHasChanges(true);
    });

    act(() => {
      result.current.markAsSaved();
    });

    expect(result.current.lastSaved).not.toBeNull();
    expect(result.current.hasChanges).toBe(false);
    expect(result.current.originalData).toEqual({ pais: 'Chile' });
  });

  it('debe actualizar datos cuando cambien los datos iniciales', () => {
    const { result, rerender } = renderHook(
      ({ initialData }) => useFormState(initialData),
      { initialProps: { initialData: { pais: 'Perú' } } }
    );

    expect(result.current.formData).toEqual({ pais: 'Perú' });

    rerender({ initialData: { pais: 'Chile' } });

    expect(result.current.formData).toEqual({ pais: 'Chile' });
  });
});
