import React from 'react';

interface UmbralesNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const UmbralesNavigation: React.FC<UmbralesNavigationProps> = ({ 
  activeTab, 
  onTabChange 
}) => {
  const tabs = [
    {
      id: 'estado-actual',
      label: 'Registro de Alertas',
      icon: '📊',
      description: 'Estado actual de todos los sensores por criticidad'
    },
    {
      id: 'dashboard',
      label: 'Dashboard de Alertas',
      icon: '📈',
      description: 'Gráficos históricos y análisis temporal'
    },
    {
      id: 'mensajes',
      label: 'Mensajes de Alerta',
      icon: '📨',
      description: 'Mensajes enviados por WhatsApp, SMS y Email'
    },
    {
      id: 'umbrales',
      label: 'Gestión de Umbrales',
      icon: '⚠️',
      description: 'Configurar y gestionar umbrales de alerta'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md mb-6">
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                ${activeTab === tab.id
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-red-300'
                }
              `}
            >
              <div className="flex items-center space-x-2">
                <span className="text-lg">{tab.icon}</span>
                <div className="text-left">
                  <div className="font-medium">{tab.label}</div>
                  <div className="text-xs text-gray-400 hidden md:block">
                    {tab.description}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default UmbralesNavigation;
