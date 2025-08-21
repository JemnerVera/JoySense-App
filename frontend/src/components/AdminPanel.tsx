import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { JoySenseService } from '../services/backend-api';

interface AdminPanelProps {
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('pais');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState<any>({});
  const [records, setRecords] = useState<any[]>([]);

  // Verificar si el usuario es administrador
  if (!user || user.user_metadata?.rol !== 'admin') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-lg font-semibold text-red-600 mb-4">Acceso Denegado</h3>
          <p className="text-gray-600 mb-4">
            Solo los administradores pueden acceder al panel de administración.
          </p>
          <button
            onClick={onClose}
            className="w-full bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'pais', name: 'Países', fields: ['pais', 'paisabrev'] },
    { id: 'empresa', name: 'Empresas', fields: ['empresa', 'paisid'] },
    { id: 'fundo', name: 'Fundos', fields: ['fundo', 'empresaid'] },
    { id: 'nodo', name: 'Nodos', fields: ['nodo', 'descripcion'] },
    { id: 'tipo', name: 'Tipos', fields: ['tipo', 'descripcion'] },
    { id: 'entidad', name: 'Entidades', fields: ['entidad', 'descripcion'] },
    { id: 'metrica', name: 'Métricas', fields: ['metrica', 'unidad'] },
  ];

  const loadRecords = async () => {
    setIsLoading(true);
    try {
      let data: any[] = [];
      
      switch (activeTab) {
        case 'pais':
          data = await JoySenseService.getPaises();
          break;
        case 'empresa':
          data = await JoySenseService.getEmpresas();
          break;
        case 'fundo':
          data = await JoySenseService.getFundos();
          break;
        case 'nodo':
          data = await JoySenseService.getNodos();
          break;
        case 'tipo':
          data = await JoySenseService.getTipos();
          break;
        case 'entidad':
          data = await JoySenseService.getEntidades();
          break;
        case 'metrica':
          data = await JoySenseService.getMetricas();
          break;
      }
      
      setRecords(data);
    } catch (error) {
      console.error('Error loading records:', error);
      setMessage('Error al cargar registros');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');

    try {
      // Aquí implementarías la lógica para insertar/actualizar registros
      // Por ahora solo simulamos
      setMessage('Funcionalidad de inserción en desarrollo');
    } catch (error) {
      console.error('Error saving record:', error);
      setMessage('Error al guardar registro');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Panel de Administración</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Form */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Agregar Nuevo Registro</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {tabs.find(t => t.id === activeTab)?.fields.map((field) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.charAt(0).toUpperCase() + field.slice(1)}
                  </label>
                  <input
                    type="text"
                    value={formData[field] || ''}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              ))}
              
              {message && (
                <div className={`p-3 rounded-md ${
                  message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                }`}>
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isLoading ? 'Guardando...' : 'Guardar'}
              </button>
            </form>
          </div>

          {/* Records List */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Registros Existentes</h3>
            {isLoading ? (
              <div className="text-center py-4">Cargando...</div>
            ) : (
              <div className="bg-gray-50 rounded-md p-4 max-h-96 overflow-y-auto">
                {records.length === 0 ? (
                  <p className="text-gray-500 text-center">No hay registros</p>
                ) : (
                  <div className="space-y-2">
                    {records.map((record, index) => (
                      <div key={index} className="bg-white p-3 rounded border">
                        <div className="flex justify-between items-center">
                          <div>
                            {Object.entries(record).map(([key, value]) => (
                              <span key={key} className="text-sm text-gray-600 mr-4">
                                <strong>{key}:</strong> {String(value)}
                              </span>
                            ))}
                          </div>
                          <button className="text-red-600 hover:text-red-800 text-sm">
                            Eliminar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
