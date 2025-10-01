// ============================================================================
// IMPORTS
// ============================================================================

import React, { useState, useEffect, useCallback, memo } from 'react';
import { JoySenseService } from '../services/backend-api';
import { Pais, Empresa, Fundo, Ubicacion } from '../types';
import SeparateCharts from './DashboardCharts';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Funciones helper para obtener nombres y unidades de métricas
const getMetricaName = (metricaid: number, metricas: any[]) => {
  const metrica = metricas.find(m => m.metricaid === metricaid);
  return metrica ? metrica.metrica : `Métrica ${metricaid}`;
};

const getMetricaUnidad = (metricaid: number, metricas: any[]) => {
  const metrica = metricas.find(m => m.metricaid === metricaid);
  return metrica ? metrica.unidad : '';
};

const getNodoName = (nodoid: number, nodos: any[]) => {
  const nodo = nodos.find(n => n.nodoid === nodoid);
  return nodo ? nodo.nodo : `Nodo ${nodoid}`;
};

const getTipoName = (tipoid: number, tipos: any[]) => {
  const tipo = tipos.find(t => t.tipoid === tipoid);
  return tipo ? tipo.tipo : `Tipo ${tipoid}`;
};

// ============================================================================
// COMPONENTS
// ============================================================================

// Componente de estadísticas para la vista dinámica
const DynamicStats: React.FC<{ mediciones: any[]; metricas: any[]; nodos: any[]; tipos: any[] }> = ({ mediciones, metricas, nodos, tipos }) => {
  const totalMediciones = mediciones.length;
  const ultimaMedicion = mediciones.length > 0 ? mediciones[0]?.fecha : null;
  const sensoresActivos = mediciones.length > 0 ? new Set(mediciones.map(m => m.nodoid)).size : 0;

  // Agrupar por tipo de métrica
  const medicionesPorTipo = mediciones.reduce((acc, m) => {
    const tipo = getMetricaName(m.metricaid, metricas);
    if (!acc[tipo]) {
      acc[tipo] = [];
    }
    acc[tipo].push(m);
    return acc;
  }, {} as Record<string, any[]>);

  const estadisticasPorTipo = Object.entries(medicionesPorTipo).map(([tipo, meds]) => ({
    tipo,
    cantidad: (meds as any[]).length,
    promedio: (meds as any[]).reduce((sum: number, m: any) => sum + m.medicion, 0) / (meds as any[]).length,
    unidad: getMetricaUnidad((meds as any[])[0]?.metricaid, metricas)
  }));

  return (
    <div className="space-y-4 mb-6">
      {/* Estadísticas generales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-sm font-medium text-gray-500">Total de Mediciones</div>
          <div className="text-2xl font-bold text-gray-900">{totalMediciones.toLocaleString()}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-sm font-medium text-gray-500">Última Medición</div>
          <div className="text-2xl font-bold text-gray-900">
            {ultimaMedicion ? new Date(ultimaMedicion).toLocaleDateString('es-ES') : 'N/A'}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="text-sm font-medium text-gray-500">Sensores Activos</div>
          <div className="text-2xl font-bold text-gray-900">{sensoresActivos}</div>
        </div>
      </div>

      {/* Estadísticas por tipo de métrica */}
      {estadisticasPorTipo.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Estadísticas por Tipo de Medición</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {estadisticasPorTipo.map((stat, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-3">
                <div className="text-sm font-medium text-gray-500">{stat.tipo}</div>
                <div className="text-lg font-bold text-gray-900">
                  {stat.promedio.toFixed(2)} {stat.unidad}
                </div>
                <div className="text-xs text-gray-500">{stat.cantidad} mediciones</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// INTERFACES
// ============================================================================

interface DynamicHierarchyProps {}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const DynamicHierarchy: React.FC<DynamicHierarchyProps> = memo(() => {

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [paises, setPaises] = useState<Pais[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [fundos, setFundos] = useState<Fundo[]>([]);
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [mediciones, setMediciones] = useState<any[]>([]);
  const [metricas, setMetricas] = useState<any[]>([]);
  const [nodos, setNodos] = useState<any[]>([]);
  const [tipos, setTipos] = useState<any[]>([]);
  const [entidades, setEntidades] = useState<any[]>([]);
  
  const [selectedPais, setSelectedPais] = useState<Pais | null>(null);
  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null);
  const [selectedFundo, setSelectedFundo] = useState<Fundo | null>(null);
  const [selectedUbicacion, setSelectedUbicacion] = useState<Ubicacion | null>(null);
  const [selectedEntidad, setSelectedEntidad] = useState<any>(null);
  
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentStep, setCurrentStep] = useState<'pais' | 'empresa' | 'fundo' | 'ubicacion' | 'results'>('pais');

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Cargar países y métricas al inicio
  useEffect(() => {
    loadPaises();
    loadMetricas();
    loadNodos();
    loadTipos();
    loadEntidades();
  }, []);


  // ============================================================================
  // DATA LOADING FUNCTIONS
  // ============================================================================

  const loadPaises = async () => {
    try {
      setLoading(true);
      const data = await JoySenseService.getPaises();
      setPaises(data);
    } catch (error) {
      console.error('Error loading paises:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMetricas = async () => {
    try {
      const data = await JoySenseService.getMetricas();
      setMetricas(data);
    } catch (error) {
      console.error('Error loading metricas:', error);
    }
  };

  const loadNodos = async () => {
    try {
      const data = await JoySenseService.getNodos();
      setNodos(data);
    } catch (error) {
      console.error('Error loading nodos:', error);
    }
  };

  const loadTipos = async () => {
    try {
      const data = await JoySenseService.getTipos();
      setTipos(data);
    } catch (error) {
      console.error('Error loading tipos:', error);
    }
  };

  const loadEntidades = async (ubicacionId?: number) => {
    try {
      const data = await JoySenseService.getEntidades(ubicacionId);
      setEntidades(data);
    } catch (error) {
      console.error('Error loading entidades:', error);
    }
  };

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handlePaisSelect = async (pais: Pais) => {
    setSelectedPais(pais);
    setSelectedEmpresa(null);
    setSelectedFundo(null);
    setSelectedUbicacion(null);
    setEmpresas([]);
    setFundos([]);
    setUbicaciones([]);
    setMediciones([]);
    setCurrentStep('empresa');

    try {
      setLoading(true);
      const data = await JoySenseService.getEmpresasByPais(pais.paisid);
      setEmpresas(data);
    } catch (error) {
      console.error('Error loading empresas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmpresaSelect = async (empresa: Empresa) => {
    setSelectedEmpresa(empresa);
    setSelectedFundo(null);
    setSelectedUbicacion(null);
    setFundos([]);
    setUbicaciones([]);
    setMediciones([]);
    setCurrentStep('fundo');

    try {
      setLoading(true);
      const data = await JoySenseService.getFundosByEmpresa(empresa.empresaid);
      setFundos(data);
    } catch (error) {
      console.error('Error loading fundos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFundoSelect = async (fundo: Fundo) => {
    setSelectedFundo(fundo);
    setSelectedUbicacion(null);
    setUbicaciones([]);
    setMediciones([]);
    setCurrentStep('ubicacion');

    try {
      setLoading(true);
      const data = await JoySenseService.getUbicacionesByFundo(fundo.fundoid);
      setUbicaciones(data);
    } catch (error) {
      console.error('Error loading ubicaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUbicacionSelect = async (ubicacion: Ubicacion) => {
    setSelectedUbicacion(ubicacion);
    setCurrentStep('results');
    // Cargar entidades específicas de esta ubicación
    await loadEntidades(ubicacion.ubicacionid);
    await loadMediciones(ubicacion.ubicacionid);
  };

  const loadMediciones = async (ubicacionId: number) => {
    try {
      setLoading(true);
      // Carga inicial rápida: solo 100 mediciones
      const data = await JoySenseService.getMediciones({
        ubicacionId,
        entidadId: selectedEntidad?.entidadid,
        limit: 100 // Carga rápida inicial
      });
      // Verificar que data sea un array
      if (Array.isArray(data)) {
      setMediciones(data);
      } else {
        setMediciones([]);
      }

      // Obtener el conteo total para mostrar cuántas hay disponibles
      try {
        const countData = await JoySenseService.getMediciones({
          ubicacionId,
          entidadId: selectedEntidad?.entidadid,
          countOnly: true
        });
        if (!Array.isArray(countData) && countData.count !== undefined) {
          setTotalCount(countData.count);
        }
      } catch (countError) {
        console.error('Error getting count:', countError);
        setTotalCount(0);
      }
    } catch (error) {
      console.error('Error loading mediciones:', error);
        setMediciones([]);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreMediciones = async () => {
    if (!selectedUbicacion) return;
    
    try {
      setLoadingMore(true);
      const data = await JoySenseService.getMediciones({
        ubicacionId: selectedUbicacion.ubicacionid,
        startDate,
        endDate,
        entidadId: selectedEntidad?.entidadid,
        getAll: true // Cargar todas las mediciones
      });
      // Verificar que data sea un array
      if (Array.isArray(data)) {
        setMediciones(data);
      }
    } catch (error) {
      console.error('Error loading more mediciones:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleDateFilter = useCallback(async () => {
    if (!selectedUbicacion) return;
    
    try {
      setLoading(true);
      
      // Obtener datos filtrados
      const data = await JoySenseService.getMediciones({
        ubicacionId: selectedUbicacion.ubicacionid,
        startDate,
        endDate,
        entidadId: selectedEntidad?.entidadid,
        limit: 100 // Carga rápida con filtros
      });
      
      // Verificar que data sea un array
      if (Array.isArray(data)) {
      setMediciones(data);
      } else {
        setMediciones([]);
      }
      
      // Obtener el conteo actualizado con los filtros
      try {
        const countData = await JoySenseService.getMediciones({
          ubicacionId: selectedUbicacion.ubicacionid,
          startDate,
          endDate,
          entidadId: selectedEntidad?.entidadid,
          countOnly: true
        });
        if (!Array.isArray(countData) && countData.count !== undefined) {
          setTotalCount(countData.count);
        }
      } catch (countError) {
        console.error('Error getting updated count:', countError);
      }
    } catch (error) {
      console.error('Error filtering by date:', error);
        setMediciones([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [selectedUbicacion, startDate, endDate, selectedEntidad]);

  // Efecto para actualizar mediciones cuando cambia la entidad seleccionada
  useEffect(() => {
    if (selectedUbicacion && (selectedEntidad || startDate || endDate)) {
      handleDateFilter();
    }
  }, [selectedEntidad, selectedUbicacion, startDate, endDate, handleDateFilter]);

  const resetSelection = () => {
    setSelectedPais(null);
    setSelectedEmpresa(null);
    setSelectedFundo(null);
    setSelectedUbicacion(null);
    setSelectedEntidad(null);
    setEmpresas([]);
    setFundos([]);
    setUbicaciones([]);
    setMediciones([]);
    setStartDate('');
    setEndDate('');
    setCurrentStep('pais');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'pais':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Selecciona un País</h2>
              <p className="text-gray-600">Elige el país para comenzar</p>
            </div>
            <div className="grid gap-3">
              {paises.map((pais) => (
                <button
                  key={pais.paisid}
                  onClick={() => handlePaisSelect(pais)}
                  className="p-4 bg-white rounded-xl shadow-sm border-2 border-gray-100 hover:border-blue-300 hover:shadow-md transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{pais.pais}</h3>
                      <p className="text-sm text-gray-500">{pais.paisabrev}</p>
                    </div>
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 'empresa':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Selecciona una Empresa</h2>
              <p className="text-gray-600">País: {selectedPais?.pais}</p>
            </div>
            <div className="grid gap-3">
              {empresas.map((empresa) => (
                <button
                  key={empresa.empresaid}
                  onClick={() => handleEmpresaSelect(empresa)}
                  className="p-4 bg-white rounded-xl shadow-sm border-2 border-gray-100 hover:border-blue-300 hover:shadow-md transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{empresa.empresa}</h3>
                      <p className="text-sm text-gray-500">{empresa.empresabrev}</p>
                    </div>
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 'fundo':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Selecciona un Fundo</h2>
              <p className="text-gray-600">{selectedPais?.pais} → {selectedEmpresa?.empresa}</p>
            </div>
            <div className="grid gap-3">
              {fundos.map((fundo) => (
                <button
                  key={fundo.fundoid}
                  onClick={() => handleFundoSelect(fundo)}
                  className="p-4 bg-white rounded-xl shadow-sm border-2 border-gray-100 hover:border-blue-300 hover:shadow-md transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{fundo.fundo}</h3>
                      <p className="text-sm text-gray-500">Fundo ID: {fundo.fundoid}</p>
                    </div>
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 'ubicacion':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Selecciona una Ubicación</h2>
              <p className="text-gray-600">{selectedPais?.pais} → {selectedEmpresa?.empresa} → {selectedFundo?.fundo}</p>
            </div>
            <div className="grid gap-3">
              {ubicaciones.map((ubicacion) => (
                <button
                  key={ubicacion.ubicacionid}
                  onClick={() => handleUbicacionSelect(ubicacion)}
                  className="p-4 bg-white rounded-xl shadow-sm border-2 border-gray-100 hover:border-blue-300 hover:shadow-md transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{ubicacion.ubicacion}</h3>
                                             <p className="text-sm text-gray-500">
                         ID: {ubicacion.ubicacionid}
                       </p>
                    </div>
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 'results':
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Resultados de Mediciones</h2>
              <p className="text-gray-600">
                {selectedPais?.pais} → {selectedEmpresa?.empresa} → {selectedFundo?.fundo} → {selectedUbicacion?.ubicacion}
              </p>
            </div>

            {/* Estadísticas */}
            <DynamicStats mediciones={mediciones} metricas={metricas} nodos={nodos} tipos={tipos} />

            {/* Filtros */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Filtros</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Entidad</label>
                  <select
                    value={selectedEntidad?.entidadid || ''}
                    onChange={(e) => {
                      const entidadId = e.target.value ? parseInt(e.target.value) : null;
                      const entidad = entidades.find(ent => ent.entidadid === entidadId);
                      setSelectedEntidad(entidad || null);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Todas las entidades</option>
                    {entidades.map((entidad) => (
                      <option key={entidad.entidadid} value={entidad.entidadid}>
                        {entidad.entidad}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Inicio</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Fecha Fin</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex items-end space-x-2">
                  <button
                    onClick={handleDateFilter}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Filtrar
                  </button>
                  <button
                    onClick={() => {
                      setStartDate('');
                      setEndDate('');
                      setSelectedEntidad(null);
                      if (selectedUbicacion) {
                        loadMediciones(selectedUbicacion.ubicacionid);
                      }
                    }}
                    className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    Limpiar
                  </button>
                </div>
              </div>
            </div>

            {/* Resultados */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-4">
                 <div>
                   <h3 className="text-lg font-semibold text-gray-900">
                     Mediciones ({mediciones.length.toLocaleString()})
                     {totalCount > 0 && totalCount > mediciones.length && (
                       <span className="text-sm text-gray-500 ml-2">
                         de {totalCount.toLocaleString()} disponibles
                       </span>
                     )}
                   </h3>
                 </div>
                 <div className="flex items-center space-x-2">
                   {totalCount > 0 && totalCount > mediciones.length && (
                     <button
                       onClick={loadMoreMediciones}
                       disabled={loadingMore}
                       className="text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-3 py-1 rounded-lg flex items-center space-x-1"
                     >
                       {loadingMore ? (
                         <>
                           <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
                           <span>Cargando...</span>
                         </>
                       ) : (
                         <>
                           <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                           </svg>
                           <span>Cargar Todas</span>
                         </>
                       )}
                     </button>
                   )}
                <button
                  onClick={resetSelection}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>Reiniciar</span>
                </button>
                 </div>
              </div>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Cargando mediciones...</p>
                </div>
              ) : mediciones.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p>No se encontraron mediciones</p>
                </div>
              ) : (
                                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {(() => {
                    // Agrupar mediciones por fecha (solo día, ignorando hora)
                    const medicionesPorFecha = mediciones.reduce((acc, medicion) => {
                      const fecha = new Date(medicion.fecha).toLocaleDateString('es-ES');
                      if (!acc[fecha]) {
                        acc[fecha] = [];
                      }
                      acc[fecha].push(medicion);
                      return acc;
                    }, {} as Record<string, any[]>);

                    // Ordenar fechas de más reciente a más antigua
                    const fechasOrdenadas = Object.keys(medicionesPorFecha).sort((a, b) => 
                      new Date(b.split('/').reverse().join('-')).getTime() - 
                      new Date(a.split('/').reverse().join('-')).getTime()
                    );

                    return fechasOrdenadas.map((fecha) => {
                      // Agrupar mediciones del día por envío (misma fecha, hora, nodo y tipo)
                      const medicionesDelDia = medicionesPorFecha[fecha];
                      const enviosPorHora = medicionesDelDia.reduce((acc: Record<string, { hora: string; nodo: number; tipo: number; mediciones: any[] }>, medicion: any) => {
                        const fechaHora = new Date(medicion.fecha);
                        const hora = fechaHora.toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                        const nodo = medicion.nodoid;
                        const tipo = medicion.tipoid;
                        
                        // Crear clave única para cada envío
                        const claveEnvio = `${hora}-${nodo}-${tipo}`;
                        
                        if (!acc[claveEnvio]) {
                          acc[claveEnvio] = {
                            hora,
                            nodo,
                            tipo,
                            mediciones: []
                          };
                        }
                        acc[claveEnvio].mediciones.push(medicion);
                        return acc;
                      }, {} as Record<string, { hora: string; nodo: number; tipo: number; mediciones: any[] }>);

                      // Ordenar envíos por hora (más reciente primero)
                      const enviosOrdenados = Object.values(enviosPorHora).sort((a, b) => {
                        const horaA = new Date(`2000-01-01 ${(a as any).hora}`).getTime();
                        const horaB = new Date(`2000-01-01 ${(b as any).hora}`).getTime();
                        return horaB - horaA;
                      });

                      return (
                        <div key={fecha} className="border border-gray-200 rounded-lg overflow-hidden">
                          {/* Encabezado de fecha */}
                          <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                            <h4 className="font-semibold text-gray-900">{fecha}</h4>
                            <p className="text-sm text-gray-500">
                              {medicionesDelDia.length} medición{medicionesDelDia.length !== 1 ? 'es' : ''}
                            </p>
                          </div>
                          
                          {/* Envíos del día */}
                          <div className="space-y-3 p-4">
                            {enviosOrdenados.map((envio: any, envioIndex) => (
                              <div key={`${fecha}-${envioIndex}`} className="border border-gray-200 rounded-lg overflow-hidden">
                                {/* Encabezado del envío */}
                                <div className="bg-blue-50 px-3 py-2 border-b border-gray-200">
                                  <div className="flex items-center justify-between">
                                                                         <span className="text-sm font-medium text-gray-700">
                                       {envio.hora} - {getNodoName(envio.nodo, nodos)} | {getTipoName(envio.tipo, tipos)}
                                     </span>
                                    <span className="text-xs text-gray-500">
                                      {envio.mediciones.length} medición{envio.mediciones.length !== 1 ? 'es' : ''}
                                    </span>
                                  </div>
                                </div>
                                
                                {/* Mediciones del envío */}
                                <div className="space-y-2 p-3">
                                  {envio.mediciones.map((medicion: any, index: number) => (
                                    <div key={`${fecha}-${envioIndex}-${index}`} className="border border-gray-100 rounded-lg p-3 bg-white">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                                     <span className="font-medium text-gray-900">
                             {getMetricaName(medicion.metricaid, metricas)}
                           </span>
                        </div>
                      </div>
                                      <div className="text-xl font-bold text-gray-900">
                         {medicion.medicion} {getMetricaUnidad(medicion.metricaid, metricas)}
                       </div>
                                    </div>
                                  ))}
                      </div>
                    </div>
                  ))}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>

            {/* Gráfico */}
            <SeparateCharts mediciones={mediciones} loading={loading} />
          </div>
        );

      default:
        return null;
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Header con botón de reiniciar prominente */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <button
            onClick={resetSelection}
            className="hover:text-blue-600 transition-colors"
          >
            Inicio
          </button>
          {selectedPais && (
            <>
              <span>→</span>
              <span className="text-gray-900">{selectedPais.pais}</span>
            </>
          )}
          {selectedEmpresa && (
            <>
              <span>→</span>
              <span className="text-gray-900">{selectedEmpresa.empresa}</span>
            </>
          )}
          {selectedFundo && (
            <>
              <span>→</span>
              <span className="text-gray-900">
                {selectedFundo.fundo}
                {selectedFundo.medicionesCount !== undefined && (
                  <span className="ml-1 text-blue-600">
                    ({selectedFundo.medicionesCount.toLocaleString()})
                  </span>
                )}
              </span>
            </>
          )}
          {selectedUbicacion && (
            <>
              <span>→</span>
              <span className="text-gray-900">
                {selectedUbicacion.ubicacion}
                                 {/* Temporalmente comentado hasta arreglar JOINs */}
                 {/* {selectedUbicacion.localizacion?.entidad?.entidad && (
                   <span className="ml-1 text-blue-600">
                     ({selectedUbicacion.localizacion.entidad.entidad})
                   </span>
                 )} */}
              </span>
            </>
          )}
        </div>
        
        {/* Botón de reiniciar prominente */}
        <button
          onClick={resetSelection}
          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Reiniciar Todo</span>
        </button>
      </div>

      {/* Contenido dinámico */}
      {renderStep()}
    </div>
  );
});

DynamicHierarchy.displayName = 'DynamicHierarchy';

export default DynamicHierarchy;
