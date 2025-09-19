import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SystemParameters from '../SystemParameters';
import { JoySenseService } from '../../services/backend-api';
import { useAuth } from '../../contexts/AuthContext';
import { useFilters } from '../../contexts/FilterContext';

// Mock de dependencias externas
jest.mock('../../services/backend-api');
jest.mock('../../contexts/AuthContext');
jest.mock('../../contexts/FilterContext');
jest.mock('../../utils/formValidation');
jest.mock('../../hooks/useSimpleModal');
jest.mock('../../hooks/useInsertionMessages');
jest.mock('../../hooks/useReplicate');
jest.mock('../../hooks/useGlobalFilterEffect');

const mockJoySenseService = JoySenseService as jest.Mocked<typeof JoySenseService>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseFilters = useFilters as jest.MockedFunction<typeof useFilters>;

describe('SystemParameters - Tests de Regresión Críticos', () => {
  // Setup común para todos los tests
  beforeEach(() => {
    // Mock de autenticación
    mockUseAuth.mockReturnValue({
      user: { id: 1, name: 'Test User' },
      login: jest.fn(),
      logout: jest.fn(),
      loading: false
    });

    // Mock de filtros
    mockUseFilters.mockReturnValue({
      paisSeleccionado: '1',
      empresaSeleccionada: '1',
      fundoSeleccionado: '1',
      setPaisSeleccionado: jest.fn(),
      setEmpresaSeleccionada: jest.fn(),
      setFundoSeleccionado: jest.fn(),
      clearFilters: jest.fn()
    });

    // Mock de JoySenseService
    mockJoySenseService.getTableData = jest.fn().mockResolvedValue([]);
    mockJoySenseService.insert = jest.fn().mockResolvedValue({ success: true });
    mockJoySenseService.update = jest.fn().mockResolvedValue({ success: true });
    mockJoySenseService.delete = jest.fn().mockResolvedValue({ success: true });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Validación Robusta', () => {
    it('debe validar País correctamente - campos obligatorios', async () => {
      render(
        <SystemParameters
          selectedTable="pais"
          activeSubTab="insert"
          onSubTabChange={jest.fn()}
          onTableSelect={jest.fn()}
        />
      );

      // Verificar que el formulario de País se renderiza
      expect(screen.getByText('PAIS*')).toBeInTheDocument();
      expect(screen.getByText('ABREVIATURA*')).toBeInTheDocument();

      // Intentar guardar sin datos
      const saveButton = screen.getByText('GUARDAR');
      fireEvent.click(saveButton);

      // Verificar que aparece mensaje de error
      await waitFor(() => {
        expect(screen.getByText(/El país es obligatorio/)).toBeInTheDocument();
        expect(screen.getByText(/La abreviatura es obligatoria/)).toBeInTheDocument();
      });
    });

    it('debe validar Empresa correctamente - campos obligatorios', async () => {
      render(
        <SystemParameters
          selectedTable="empresa"
          activeSubTab="insert"
          onSubTabChange={jest.fn()}
          onTableSelect={jest.fn()}
        />
      );

      // Verificar que el formulario de Empresa se renderiza
      expect(screen.getByText('EMPRESA*')).toBeInTheDocument();
      expect(screen.getByText('ABREVIATURA*')).toBeInTheDocument();

      // Intentar guardar sin datos
      const saveButton = screen.getByText('GUARDAR');
      fireEvent.click(saveButton);

      // Verificar que aparece mensaje de error
      await waitFor(() => {
        expect(screen.getByText(/La empresa es obligatoria/)).toBeInTheDocument();
        expect(screen.getByText(/La abreviatura es obligatoria/)).toBeInTheDocument();
      });
    });

    it('debe validar Nodo correctamente - habilitación progresiva', async () => {
      render(
        <SystemParameters
          selectedTable="nodo"
          activeSubTab="insert"
          onSubTabChange={jest.fn()}
          onTableSelect={jest.fn()}
        />
      );

      // Verificar que solo el campo nodo está habilitado inicialmente
      const nodoInput = screen.getByPlaceholderText('NODO*');
      const deveuiInput = screen.getByPlaceholderText('DEVEUI');

      expect(nodoInput).not.toBeDisabled();
      expect(deveuiInput).toBeDisabled();

      // Llenar el campo nodo
      fireEvent.change(nodoInput, { target: { value: 'Test Nodo' } });

      // Verificar que deveui se habilita
      await waitFor(() => {
        expect(deveuiInput).not.toBeDisabled();
      });
    });

    it('debe validar Métrica correctamente - campos obligatorios', async () => {
      render(
        <SystemParameters
          selectedTable="metrica"
          activeSubTab="insert"
          onSubTabChange={jest.fn()}
          onTableSelect={jest.fn()}
        />
      );

      // Verificar que el formulario de Métrica se renderiza
      expect(screen.getByText('METRICA*')).toBeInTheDocument();
      expect(screen.getByText('UNIDAD*')).toBeInTheDocument();

      // Intentar guardar sin datos
      const saveButton = screen.getByText('GUARDAR');
      fireEvent.click(saveButton);

      // Verificar que aparece mensaje de error
      await waitFor(() => {
        expect(screen.getByText(/La métrica es obligatoria/)).toBeInTheDocument();
        expect(screen.getByText(/La unidad es obligatoria/)).toBeInTheDocument();
      });
    });
  });

  describe('Habilitación Progresiva', () => {
    it('debe habilitar campos progresivamente en País', async () => {
      render(
        <SystemParameters
          selectedTable="pais"
          activeSubTab="insert"
          onSubTabChange={jest.fn()}
          onTableSelect={jest.fn()}
        />
      );

      const paisInput = screen.getByPlaceholderText('PAIS*');
      const abreviaturaInput = screen.getByPlaceholderText('ABREVIATURA*');

      // Inicialmente, abreviatura debe estar deshabilitada
      expect(abreviaturaInput).toBeDisabled();

      // Llenar el campo país
      fireEvent.change(paisInput, { target: { value: 'Test País' } });

      // Verificar que abreviatura se habilita
      await waitFor(() => {
        expect(abreviaturaInput).not.toBeDisabled();
      });
    });

    it('debe habilitar campos progresivamente en Empresa', async () => {
      render(
        <SystemParameters
          selectedTable="empresa"
          activeSubTab="insert"
          onSubTabChange={jest.fn()}
          onTableSelect={jest.fn()}
        />
      );

      const empresaInput = screen.getByPlaceholderText('EMPRESA*');
      const abreviaturaInput = screen.getByPlaceholderText('ABREVIATURA*');

      // Inicialmente, abreviatura debe estar deshabilitada
      expect(abreviaturaInput).toBeDisabled();

      // Llenar el campo empresa
      fireEvent.change(empresaInput, { target: { value: 'Test Empresa' } });

      // Verificar que abreviatura se habilita
      await waitFor(() => {
        expect(abreviaturaInput).not.toBeDisabled();
      });
    });

    it('debe habilitar campos progresivamente en Nodo', async () => {
      render(
        <SystemParameters
          selectedTable="nodo"
          activeSubTab="insert"
          onSubTabChange={jest.fn()}
          onTableSelect={jest.fn()}
        />
      );

      const nodoInput = screen.getByPlaceholderText('NODO*');
      const deveuiInput = screen.getByPlaceholderText('DEVEUI');
      const appeuiInput = screen.getByPlaceholderText('APPEUI');

      // Inicialmente, solo nodo debe estar habilitado
      expect(nodoInput).not.toBeDisabled();
      expect(deveuiInput).toBeDisabled();
      expect(appeuiInput).toBeDisabled();

      // Llenar el campo nodo
      fireEvent.change(nodoInput, { target: { value: 'Test Nodo' } });

      // Verificar que deveui se habilita
      await waitFor(() => {
        expect(deveuiInput).not.toBeDisabled();
      });

      // Llenar el campo deveui
      fireEvent.change(deveuiInput, { target: { value: 'Test Deveui' } });

      // Verificar que appeui se habilita
      await waitFor(() => {
        expect(appeuiInput).not.toBeDisabled();
      });
    });
  });

  describe('Protección de Datos', () => {
    it('debe proteger cambio de subpestaña con datos sin guardar', async () => {
      render(
        <SystemParameters
          selectedTable="pais"
          activeSubTab="insert"
          onSubTabChange={jest.fn()}
          onTableSelect={jest.fn()}
        />
      );

      // Llenar formulario con datos
      const paisInput = screen.getByPlaceholderText('PAIS*');
      fireEvent.change(paisInput, { target: { value: 'Test País' } });

      // Intentar cambiar a otra subpestaña
      const statusTab = screen.getByText('Estado');
      fireEvent.click(statusTab);

      // Verificar que aparece modal de confirmación
      await waitFor(() => {
        expect(screen.getByText(/Tienes datos sin guardar/)).toBeInTheDocument();
      });
    });

    it('debe proteger cambio de parámetro con datos sin guardar', async () => {
      render(
        <SystemParameters
          selectedTable="pais"
          activeSubTab="insert"
          onSubTabChange={jest.fn()}
          onTableSelect={jest.fn()}
        />
      );

      // Llenar formulario con datos
      const paisInput = screen.getByPlaceholderText('PAIS*');
      fireEvent.change(paisInput, { target: { value: 'Test País' } });

      // Intentar cambiar a otro parámetro
      const empresaTab = screen.getByText('Empresa');
      fireEvent.click(empresaTab);

      // Verificar que aparece modal de confirmación
      await waitFor(() => {
        expect(screen.getByText(/Tienes datos sin guardar/)).toBeInTheDocument();
      });
    });
  });

  describe('Sidebar de Tres Niveles', () => {
    it('debe mostrar navegación jerárquica correctamente', () => {
      render(
        <SystemParameters
          selectedTable="pais"
          activeSubTab="insert"
          onSubTabChange={jest.fn()}
          onTableSelect={jest.fn()}
        />
      );

      // Verificar que se muestran los elementos del sidebar
      expect(screen.getByText('País')).toBeInTheDocument();
      expect(screen.getByText('Empresa')).toBeInTheDocument();
      expect(screen.getByText('Fundo')).toBeInTheDocument();
    });

    it('debe mostrar subpestañas correctamente', () => {
      render(
        <SystemParameters
          selectedTable="pais"
          activeSubTab="insert"
          onSubTabChange={jest.fn()}
          onTableSelect={jest.fn()}
        />
      );

      // Verificar que se muestran las subpestañas
      expect(screen.getByText('Estado')).toBeInTheDocument();
      expect(screen.getByText('Crear')).toBeInTheDocument();
      expect(screen.getByText('Actualizar')).toBeInTheDocument();
      expect(screen.getByText('Masivo')).toBeInTheDocument();
    });
  });

  describe('Validación de Actualización', () => {
    it('debe validar actualización de País correctamente', async () => {
      // Mock de datos existentes
      mockJoySenseService.getTableData.mockResolvedValue([
        { paisid: 1, pais: 'País Existente', paisabrev: 'PE', statusid: 1 }
      ]);

      render(
        <SystemParameters
          selectedTable="pais"
          activeSubTab="update"
          onSubTabChange={jest.fn()}
          onTableSelect={jest.fn()}
        />
      );

      // Esperar a que se carguen los datos
      await waitFor(() => {
        expect(screen.getByText('País Existente')).toBeInTheDocument();
      });

      // Seleccionar una fila para actualizar
      const row = screen.getByText('País Existente');
      fireEvent.click(row);

      // Verificar que se muestra el formulario de actualización
      await waitFor(() => {
        expect(screen.getByDisplayValue('País Existente')).toBeInTheDocument();
      });
    });

    it('debe validar dependencias antes de inactivar País', async () => {
      // Mock de datos existentes con dependencias
      mockJoySenseService.getTableData.mockResolvedValue([
        { paisid: 1, pais: 'País con Dependencias', paisabrev: 'PD', statusid: 1 }
      ]);

      render(
        <SystemParameters
          selectedTable="pais"
          activeSubTab="update"
          onSubTabChange={jest.fn()}
          onTableSelect={jest.fn()}
        />
      );

      // Esperar a que se carguen los datos
      await waitFor(() => {
        expect(screen.getByText('País con Dependencias')).toBeInTheDocument();
      });

      // Seleccionar una fila para actualizar
      const row = screen.getByText('País con Dependencias');
      fireEvent.click(row);

      // Intentar inactivar
      const statusSelect = screen.getByDisplayValue('Activo');
      fireEvent.change(statusSelect, { target: { value: '0' } });

      const saveButton = screen.getByText('ACTUALIZAR');
      fireEvent.click(saveButton);

      // Verificar que aparece mensaje de error por dependencias
      await waitFor(() => {
        expect(screen.getByText(/No se puede inactivar/)).toBeInTheDocument();
      });
    });
  });

  describe('Placeholders Estándar', () => {
    it('debe mostrar placeholders estándar para campos obligatorios', () => {
      render(
        <SystemParameters
          selectedTable="pais"
          activeSubTab="insert"
          onSubTabChange={jest.fn()}
          onTableSelect={jest.fn()}
        />
      );

      // Verificar placeholders estándar
      expect(screen.getByPlaceholderText('PAIS*')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('ABREVIATURA*')).toBeInTheDocument();
    });

    it('debe mostrar placeholders estándar para campos opcionales', () => {
      render(
        <SystemParameters
          selectedTable="nodo"
          activeSubTab="insert"
          onSubTabChange={jest.fn()}
          onTableSelect={jest.fn()}
        />
      );

      // Verificar placeholders estándar
      expect(screen.getByPlaceholderText('NODO*')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('DEVEUI')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('APPEUI')).toBeInTheDocument();
    });

    it('debe mostrar leyenda de campos obligatorios', () => {
      render(
        <SystemParameters
          selectedTable="pais"
          activeSubTab="insert"
          onSubTabChange={jest.fn()}
          onTableSelect={jest.fn()}
        />
      );

      // Verificar leyenda
      expect(screen.getByText('(*) Campo obligatorio')).toBeInTheDocument();
    });
  });

  describe('Integración Completa', () => {
    it('debe funcionar completamente después del refactoring', async () => {
      render(
        <SystemParameters
          selectedTable="pais"
          activeSubTab="insert"
          onSubTabChange={jest.fn()}
          onTableSelect={jest.fn()}
        />
      );

      // Verificar que todos los elementos se renderizan
      expect(screen.getByText('PAIS*')).toBeInTheDocument();
      expect(screen.getByText('ABREVIATURA*')).toBeInTheDocument();
      expect(screen.getByText('GUARDAR')).toBeInTheDocument();
      expect(screen.getByText('CANCELAR')).toBeInTheDocument();
      expect(screen.getByText('(*) Campo obligatorio')).toBeInTheDocument();

      // Verificar que la funcionalidad básica funciona
      const paisInput = screen.getByPlaceholderText('PAIS*');
      const abreviaturaInput = screen.getByPlaceholderText('ABREVIATURA*');

      // Llenar formulario
      fireEvent.change(paisInput, { target: { value: 'Test País' } });
      fireEvent.change(abreviaturaInput, { target: { value: 'TP' } });

      // Verificar que los valores se establecen
      expect(paisInput).toHaveValue('Test País');
      expect(abreviaturaInput).toHaveValue('TP');
    });

    it('debe mantener todas las funcionalidades existentes', async () => {
      render(
        <SystemParameters
          selectedTable="pais"
          activeSubTab="insert"
          onSubTabChange={jest.fn()}
          onTableSelect={jest.fn()}
        />
      );

      // Verificar que todas las funcionalidades están presentes
      expect(screen.getByText('Estado')).toBeInTheDocument();
      expect(screen.getByText('Crear')).toBeInTheDocument();
      expect(screen.getByText('Actualizar')).toBeInTheDocument();
      expect(screen.getByText('Masivo')).toBeInTheDocument();

      // Verificar que los botones están presentes
      expect(screen.getByText('GUARDAR')).toBeInTheDocument();
      expect(screen.getByText('CANCELAR')).toBeInTheDocument();

      // Verificar que los campos están presentes
      expect(screen.getByPlaceholderText('PAIS*')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('ABREVIATURA*')).toBeInTheDocument();
    });
  });
});
