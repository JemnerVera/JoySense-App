import React, { useState } from 'react';
import { useUmbrales } from '../../hooks/useUmbrales';
import { useReferenceData } from '../../hooks/useReferenceData';
import MessageDisplay from './MessageDisplay';
import ConfirmationModal from './ConfirmationModal';

interface Umbral {
  umbralid: number;
  ubicacionid: number;
  criticidadid: number;
  nodoid: number;
  metricaid: number;
  umbral: string;
  maximo: number;
  minimo: number;
  tipoid: number;
  statusid: number;
  usercreatedid: number;
  datecreated: string;
  usermodifiedid?: number;
  datemodified?: string;
}

const UmbralesPage: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [editingUmbral, setEditingUmbral] = useState<Umbral | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    umbralid: number | null;
  }>({ isOpen: false, umbralid: null });

  // Usar hooks personalizados
  const { 
    umbrales, 
    loading: umbralesLoading, 
    error, 
    message,
    createUmbral, 
    updateUmbral, 
    deleteUmbral, 
    clearMessages 
  } = useUmbrales();

  const {
    nodos,
    metricas,
    tipos,
    criticidades,
    ubicaciones,
    fundos,
    empresas,
    loading: referenceDataLoading,
    error: referenceDataError,
    getNodoName,
    getMetricaName,
    getTipoName,
    getCriticidadName,
    getUbicacionName
  } = useReferenceData();
  
  const [formData, setFormData] = useState({
    ubicacionid: '',
    criticidadid: '',
    nodoid: '',
    metricaid: '',
    umbral: '',
    maximo: '',
    minimo: '',
    tipoid: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingUmbral) {
        // Actualizar umbral existente
        const success = await updateUmbral(editingUmbral.umbralid, formData);
        if (success) {
          resetForm();
          setShowForm(false);
        }
      } else {
        // Crear nuevo umbral
        const success = await createUmbral(formData);
        if (success) {
          resetForm();
          setShowForm(false);
        }
      }
    } catch (error) {
      console.error('Error guardando umbral:', error);
    }
  };

  const handleEdit = (umbral: Umbral) => {
    setEditingUmbral(umbral);
    setFormData({
      ubicacionid: umbral.ubicacionid.toString(),
      criticidadid: umbral.criticidadid.toString(),
      nodoid: umbral.nodoid.toString(),
      metricaid: umbral.metricaid.toString(),
      umbral: umbral.umbral,
      maximo: umbral.maximo.toString(),
      minimo: umbral.minimo.toString(),
      tipoid: umbral.tipoid.toString()
    });
    setShowForm(true);
  };

  const handleDelete = async (umbralid: number) => {
    setDeleteConfirmation({ isOpen: true, umbralid });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation.umbralid) return;
    
    try {
      await deleteUmbral(deleteConfirmation.umbralid);
    } catch (error) {
      console.error('Error eliminando umbral:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      ubicacionid: '',
      criticidadid: '',
      nodoid: '',
      metricaid: '',
      umbral: '',
      maximo: '',
      minimo: '',
      tipoid: ''
    });
    setEditingUmbral(null);
  };

  // Las funciones helper ahora vienen del hook useReferenceData

  if (referenceDataLoading || umbralesLoading) {
    return (
      <div className="flex justify-center items-center h-64 bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-900 min-h-screen">
      {/* Mostrar mensajes de éxito y error */}
      <MessageDisplay 
        message={message} 
        error={error || referenceDataError} 
        onClear={clearMessages} 
      />
      
      {/* Mensajes de estado de datos de referencia */}
      {referenceDataLoading && (
        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-700 text-sm">
            🔄 Cargando datos de referencia... Por favor espera mientras se cargan los nodos, métricas y ubicaciones.
          </p>
        </div>
      )}
      {!referenceDataLoading && referenceDataError && (
        <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-700 text-sm">
            ❌ Error cargando datos de referencia: {referenceDataError}
          </p>
        </div>
      )}
      {!referenceDataLoading && !referenceDataError && (!Array.isArray(nodos) || nodos.length === 0) && (
        <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-700 text-sm">
            ⚠️ No hay datos de referencia disponibles. Verifica que las tablas nodo, metrica, tipo, criticidad, ubicacion, fundo y empresa tengan datos.
          </p>
        </div>
      )}

      {/* Botón para crear nuevo umbral */}
      <div className="mb-6">
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          disabled={referenceDataLoading || !Array.isArray(nodos) || nodos.length === 0}
          className={`font-medium py-2 px-4 rounded-lg transition-colors ${
            referenceDataLoading || !Array.isArray(nodos) || nodos.length === 0
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700 text-white'
          }`}
        >
          {referenceDataLoading ? 'Cargando...' : showForm ? 'Cancelar' : 'Crear Nuevo Umbral'}
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <>
          {referenceDataLoading ? (
            <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-8">
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mr-3"></div>
                <p className="text-gray-300">Cargando formulario...</p>
              </div>
            </div>
          ) : !Array.isArray(nodos) || nodos.length === 0 ? (
            <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-8">
              <div className="text-center py-8">
                <p className="text-gray-300 mb-2">No se pueden mostrar los formularios</p>
                <p className="text-sm text-gray-400">Los datos de referencia no están disponibles</p>
              </div>
            </div>
          ) : (
        <div className="bg-gray-800 rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-white">
            {editingUmbral ? 'Editar Umbral' : 'Crear Nuevo Umbral'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {/* Nombre del umbral */}
               <div>
                 <label className="block text-sm font-medium text-gray-300 mb-1">
                   Nombre del Umbral *
                 </label>
                 <input
                   type="text"
                   value={formData.umbral}
                   onChange={(e) => setFormData({...formData, umbral: e.target.value})}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-700 text-white"
                   required
                 />
               </div>

                             {/* Ubicación */}
               <div>
                 <label className="block text-sm font-medium text-gray-300 mb-1">
                   Ubicación *
                 </label>
                 <select
                   value={formData.ubicacionid}
                   onChange={(e) => setFormData({...formData, ubicacionid: e.target.value})}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-700 text-white"
                   required
                 >
                                     <option value="">Seleccionar ubicación</option>
                   {Array.isArray(ubicaciones) && ubicaciones.map(ubicacion => {
                     const fundo = Array.isArray(fundos) ? fundos.find(f => f.fundoid === ubicacion.fundoid) : null;
                     const empresa = fundo && Array.isArray(empresas) ? empresas.find(e => e.empresaid === fundo.empresaid) : null;
                     const displayName = empresa && fundo 
                       ? `${empresa.empresa} - ${fundo.fundo} - ${ubicacion.ubicacion}`
                       : ubicacion.ubicacion;
                     
                     return (
                       <option key={ubicacion.ubicacionid} value={ubicacion.ubicacionid}>
                         {displayName}
                       </option>
                     );
                   })}
                </select>
              </div>

                             {/* Nodo */}
               <div>
                 <label className="block text-sm font-medium text-gray-300 mb-1">
                   Nodo *
                 </label>
                 <select
                   value={formData.nodoid}
                   onChange={(e) => setFormData({...formData, nodoid: e.target.value})}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-700 text-white"
                   required
                 >
                                     <option value="">Seleccionar nodo</option>
                   {Array.isArray(nodos) && nodos.map(nodo => (
                     <option key={nodo.nodoid} value={nodo.nodoid}>
                       {nodo.nodo}
                     </option>
                   ))}
                </select>
              </div>

                             {/* Métrica */}
               <div>
                 <label className="block text-sm font-medium text-gray-300 mb-1">
                   Métrica *
                 </label>
                 <select
                   value={formData.metricaid}
                   onChange={(e) => setFormData({...formData, metricaid: e.target.value})}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-700 text-white"
                   required
                 >
                                     <option value="">Seleccionar métrica</option>
                   {Array.isArray(metricas) && metricas.map(metrica => (
                     <option key={metrica.metricaid} value={metrica.metricaid}>
                       {metrica.metrica}
                     </option>
                   ))}
                </select>
              </div>

                             {/* Tipo de sensor */}
               <div>
                 <label className="block text-sm font-medium text-gray-300 mb-1">
                   Tipo de Sensor *
                 </label>
                 <select
                   value={formData.tipoid}
                   onChange={(e) => setFormData({...formData, tipoid: e.target.value})}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-700 text-white"
                   required
                 >
                                     <option value="">Seleccionar tipo</option>
                   {Array.isArray(tipos) && tipos.map(tipo => (
                     <option key={tipo.tipoid} value={tipo.tipoid}>
                       {tipo.tipo}
                     </option>
                   ))}
                </select>
              </div>

                             {/* Criticidad */}
               <div>
                 <label className="block text-sm font-medium text-gray-300 mb-1">
                   Nivel de Criticidad *
                 </label>
                 <select
                   value={formData.criticidadid}
                   onChange={(e) => setFormData({...formData, criticidadid: e.target.value})}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-700 text-white"
                   required
                 >
                                     <option value="">Seleccionar criticidad</option>
                   {Array.isArray(criticidades) && criticidades.map(criticidad => (
                     <option key={criticidad.criticidadid} value={criticidad.criticidadid}>
                       {criticidad.criticidad} ({criticidad.criticidadbrev})
                     </option>
                   ))}
                </select>
              </div>

                             {/* Valor mínimo */}
               <div>
                 <label className="block text-sm font-medium text-gray-300 mb-1">
                   Valor Mínimo *
                 </label>
                 <input
                   type="number"
                   step="0.01"
                   value={formData.minimo}
                   onChange={(e) => setFormData({...formData, minimo: e.target.value})}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-700 text-white"
                   required
                 />
               </div>

                             {/* Valor máximo */}
               <div>
                 <label className="block text-sm font-medium text-gray-300 mb-1">
                   Valor Máximo *
                 </label>
                 <input
                   type="number"
                   step="0.01"
                   value={formData.maximo}
                   onChange={(e) => setFormData({...formData, maximo: e.target.value})}
                   className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-700 text-white"
                   required
                 />
               </div>
            </div>

            {/* Botones del formulario */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
                             <button
                 type="submit"
                 className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
               >
                 {editingUmbral ? 'Actualizar' : 'Crear'} Umbral
               </button>
            </div>
          </form>
        </div>
          )}
        </>
      )}

             {/* Tabla de umbrales */}
       <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden">
                 <div className="px-6 py-4 border-b border-gray-600">
                      <h3 className="text-lg font-medium text-white">
             Umbrales Configurados ({Array.isArray(umbrales) ? umbrales.length : 0})
           </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
                                      <thead className="bg-gray-700">
               <tr>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                   Umbral
                 </th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                   Ubicación
                 </th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   Nodo
                 </th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   Métrica
                 </th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   Tipo
                 </th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   Límites
                 </th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   Criticidad
                 </th>
                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                   Acciones
                 </th>
               </tr>
             </thead>
                         <tbody className="bg-gray-800 divide-y divide-gray-600">
               {Array.isArray(umbrales) && umbrales.map((umbral) => (
                 <tr key={umbral.umbralid} className="hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                                         <div className="text-sm font-medium text-white">
                       {umbral.umbral}
                     </div>
                  </td>
                                     <td className="px-6 py-4 whitespace-nowrap">
                     <div className="text-sm text-white">
                       {getUbicacionName(umbral.ubicacionid)}
                     </div>
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap">
                     <div className="text-sm text-white">
                       {getNodoName(umbral.nodoid)}
                     </div>
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap">
                     <div className="text-sm text-white">
                       {getMetricaName(umbral.metricaid)}
                     </div>
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap">
                     <div className="text-sm text-white">
                       {getTipoName(umbral.tipoid)}
                     </div>
                   </td>
                                     <td className="px-6 py-4 whitespace-nowrap">
                     <div className="text-sm text-white">
                       <span className="text-red-400 font-medium">
                         {umbral.minimo} - {umbral.maximo}
                       </span>
                     </div>
                   </td>
                   <td className="px-6 py-4 whitespace-nowrap">
                     <div className="text-sm text-white">
                       <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                         umbral.criticidadid === 1 ? 'bg-green-100 text-green-800' :
                         umbral.criticidadid === 2 ? 'bg-yellow-100 text-yellow-800' :
                         umbral.criticidadid === 3 ? 'bg-orange-100 text-orange-800' :
                         'bg-red-100 text-red-800'
                       }`}>
                         {getCriticidadName(umbral.criticidadid)}
                       </span>
                     </div>
                   </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(umbral)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(umbral.umbralid)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
                     {(!Array.isArray(umbrales) || umbrales.length === 0) && (
             <div className="text-center py-8">
               <p className="text-gray-300">
                 {!Array.isArray(umbrales) ? 'Cargando umbrales...' : 'No hay umbrales configurados'}
               </p>
               <p className="text-sm text-gray-400 mt-1">
                 {!Array.isArray(umbrales) ? 'Espera mientras se cargan los datos...' : 'Crea el primer umbral para comenzar a recibir alertas automáticas'}
               </p>
             </div>
           )}
        </div>
      </div>

      {/* Modal de confirmación para eliminar */}
      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, umbralid: null })}
        onConfirm={confirmDelete}
        title="Confirmar Eliminación"
        message="¿Estás seguro de que quieres eliminar este umbral? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
      />
    </div>
  );
};

export default UmbralesPage;
