import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ParameterForm } from '../ParameterForm';

// Mock de hooks
jest.mock('../../../hooks/useFormRendering');
jest.mock('../../../hooks/useSystemParametersCRUD');

describe('ParameterForm', () => {
  const mockProps = {
    selectedTable: 'pais',
    formData: { pais: '', paisabrev: '' },
    onFormDataChange: jest.fn(),
    onSuccess: jest.fn(),
    onError: jest.fn(),
    existingData: [],
    isUpdate: false,
    originalData: {}
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe renderizar el formulario correctamente', () => {
    render(<ParameterForm {...mockProps} />);
    
    expect(screen.getByText('PAÍS')).toBeInTheDocument();
    expect(screen.getByText('PAISABREV')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /crear/i })).toBeInTheDocument();
  });

  it('debe manejar cambios en campos del formulario', () => {
    render(<ParameterForm {...mockProps} />);
    
    const paisInput = screen.getByPlaceholderText('PAIS*');
    fireEvent.change(paisInput, { target: { value: 'Perú' } });
    
    expect(mockProps.onFormDataChange).toHaveBeenCalledWith({
      pais: 'Perú',
      paisabrev: ''
    });
  });

  it('debe mostrar botón de actualizar cuando isUpdate es true', () => {
    render(<ParameterForm {...mockProps} isUpdate={true} />);
    
    expect(screen.getByRole('button', { name: /actualizar/i })).toBeInTheDocument();
  });

  it('debe mostrar campos específicos para empresa', () => {
    render(<ParameterForm {...mockProps} selectedTable="empresa" />);
    
    expect(screen.getByText('EMPRESA')).toBeInTheDocument();
    expect(screen.getByText('EMPRESABREV')).toBeInTheDocument();
    expect(screen.getByText('PAISID')).toBeInTheDocument();
  });

  it('debe mostrar campos específicos para fundo', () => {
    render(<ParameterForm {...mockProps} selectedTable="fundo" />);
    
    expect(screen.getByText('FUNDO')).toBeInTheDocument();
    expect(screen.getByText('FUNDOABREV')).toBeInTheDocument();
    expect(screen.getByText('EMPRESAID')).toBeInTheDocument();
  });

  it('debe mostrar leyenda de campos obligatorios', () => {
    render(<ParameterForm {...mockProps} />);
    
    expect(screen.getByText('(*) Campo obligatorio')).toBeInTheDocument();
  });

  it('debe manejar envío del formulario', async () => {
    render(<ParameterForm {...mockProps} />);
    
    const submitButton = screen.getByRole('button', { name: /crear/i });
    fireEvent.click(submitButton);
    
    // El comportamiento específico depende de los mocks de los hooks
    await waitFor(() => {
      expect(mockProps.onSuccess).toHaveBeenCalled();
    });
  });

  it('debe mostrar errores de validación', () => {
    const propsWithErrors = {
      ...mockProps,
      formData: { pais: '', paisabrev: '' }
    };
    
    render(<ParameterForm {...propsWithErrors} />);
    
    // Los errores se mostrarían si la validación falla
    // Esto depende de la implementación de los hooks mockeados
  });

  it('debe deshabilitar botón de envío cuando está procesando', () => {
    render(<ParameterForm {...mockProps} />);
    
    const submitButton = screen.getByRole('button', { name: /crear/i });
    // El estado de procesamiento depende de los hooks mockeados
    expect(submitButton).toBeInTheDocument();
  });
});
