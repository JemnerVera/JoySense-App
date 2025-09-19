import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SystemParametersRefactored } from '../SystemParametersRefactored';
import { useAuth } from '../../contexts/AuthContext';
import { useFilters } from '../../contexts/FilterContext';

// Mock de contextos
jest.mock('../../contexts/AuthContext');
jest.mock('../../contexts/FilterContext');

// Mock de hooks personalizados
jest.mock('../../hooks/useSystemParametersState');
jest.mock('../../hooks/useTableData');
jest.mock('../../hooks/useSystemParametersCRUD');
jest.mock('../../hooks/useFormRendering');
jest.mock('../../hooks/useTableRendering');
jest.mock('../../hooks/useNotifications');
jest.mock('../../hooks/useGlobalFilterEffect');
jest.mock('../../hooks/useFormState');
jest.mock('../../hooks/useFormValidation');
jest.mock('../../hooks/useProgressiveEnablement');
jest.mock('../../hooks/useInsertOperations');
jest.mock('../../hooks/useUpdateOperations');
jest.mock('../../hooks/useSearchOperations');
jest.mock('../../hooks/useSimpleModal');
jest.mock('../../hooks/useReplicate');
jest.mock('../../hooks/useInsertionMessages');

// Mock de componentes
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
  )
}));

// Mock de otros componentes
jest.mock('../SimpleModal', () => ({ isOpen, onClose, title, message }: any) => 
  isOpen ? (
    <div data-testid="simple-modal">
      <h3>{title}</h3>
      <p>{message}</p>
      <button onClick={onClose}>Close</button>
    </div>
  ) : null
);

jest.mock('../LostDataModal', () => ({ isOpen }: any) => 
  isOpen ? <div data-testid="lost-data-modal">Lost Data Modal</div> : null
);

jest.mock('../ReplicateModal', () => ({ isOpen }: any) => 
  isOpen ? <div data-testid="replicate-modal">Replicate Modal</div> : null
);

jest.mock('../InsertionMessage', () => ({ messages }: any) => 
  messages.length > 0 ? (
    <div data-testid="insertion-message">
      {messages.length} messages
    </div>
  ) : null
);

describe('SystemParametersRefactored', () => {
  const mockUser = { id: 1, name: 'Test User' };
  const mockGlobalFilters = {};

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock de useAuth
    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    
    // Mock de useFilters
    (useFilters as jest.Mock).mockReturnValue({ globalFilters: mockGlobalFilters });
    
    // Mock de hooks personalizados
    const mockHookReturn = {
      // useSystemParametersState
      selectedTable: 'pais',
      activeSubTab: 'crear',
      updateData: [],
      updateFilteredData: [],
      searchField: '',
      searchTerm: '',
      selectedRowForUpdate: null,
      updateFormData: {},
      updateLoading: false,
      hasSearched: false,
      statusCurrentPage: 1,
      statusTotalPages: 1,
      statusSearchTerm: '',
      statusFilteredData: [],
      statusLoading: false,
      copyData: [],
      selectedRowsForCopy: [],
      setSelectedTable: jest.fn(),
      setActiveSubTab: jest.fn(),
      setUpdateData: jest.fn(),
      setUpdateFilteredData: jest.fn(),
      setSearchField: jest.fn(),
      setSearchTerm: jest.fn(),
      setSelectedRowForUpdate: jest.fn(),
      setUpdateFormData: jest.fn(),
      setUpdateLoading: jest.fn(),
      setHasSearched: jest.fn(),
      setStatusCurrentPage: jest.fn(),
      setStatusTotalPages: jest.fn(),
      setStatusSearchTerm: jest.fn(),
      setStatusFilteredData: jest.fn(),
      setStatusLoading: jest.fn(),
      setCopyData: jest.fn(),
      setSelectedRowsForCopy: jest.fn(),
      resetState: jest.fn(),
      
      // useTableData
      paisesData: [{ id: 1, pais: 'Perú', paisabrev: 'PE' }],
      empresasData: [],
      fundosData: [],
      ubicacionesData: [],
      localizacionesData: [],
      entidadesData: [],
      tiposData: [],
      nodosData: [],
      metricasData: [],
      umbralesData: [],
      perfilumbralData: [],
      criticidadesData: [],
      mediosData: [],
      contactosData: [],
      usuariosData: [],
      perfilesData: [],
      usuarioperfilData: [],
      isLoading: false,
      error: null,
      refreshData: jest.fn(),
      
      // useSystemParametersCRUD
      handleInsert: jest.fn().mockResolvedValue({ success: true, message: 'Success' }),
      handleUpdate: jest.fn().mockResolvedValue({ success: true, message: 'Success' }),
      handleDelete: jest.fn().mockResolvedValue({ success: true, message: 'Success' }),
      isProcessing: false,
      operationSuccess: false,
      operationError: null,
      clearOperationState: jest.fn(),
      
      // useFormRendering
      getFieldProps: jest.fn().mockReturnValue({ disabled: false, required: true, error: null, warning: null }),
      getFormValidation: jest.fn().mockReturnValue({ isValid: true, errors: [], warnings: [] }),
      shouldShowField: jest.fn().mockReturnValue(true),
      
      // useTableRendering
      filteredData: [{ id: 1, pais: 'Perú', paisabrev: 'PE' }],
      paginatedData: [{ id: 1, pais: 'Perú', paisabrev: 'PE' }],
      currentPage: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
      searchTerm: '',
      searchField: '',
      isSearching: false,
      setSearchTerm: jest.fn(),
      setSearchField: jest.fn(),
      clearSearch: jest.fn(),
      goToPage: jest.fn(),
      nextPage: jest.fn(),
      prevPage: jest.fn(),
      firstPage: jest.fn(),
      lastPage: jest.fn(),
      getDisplayValue: jest.fn().mockReturnValue('Test Value'),
      formatCellValue: jest.fn().mockReturnValue('Test Value'),
      
      // useNotifications
      notifications: [],
      removeNotification: jest.fn(),
      clearAll: jest.fn(),
      showSuccess: jest.fn(),
      showError: jest.fn(),
      showWarning: jest.fn(),
      showInfo: jest.fn(),
      
      // useFormState
      formData: {},
      setFormData: jest.fn(),
      resetForm: jest.fn(),
      
      // useFormValidation
      validateInsert: jest.fn().mockResolvedValue({ isValid: true, errors: [], warnings: [] }),
      validateUpdate: jest.fn().mockResolvedValue({ isValid: true, errors: [], warnings: [] }),
      validateMassiveInsert: jest.fn().mockResolvedValue({ isValid: true, errors: [], warnings: [] }),
      
      // useProgressiveEnablement
      getEnabledFields: jest.fn().mockReturnValue(['pais', 'paisabrev']),
      isFieldEnabled: jest.fn().mockReturnValue(true),
      
      // useInsertOperations
      insertSingle: jest.fn().mockResolvedValue({ success: true }),
      insertMultiple: jest.fn().mockResolvedValue({ success: true }),
      insertMassive: jest.fn().mockResolvedValue({ success: true }),
      isInserting: false,
      insertError: null,
      insertSuccess: false,
      clearInsertState: jest.fn(),
      
      // useUpdateOperations
      updateSingle: jest.fn().mockResolvedValue({ success: true }),
      updateMultiple: jest.fn().mockResolvedValue({ success: true }),
      isUpdating: false,
      updateError: null,
      updateSuccess: false,
      clearUpdateState: jest.fn(),
      
      // useSearchOperations
      searchTerm: '',
      searchField: '',
      filteredData: [],
      hasSearched: false,
      isSearching: false,
      setSearchTerm: jest.fn(),
      setSearchField: jest.fn(),
      performSearch: jest.fn(),
      clearSearch: jest.fn(),
      setFilteredData: jest.fn(),
      setHasSearched: jest.fn(),
      setIsSearching: jest.fn(),
      
      // useSimpleModal
      isOpen: false,
      openModal: jest.fn(),
      closeModal: jest.fn(),
      modalContent: null,
      
      // useReplicate
      isOpen: false,
      openModal: jest.fn(),
      closeModal: jest.fn(),
      replicateData: null,
      
      // useInsertionMessages
      messages: [],
      addMessage: jest.fn(),
      clearMessages: jest.fn()
    };

    // Aplicar mocks a todos los hooks
    Object.keys(mockHookReturn).forEach(key => {
      const mockHook = require(`../../hooks/use${key.charAt(0).toUpperCase() + key.slice(1)}`);
      if (mockHook[`use${key.charAt(0).toUpperCase() + key.slice(1)}`]) {
        (mockHook[`use${key.charAt(0).toUpperCase() + key.slice(1)}`] as jest.Mock).mockReturnValue(mockHookReturn[key]);
      }
    });
  });

  it('debe renderizar correctamente', () => {
    render(<SystemParametersRefactored />);
    
    expect(screen.getByText('Parámetros del Sistema')).toBeInTheDocument();
    expect(screen.getByText('País')).toBeInTheDocument();
    expect(screen.getByText('Empresa')).toBeInTheDocument();
  });

  it('debe mostrar mensaje cuando el usuario no está autenticado', () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null });
    
    render(<SystemParametersRefactored />);
    
    expect(screen.getByText('Debes iniciar sesión para acceder a los parámetros del sistema.')).toBeInTheDocument();
  });

  it('debe mostrar selector de tabla', () => {
    render(<SystemParametersRefactored />);
    
    expect(screen.getByText('País')).toBeInTheDocument();
    expect(screen.getByText('Empresa')).toBeInTheDocument();
    expect(screen.getByText('Fundo')).toBeInTheDocument();
  });

  it('debe mostrar pestañas cuando se selecciona una tabla', () => {
    render(<SystemParametersRefactored />);
    
    expect(screen.getByText('Crear')).toBeInTheDocument();
    expect(screen.getByText('Actualizar')).toBeInTheDocument();
    expect(screen.getByText('Estado')).toBeInTheDocument();
    expect(screen.getByText('Masivo')).toBeInTheDocument();
  });

  it('debe mostrar formulario en la pestaña crear', () => {
    render(<SystemParametersRefactored />);
    
    expect(screen.getByTestId('parameter-form')).toBeInTheDocument();
    expect(screen.getByText('Form for pais')).toBeInTheDocument();
  });

  it('debe mostrar tabla en la pestaña estado', () => {
    // Mock para cambiar a pestaña estado
    const mockUseSystemParametersState = require('../../hooks/useSystemParametersState');
    mockUseSystemParametersState.useSystemParametersState.mockReturnValue({
      ...mockUseSystemParametersState.useSystemParametersState(),
      activeSubTab: 'estado'
    });
    
    render(<SystemParametersRefactored />);
    
    expect(screen.getByTestId('parameter-table')).toBeInTheDocument();
    expect(screen.getByText('Table with 1 rows and 0 columns')).toBeInTheDocument();
  });

  it('debe mostrar operaciones masivas en la pestaña masivo', () => {
    // Mock para cambiar a pestaña masivo
    const mockUseSystemParametersState = require('../../hooks/useSystemParametersState');
    mockUseSystemParametersState.useSystemParametersState.mockReturnValue({
      ...mockUseSystemParametersState.useSystemParametersState(),
      activeSubTab: 'masivo'
    });
    
    render(<SystemParametersRefactored />);
    
    expect(screen.getByTestId('massive-operations')).toBeInTheDocument();
    expect(screen.getByText('Massive operations for pais')).toBeInTheDocument();
  });

  it('debe mostrar sistema de notificaciones', () => {
    render(<SystemParametersRefactored />);
    
    expect(screen.getByTestId('notification-system')).toBeInTheDocument();
  });

  it('debe manejar cambio de tabla', () => {
    render(<SystemParametersRefactored />);
    
    const empresaButton = screen.getByText('Empresa');
    fireEvent.click(empresaButton);
    
    // Verificar que se llamó la función de cambio de tabla
    // Esto depende de la implementación específica del mock
  });

  it('debe manejar cambio de pestaña', () => {
    render(<SystemParametersRefactored />);
    
    const actualizarButton = screen.getByText('Actualizar');
    fireEvent.click(actualizarButton);
    
    // Verificar que se llamó la función de cambio de pestaña
    // Esto depende de la implementación específica del mock
  });

  it('debe mostrar loading cuando está cargando datos', () => {
    // Mock para mostrar loading
    const mockUseTableData = require('../../hooks/useTableData');
    mockUseTableData.useTableData.mockReturnValue({
      ...mockUseTableData.useTableData(),
      isLoading: true
    });
    
    render(<SystemParametersRefactored />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('debe mostrar error cuando hay un error al cargar datos', () => {
    // Mock para mostrar error
    const mockUseTableData = require('../../hooks/useTableData');
    mockUseTableData.useTableData.mockReturnValue({
      ...mockUseTableData.useTableData(),
      error: 'Error al cargar datos'
    });
    
    render(<SystemParametersRefactored />);
    
    expect(screen.getByText('Error al cargar los datos: Error al cargar datos')).toBeInTheDocument();
    expect(screen.getByText('Reintentar')).toBeInTheDocument();
  });

  it('debe exponer métodos al componente padre', () => {
    const ref = React.createRef<{ refreshData: () => void; getCurrentData: () => any }>();
    
    render(<SystemParametersRefactored ref={ref} />);
    
    expect(ref.current).toBeDefined();
    expect(typeof ref.current?.refreshData).toBe('function');
    expect(typeof ref.current?.getCurrentData).toBe('function');
  });
});
