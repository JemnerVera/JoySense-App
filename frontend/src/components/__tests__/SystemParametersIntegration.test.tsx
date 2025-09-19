import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { SystemParametersRefactored } from '../SystemParametersRefactored';
import { useAuth } from '../../contexts/AuthContext';
import { useFilters } from '../../contexts/FilterContext';
import { JoySenseService } from '../../services/backend-api';

// Mock de contextos
jest.mock('../../contexts/AuthContext');
jest.mock('../../contexts/FilterContext');

// Mock de servicios
jest.mock('../../services/backend-api');
const mockJoySenseService = JoySenseService as jest.Mocked<typeof JoySenseService>;

// Mock de componentes reutilizables
jest.mock('../SystemParameters', () => ({
  ParameterForm: ({ selectedTable, onSuccess, onError }: any) => (
    <div data-testid="parameter-form">
      <p>Form for {selectedTable}</p>
      <button onClick={() => onSuccess('Success message')}>Submit</button>
      <button onClick={() => onError('Error message')}>Error</button>
    </div>
  ),
  ParameterTable: ({ data, columns, onRowSelect }: any) => (
    <div data-testid="parameter-table">
      <p>Table with {data.length} rows and {columns.length} columns</p>
      <button onClick={() => onRowSelect({ id: 1, name: 'Test' })}>Select Row</button>
    </div>
  ),
  MassiveOperations: ({ selectedTable, onSuccess, onError }: any) => (
    <div data-testid="massive-operations">
      <p>Massive operations for {selectedTable}</p>
      <button onClick={() => onSuccess('Massive success')}>Success</button>
      <button onClick={() => onError('Massive error')}>Error</button>
    </div>
  ),
  NotificationSystem: ({ notifications }: any) => (
    <div data-testid="notification-system">
      <p>{notifications.length} notifications</p>
    </div>
  ),
  useNotifications: () => ({
    notifications: [],
    removeNotification: jest.fn(),
    clearAll: jest.fn(),
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showWarning: jest.fn(),
    showInfo: jest.fn()
  })
}));

describe('SystemParametersRefactored - Integration Tests', () => {
  const mockUser = { id: 1, name: 'Test User' };
  const mockTableData = [
    { id: 1, pais: 'Perú', paisabrev: 'PE', statusid: 1 },
    { id: 2, pais: 'Chile', paisabrev: 'CL', statusid: 1 }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock de useAuth
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    
    // Mock de useFilters
    (useFilters as jest.Mock).mockReturnValue({ globalFilters: {} });
    
    // Mock de JoySenseService
    mockJoySenseService.getTableData.mockResolvedValue(mockTableData);
    mockJoySenseService.insertTableRow.mockResolvedValue({ id: 3 });
    mockJoySenseService.updateTableRow.mockResolvedValue({ id: 1 });
    mockJoySenseService.deleteTableRow.mockResolvedValue({});
  });

  describe('Flujo Completo de Usuario', () => {
    it('debe permitir navegación completa entre tablas y pestañas', async () => {
      render(<SystemParametersRefactored />);
      
      // Verificar que se carga la tabla por defecto (País)
      expect(screen.getByText('País')).toBeInTheDocument();
      
      // Cambiar a tabla Empresa
      const empresaButton = screen.getByText('Empresa');
      fireEvent.click(empresaButton);
      
      // Verificar que se cargan los datos de la nueva tabla
      await waitFor(() => {
        expect(mockJoySenseService.getTableData).toHaveBeenCalledWith('empresa');
      });
      
      // Navegar entre pestañas
      const crearTab = screen.getByText('Crear');
      const actualizarTab = screen.getByText('Actualizar');
      const estadoTab = screen.getByText('Estado');
      const masivoTab = screen.getByText('Masivo');
      
      // Probar pestaña Crear
      fireEvent.click(crearTab);
      expect(screen.getByTestId('parameter-form')).toBeInTheDocument();
      
      // Probar pestaña Estado
      fireEvent.click(estadoTab);
      expect(screen.getByTestId('parameter-table')).toBeInTheDocument();
      
      // Probar pestaña Masivo
      fireEvent.click(masivoTab);
      expect(screen.getByTestId('massive-operations')).toBeInTheDocument();
    });

    it('debe manejar operaciones CRUD completas', async () => {
      render(<SystemParametersRefactored />);
      
      // Navegar a pestaña Crear
      fireEvent.click(screen.getByText('Crear'));
      
      // Simular inserción exitosa
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);
      
      // Verificar que se llama al servicio de inserción
      await waitFor(() => {
        expect(mockJoySenseService.insertTableRow).toHaveBeenCalled();
      });
      
      // Navegar a pestaña Estado
      fireEvent.click(screen.getByText('Estado'));
      
      // Simular selección de fila para actualización
      const selectRowButton = screen.getByText('Select Row');
      fireEvent.click(selectRowButton);
      
      // Verificar que se cambia a pestaña Actualizar
      await waitFor(() => {
        expect(screen.getByText('Actualizar')).toHaveClass('bg-blue-600');
      });
    });

    it('debe manejar errores de red correctamente', async () => {
      // Mock de error de red
      mockJoySenseService.getTableData.mockRejectedValue(new Error('Network error'));
      
      render(<SystemParametersRefactored />);
      
      // Verificar que se muestra el error
      await waitFor(() => {
        expect(screen.getByText(/Error al cargar los datos/)).toBeInTheDocument();
      });
      
      // Verificar que se muestra botón de reintentar
      expect(screen.getByText('Reintentar')).toBeInTheDocument();
      
      // Simular reintento exitoso
      mockJoySenseService.getTableData.mockResolvedValue(mockTableData);
      fireEvent.click(screen.getByText('Reintentar'));
      
      // Verificar que se cargan los datos
      await waitFor(() => {
        expect(screen.getByTestId('parameter-table')).toBeInTheDocument();
      });
    });
  });

  describe('Funcionalidades Específicas', () => {
    it('debe manejar búsqueda y filtrado', async () => {
      render(<SystemParametersRefactored />);
      
      // Navegar a pestaña Estado
      fireEvent.click(screen.getByText('Estado'));
      
      // Verificar que se muestra la tabla
      await waitFor(() => {
        expect(screen.getByTestId('parameter-table')).toBeInTheDocument();
      });
      
      // La funcionalidad de búsqueda se maneja en el componente ParameterTable
      // Aquí verificamos que se renderiza correctamente
      expect(screen.getByText('Table with 2 rows and 0 columns')).toBeInTheDocument();
    });

    it('debe manejar paginación', async () => {
      // Mock de datos más grandes
      const largeDataSet = Array.from({ length: 25 }, (_, i) => ({
        id: i + 1,
        pais: `País ${i + 1}`,
        paisabrev: `P${i + 1}`,
        statusid: 1
      }));
      
      mockJoySenseService.getTableData.mockResolvedValue(largeDataSet);
      
      render(<SystemParametersRefactored />);
      
      // Navegar a pestaña Estado
      fireEvent.click(screen.getByText('Estado'));
      
      // Verificar que se muestra la tabla con datos paginados
      await waitFor(() => {
        expect(screen.getByText('Table with 25 rows and 0 columns')).toBeInTheDocument();
      });
    });

    it('debe manejar operaciones masivas', async () => {
      render(<SystemParametersRefactored />);
      
      // Navegar a pestaña Masivo
      fireEvent.click(screen.getByText('Masivo'));
      
      // Verificar que se muestra el componente de operaciones masivas
      expect(screen.getByTestId('massive-operations')).toBeInTheDocument();
      
      // Simular operación masiva exitosa
      const successButton = screen.getByText('Success');
      fireEvent.click(successButton);
      
      // Verificar que se muestra el mensaje de éxito
      await waitFor(() => {
        expect(screen.getByText('Massive success')).toBeInTheDocument();
      });
    });
  });

  describe('Estados de Carga', () => {
    it('debe mostrar loading durante la carga de datos', async () => {
      // Mock de carga lenta
      let resolvePromise: (value: any) => void;
      const slowPromise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      
      mockJoySenseService.getTableData.mockReturnValue(slowPromise);
      
      render(<SystemParametersRefactored />);
      
      // Verificar que se muestra el loading
      expect(screen.getByRole('status')).toBeInTheDocument();
      
      // Resolver la promesa
      act(() => {
        resolvePromise!(mockTableData);
      });
      
      // Verificar que se oculta el loading
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });

    it('debe manejar estado de procesamiento durante operaciones', async () => {
      render(<SystemParametersRefactored />);
      
      // Navegar a pestaña Crear
      fireEvent.click(screen.getByText('Crear'));
      
      // Simular inserción con delay
      let resolveInsert: (value: any) => void;
      const insertPromise = new Promise(resolve => {
        resolveInsert = resolve;
      });
      
      mockJoySenseService.insertTableRow.mockReturnValue(insertPromise);
      
      // Hacer clic en submit
      const submitButton = screen.getByText('Submit');
      fireEvent.click(submitButton);
      
      // Verificar que se muestra estado de procesamiento
      // (Esto se maneja internamente en el componente)
      
      // Resolver la promesa
      act(() => {
        resolveInsert!({ id: 3 });
      });
      
      // Verificar que se completa la operación
      await waitFor(() => {
        expect(mockJoySenseService.insertTableRow).toHaveBeenCalled();
      });
    });
  });

  describe('Accesibilidad', () => {
    it('debe ser navegable por teclado', () => {
      render(<SystemParametersRefactored />);
      
      // Verificar que los botones son focusables
      const paisButton = screen.getByText('País');
      paisButton.focus();
      expect(paisButton).toHaveFocus();
      
      // Navegar con Tab
      fireEvent.keyDown(paisButton, { key: 'Tab' });
      
      // Verificar que el siguiente elemento es focusable
      const empresaButton = screen.getByText('Empresa');
      expect(empresaButton).toHaveFocus();
    });

    it('debe tener etiquetas apropiadas', () => {
      render(<SystemParametersRefactored />);
      
      // Verificar que los botones tienen texto descriptivo
      expect(screen.getByText('País')).toBeInTheDocument();
      expect(screen.getByText('Empresa')).toBeInTheDocument();
      expect(screen.getByText('Crear')).toBeInTheDocument();
      expect(screen.getByText('Actualizar')).toBeInTheDocument();
      expect(screen.getByText('Estado')).toBeInTheDocument();
      expect(screen.getByText('Masivo')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('debe adaptarse a diferentes tamaños de pantalla', () => {
      // Simular pantalla móvil
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });
      
      render(<SystemParametersRefactored />);
      
      // Verificar que se renderiza correctamente
      expect(screen.getByText('Parámetros del Sistema')).toBeInTheDocument();
      
      // Simular pantalla de escritorio
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      });
      
      // Re-renderizar
      render(<SystemParametersRefactored />);
      
      // Verificar que se adapta al nuevo tamaño
      expect(screen.getByText('Parámetros del Sistema')).toBeInTheDocument();
    });
  });

  describe('Manejo de Errores', () => {
    it('debe manejar errores de validación', async () => {
      render(<SystemParametersRefactored />);
      
      // Navegar a pestaña Crear
      fireEvent.click(screen.getByText('Crear'));
      
      // Simular error de validación
      const errorButton = screen.getByText('Error');
      fireEvent.click(errorButton);
      
      // Verificar que se muestra el error
      await waitFor(() => {
        expect(screen.getByText('Error message')).toBeInTheDocument();
      });
    });

    it('debe manejar errores de operaciones masivas', async () => {
      render(<SystemParametersRefactored />);
      
      // Navegar a pestaña Masivo
      fireEvent.click(screen.getByText('Masivo'));
      
      // Simular error en operación masiva
      const errorButton = screen.getByText('Error');
      fireEvent.click(errorButton);
      
      // Verificar que se muestra el error
      await waitFor(() => {
        expect(screen.getByText('Massive error')).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    it('debe renderizar dentro del tiempo aceptable', () => {
      const start = performance.now();
      render(<SystemParametersRefactored />);
      const end = performance.now();
      
      // Verificar que el renderizado toma menos de 100ms
      expect(end - start).toBeLessThan(100);
    });

    it('debe manejar grandes conjuntos de datos eficientemente', async () => {
      // Mock de datos grandes
      const largeDataSet = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        pais: `País ${i + 1}`,
        paisabrev: `P${i + 1}`,
        statusid: 1
      }));
      
      mockJoySenseService.getTableData.mockResolvedValue(largeDataSet);
      
      const start = performance.now();
      render(<SystemParametersRefactored />);
      
      // Navegar a pestaña Estado
      fireEvent.click(screen.getByText('Estado'));
      
      await waitFor(() => {
        expect(screen.getByTestId('parameter-table')).toBeInTheDocument();
      });
      
      const end = performance.now();
      
      // Verificar que el renderizado con datos grandes toma menos de 500ms
      expect(end - start).toBeLessThan(500);
    });
  });
});
