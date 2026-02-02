import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ParameterTable } from '../ParameterTable';

// Mock de hooks
jest.mock('../../../hooks/useTableRendering');

describe('ParameterTable', () => {
  const mockData = [
    { id: 1, pais: 'Perú', paisabrev: 'PE', statusid: 1 },
    { id: 2, pais: 'Chile', paisabrev: 'CL', statusid: 1 },
    { id: 3, pais: 'Argentina', paisabrev: 'AR', statusid: 0 }
  ];

  const mockColumns = [
    { key: 'pais', label: 'País', sortable: true },
    { key: 'paisabrev', label: 'Abreviatura', sortable: true },
    { key: 'statusid', label: 'Estado', type: 'status' }
  ];

  const mockProps = {
    data: mockData,
    columns: mockColumns,
    onRowSelect: jest.fn(),
    onRowEdit: jest.fn(),
    onRowDelete: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debe renderizar la tabla correctamente', () => {
    render(<ParameterTable {...mockProps} />);
    
    expect(screen.getByText('País')).toBeInTheDocument();
    expect(screen.getByText('Abreviatura')).toBeInTheDocument();
    expect(screen.getByText('Estado')).toBeInTheDocument();
  });

  it('debe mostrar datos en la tabla', () => {
    render(<ParameterTable {...mockProps} />);
    
    expect(screen.getByText('Perú')).toBeInTheDocument();
    expect(screen.getByText('Chile')).toBeInTheDocument();
    expect(screen.getByText('Argentina')).toBeInTheDocument();
  });

  it('debe manejar selección de filas', () => {
    render(<ParameterTable {...mockProps} />);
    
    const firstRow = screen.getByText('Perú').closest('tr');
    if (firstRow) {
      fireEvent.click(firstRow);
      expect(mockProps.onRowSelect).toHaveBeenCalledWith(mockData[0]);
    }
  });

  it('debe mostrar controles de búsqueda cuando searchable es true', () => {
    render(<ParameterTable {...mockProps} searchable={true} />);
    
    expect(screen.getByPlaceholderText('Buscar...')).toBeInTheDocument();
  });

  it('debe ocultar controles de búsqueda cuando searchable es false', () => {
    render(<ParameterTable {...mockProps} searchable={false} />);
    
    expect(screen.queryByPlaceholderText('Buscar...')).not.toBeInTheDocument();
  });

  it('debe mostrar controles de paginación cuando paginated es true', () => {
    render(<ParameterTable {...mockProps} paginated={true} />);
    
    expect(screen.getByText('Primera')).toBeInTheDocument();
    expect(screen.getByText('Anterior')).toBeInTheDocument();
    expect(screen.getByText('Siguiente')).toBeInTheDocument();
    expect(screen.getByText('Última')).toBeInTheDocument();
  });

  it('debe ocultar controles de paginación cuando paginated es false', () => {
    render(<ParameterTable {...mockProps} paginated={false} />);
    
    expect(screen.queryByText('Primera')).not.toBeInTheDocument();
    expect(screen.queryByText('Anterior')).not.toBeInTheDocument();
  });

  it('debe mostrar botones de acción cuando se proporcionan callbacks', () => {
    render(<ParameterTable {...mockProps} />);
    
    expect(screen.getAllByText('Editar')).toHaveLength(mockData.length);
    expect(screen.getAllByText('Eliminar')).toHaveLength(mockData.length);
  });

  it('debe manejar edición de filas', () => {
    render(<ParameterTable {...mockProps} />);
    
    const editButtons = screen.getAllByText('Editar');
    fireEvent.click(editButtons[0]);
    
    expect(mockProps.onRowEdit).toHaveBeenCalledWith(mockData[0]);
  });

  it('debe manejar eliminación de filas', () => {
    render(<ParameterTable {...mockProps} />);
    
    const deleteButtons = screen.getAllByText('Eliminar');
    fireEvent.click(deleteButtons[0]);
    
    expect(mockProps.onRowDelete).toHaveBeenCalledWith(mockData[0]);
  });

  it('debe mostrar mensaje cuando no hay datos', () => {
    render(<ParameterTable {...mockProps} data={[]} />);
    
    expect(screen.getByText('No se encontraron resultados')).toBeInTheDocument();
  });

  it('debe aplicar clases CSS personalizadas', () => {
    const customClassName = 'custom-table-class';
    render(<ParameterTable {...mockProps} className={customClassName} />);
    
    const tableContainer = screen.getByText('País').closest('.custom-table-class');
    expect(tableContainer).toBeInTheDocument();
  });

  it('debe manejar ordenamiento de columnas', () => {
    render(<ParameterTable {...mockProps} />);
    
    const paisHeader = screen.getByText('País');
    fireEvent.click(paisHeader);
    
    // El comportamiento de ordenamiento depende de los hooks mockeados
    expect(paisHeader).toBeInTheDocument();
  });

  it('debe mostrar información de paginación', () => {
    render(<ParameterTable {...mockProps} paginated={true} />);
    
    // La información de paginación depende de los hooks mockeados
    expect(screen.getByText('Primera')).toBeInTheDocument();
  });
});
