import { useState, useCallback, useRef } from 'react';
import { JoySenseService } from '../services/backend-api';
import { ColumnInfo } from '../types/systemParameters';

/**
 * Hook para manejar la carga y gestión de datos de tablas
 * Extraído de SystemParameters.tsx para reducir complejidad
 */
export const useTableDataManagement = () => {
  // Estados para datos de tabla
  const [tableData, setTableData] = useState<any[]>([]);
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [tableColumns, setTableColumns] = useState<ColumnInfo[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Estados para datos relacionados
  const [userData, setUserData] = useState<any[]>([]);
  const [paisesData, setPaisesData] = useState<any[]>([]);
  const [empresasData, setEmpresasData] = useState<any[]>([]);
  const [fundosData, setFundosData] = useState<any[]>([]);
  const [ubicacionesData, setUbicacionesData] = useState<any[]>([]);
  const [localizacionesData, setLocalizacionesData] = useState<any[]>([]);
  const [entidadesData, setEntidadesData] = useState<any[]>([]);
  const [nodosData, setNodosData] = useState<any[]>([]);
  const [tiposData, setTiposData] = useState<any[]>([]);
  const [metricasData, setMetricasData] = useState<any[]>([]);
  const [criticidadesData, setCriticidadesData] = useState<any[]>([]);
  const [perfilesData, setPerfilesData] = useState<any[]>([]);
  const [umbralesData, setUmbralesData] = useState<any[]>([]);
  const [sensorsData, setSensorsData] = useState<any[]>([]);
  const [metricasensorData, setMetricasensorData] = useState<any[]>([]);
  const [contactosData, setContactosData] = useState<any[]>([]);
  const [correosData, setCorreosData] = useState<any[]>([]);

  // Referencias para control de carga
  const loadingTableRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Cargar datos de usuario
   */
  const loadUserData = useCallback(async () => {
    try {
      const response = await JoySenseService.getTableData('usuario', 1000);
      const data = Array.isArray(response) ? response : ((response as any)?.data || []);
      
      
      setUserData(data);
    } catch (error) {
      console.error('Error loading user data:', error);
      setUserData([]);
    }
  }, []);

  /**
   * Cargar datos de todas las tablas relacionadas
   */
  const loadRelatedTablesData = useCallback(async () => {
    try {
      // const startTime = performance.now(); // Para debugging de performance

      const [
        paisesResponse,
        empresasResponse,
        fundosResponse,
        ubicacionesResponse,
        localizacionesResponse,
        entidadesResponse,
        nodosResponse,
        tiposResponse,
        metricasResponse,
        criticidadesResponse,
        perfilesResponse,
        umbralesResponse,
        usuariosResponse,
        sensorsResponse,
        metricasensorResponse,
        contactosResponse,
        correosResponse
      ] = await Promise.all([
        JoySenseService.getTableData('pais', 500),
        JoySenseService.getTableData('empresa', 500),
        JoySenseService.getTableData('fundo', 500),
        JoySenseService.getTableData('ubicacion', 500),
        JoySenseService.getTableData('localizacion', 500),
        JoySenseService.getTableData('entidad', 500),
        JoySenseService.getTableData('nodo', 500),
        JoySenseService.getTableData('tipo', 500),
        JoySenseService.getTableData('metrica', 500),
        JoySenseService.getTableData('criticidad', 500),
        JoySenseService.getTableData('perfil', 500),
        JoySenseService.getTableData('umbral', 500),
        JoySenseService.getTableData('usuario', 500),
        JoySenseService.getTableData('sensor', 500),
        JoySenseService.getTableData('metricasensor', 2000), // Límite razonable para evitar cargar miles de registros
        JoySenseService.getTableData('contacto', 500),
        JoySenseService.getTableData('correo', 500)
      ]);

      // Procesar respuestas
      const paises = Array.isArray(paisesResponse) ? paisesResponse : ((paisesResponse as any)?.data || []);
      const empresas = Array.isArray(empresasResponse) ? empresasResponse : ((empresasResponse as any)?.data || []);
      const fundos = Array.isArray(fundosResponse) ? fundosResponse : ((fundosResponse as any)?.data || []);
      
      // Para fundo, extraer paisid de la relación con empresa
      const processedFundos = fundos.map((fundo: any) => ({
        ...fundo,
        paisid: fundo.empresa?.paisid || null
      }));

      const ubicaciones = Array.isArray(ubicacionesResponse) ? ubicacionesResponse : ((ubicacionesResponse as any)?.data || []);
      const localizaciones = Array.isArray(localizacionesResponse) ? localizacionesResponse : ((localizacionesResponse as any)?.data || []);
      const entidades = Array.isArray(entidadesResponse) ? entidadesResponse : ((entidadesResponse as any)?.data || []);
      const nodos = Array.isArray(nodosResponse) ? nodosResponse : ((nodosResponse as any)?.data || []);
      const tipos = Array.isArray(tiposResponse) ? tiposResponse : ((tiposResponse as any)?.data || []);
      const metricas = Array.isArray(metricasResponse) ? metricasResponse : ((metricasResponse as any)?.data || []);
      const criticidades = Array.isArray(criticidadesResponse) ? criticidadesResponse : ((criticidadesResponse as any)?.data || []);
      const perfiles = Array.isArray(perfilesResponse) ? perfilesResponse : ((perfilesResponse as any)?.data || []);
      const umbrales = Array.isArray(umbralesResponse) ? umbralesResponse : ((umbralesResponse as any)?.data || []);
      const usuarios = Array.isArray(usuariosResponse) ? usuariosResponse : ((usuariosResponse as any)?.data || []);
      const sensors = Array.isArray(sensorsResponse) ? sensorsResponse : ((sensorsResponse as any)?.data || []);
      const metricasensor = Array.isArray(metricasensorResponse) ? metricasensorResponse : ((metricasensorResponse as any)?.data || []);
      const contactos = Array.isArray(contactosResponse) ? contactosResponse : ((contactosResponse as any)?.data || []);
      const correos = Array.isArray(correosResponse) ? correosResponse : ((correosResponse as any)?.data || []);

      // Establecer todos los datos
      setPaisesData(paises);
      setEmpresasData(empresas);
      setFundosData(processedFundos);
      setUbicacionesData(ubicaciones);
      setLocalizacionesData(localizaciones);
      setEntidadesData(entidades);
      setNodosData(nodos);
      setTiposData(tipos);
      setMetricasData(metricas);
      setCriticidadesData(criticidades);
      setPerfilesData(perfiles);
      setUmbralesData(umbrales);
      setUserData(usuarios);
      setSensorsData(sensors);
      setMetricasensorData(metricasensor);
      setContactosData(contactos);
      setCorreosData(correos);

      // const endTime = performance.now(); // Para debugging de performance
    } catch (error) {
      console.error('Error loading related tables data:', error);
    }
  }, []);

  /**
   * Cargar datos de una tabla específica
   */
  const loadTableData = useCallback(async (selectedTable: string, initializeFormData?: (cols?: ColumnInfo[]) => Record<string, any>) => {
    // Acceder al estado actual de columns usando una función
    // Esto requiere pasar columns como dependencia o usar ref
    if (!selectedTable) {
      return;
    }
    
    
    // Limpiar datos inmediatamente si cambió la tabla para evitar mostrar datos incorrectos
    const isTableChange = loadingTableRef.current && loadingTableRef.current !== selectedTable;
    if (isTableChange) {
      // Cancelar llamada anterior
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }
    
    // Prevenir múltiples llamadas simultáneas para la misma tabla
    // Si ya está cargando la misma tabla, ignorar la llamada
    if (loadingTableRef.current === selectedTable && loading) {
      return;
    }
    
    // Crear nuevo AbortController para esta llamada
    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    loadingTableRef.current = selectedTable;

    try {
      // Verificar si la llamada fue cancelada antes de continuar
      if (abortController.signal.aborted) {
        return;
      }

      // Limpiar datos y establecer loading inmediatamente (siempre, para asegurar estado limpio)
      setTableData([]);
      setColumns([]);
      setTableColumns([]);
      setLoading(true);


      // const startTime = performance.now(); // Para debugging de performance

      // Cargar las columnas para la tabla actual
      
      // Verificar si la llamada fue cancelada antes de hacer la llamada
      if (abortController.signal.aborted) {
        return;
      }
      
      const cols = await JoySenseService.getTableColumns(selectedTable);
      
      
      // Verificar si la llamada fue cancelada después de recibir las columnas
      if (abortController.signal.aborted) {
        return;
      }

      // Verificar que todavía estamos cargando la misma tabla antes de establecer columnas
      if (loadingTableRef.current !== selectedTable) {
        return;
      }
      
      // Establecer columnas base para formularios
      
      // IMPORTANTE: NO resetear loadingTableRef.current hasta después de establecer las columnas
      // para evitar race conditions
      setColumns(cols || []);
      
      // Resetear la referencia solo después de establecer columnas exitosamente
      // Pero mantenerlo como selectedTable para evitar limpieza prematura

      // Agregar columnas virtuales para tablas agrupadas
      if (selectedTable === 'sensor') {
        // Agregar columna virtual 'tipos' para mostrar todos los tipos concatenados
        const tiposColumn = {
          columnName: 'tipos',
          dataType: 'text',
          isNullable: true,
          defaultValue: null,
          isIdentity: false,
          isPrimaryKey: false
        };
        setTableColumns([...cols, tiposColumn]);
      } else if (selectedTable === 'metricasensor') {
        // Agregar columnas virtuales para metricasensor
        const tiposColumn = {
          columnName: 'tipos',
          dataType: 'text',
          isNullable: true,
          defaultValue: null,
          isIdentity: false,
          isPrimaryKey: false
        };
        const metricasColumn = {
          columnName: 'metricas',
          dataType: 'text',
          isNullable: true,
          defaultValue: null,
          isIdentity: false,
          isPrimaryKey: false
        };
        setTableColumns([...cols, tiposColumn, metricasColumn]);
      } else if (selectedTable === 'usuarioperfil') {
        // Agregar columnas virtuales para usuarioperfil
        const usuarioColumn = {
          columnName: 'usuario',
          dataType: 'text',
          isNullable: true,
          defaultValue: null,
          isIdentity: false,
          isPrimaryKey: false
        };
        const perfilesColumn = {
          columnName: 'perfiles',
          dataType: 'text',
          isNullable: true,
          defaultValue: null,
          isIdentity: false,
          isPrimaryKey: false
        };
        setTableColumns([...cols, usuarioColumn, perfilesColumn]);
      } else {
        setTableColumns(cols || []);
      }

      // Inicializar formData con las columnas recién cargadas si se proporciona la función
      const formData = initializeFormData ? initializeFormData(cols) : {};

      // Cargar datos con paginación para tablas grandes
      
      // Verificar si la llamada fue cancelada antes de cargar datos
      if (abortController.signal.aborted) {
        return;
      }
      
      // Para tablas grandes (metricasensor, localizacion), no aplicar límite para obtener todos los registros
      const dataResponse = (selectedTable === 'metricasensor' || selectedTable === 'localizacion')
        ? await JoySenseService.getTableData(selectedTable)
        : await JoySenseService.getTableData(selectedTable, 1000);
      
      // Verificar si la llamada fue cancelada después de recibir los datos
      if (abortController.signal.aborted) {
        return;
      }

      // Verificar que todavía estamos cargando la misma tabla
      if (loadingTableRef.current !== selectedTable) {
        return;
      }
      
      const data = Array.isArray(dataResponse) ? dataResponse : ((dataResponse as any)?.data || []);

      // Ordenar datos según la tabla
      let sortedData = data;
      if (selectedTable === 'permiso') {
        // Para permiso, ordenar por permisoid ascendente
        sortedData = data.sort((a: any, b: any) => {
          const idA = a.permisoid || 0;
          const idB = b.permisoid || 0;
          return idA - idB; // Orden ascendente por permisoid
        });
      } else {
        // Para otras tablas, ordenar por fecha de creación (más recientes primero)
        sortedData = data.sort((a: any, b: any) => {
          const dateA = new Date(a.datecreated || a.datemodified || 0);
          const dateB = new Date(b.datecreated || b.datemodified || 0);
          return dateB.getTime() - dateA.getTime(); // Orden descendente (más recientes primero)
        });
      }

      // Verificar si la llamada fue cancelada antes de actualizar el estado
      if (abortController.signal.aborted) {
        return;
      }

      // Verificar que todavía estamos cargando la misma tabla antes de actualizar datos
      if (loadingTableRef.current !== selectedTable) {
        return;
      }

      // Solo actualizar si los datos han cambiado realmente
      setTableData(prevData => {
        if (JSON.stringify(prevData) === JSON.stringify(sortedData)) {
          return prevData;
        }
        return sortedData;
      });

      // Cargar datos de sensores si estamos en el contexto de metricasensor o umbral
      if (selectedTable === 'metricasensor' || selectedTable === 'umbral') {
        try {
          const sensorResponse = await JoySenseService.getTableData('sensor', 1000);
          const sensorData = Array.isArray(sensorResponse) ? sensorResponse : ((sensorResponse as any)?.data || []);
          setSensorsData(sensorData);
        } catch (error) {
          console.error('Error cargando datos de sensores:', error);
          setSensorsData([]);
        }
      } else {
        setSensorsData([]);
      }

      // const endTime = performance.now(); // Para debugging de performance

      return { formData, sortedData };

    } catch (error) {
      // Solo mostrar error si no fue cancelado
      if (!abortController.signal.aborted) {
        console.error('Error loading table data:', error);
        throw error;
      } else {
      }
    } finally {
      // Solo actualizar loading si todavía estamos cargando la misma tabla
      if (loadingTableRef.current === selectedTable) {
        setLoading(false);
        loadingTableRef.current = null; // Reset loading ref solo si terminamos correctamente
        abortControllerRef.current = null; // Reset abort controller
      }
    }
  }, []);

  return {
    // Estados de datos
    tableData,
    columns,
    tableColumns,
    loading,
    userData,
    paisesData,
    empresasData,
    fundosData,
    ubicacionesData,
    localizacionesData,
    entidadesData,
    nodosData,
    tiposData,
    metricasData,
    criticidadesData,
    perfilesData,
    umbralesData,
    sensorsData,
    metricasensorData,
    contactosData,
    correosData,
    
    // Funciones de carga
    loadUserData,
    loadRelatedTablesData,
    loadTableData,
    
    // Setters para compatibilidad
    setTableData,
    setColumns,
    setTableColumns,
    setLoading,
    setUserData,
    setPaisesData,
    setEmpresasData,
    setFundosData,
    setUbicacionesData,
    setLocalizacionesData,
    setEntidadesData,
    setNodosData,
    setTiposData,
    setMetricasData,
    setCriticidadesData,
    setPerfilesData,
    setUmbralesData,
    setSensorsData,
    setMetricasensorData,
    setContactosData,
    setCorreosData
  };
};
