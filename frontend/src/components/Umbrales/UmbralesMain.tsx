import React, { useState, useEffect } from 'react';
import UmbralesPage from './UmbralesPage';
import EstadoActualSensores from './EstadoActualSensores';
import AlertasWithSidebar from './AlertasWithSidebar';
import DashboardUmbrales from './DashboardUmbrales';

interface UmbralesMainProps {
  activeTab?: string;
}

const UmbralesMain: React.FC<UmbralesMainProps> = ({ activeTab: initialTab = 'estado-actual' }) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);

  // Sincronizar con la prop externa
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const renderActiveComponent = () => {
    // Extraer la sub-pestaña del activeTab
    const subTab = activeTab.replace('umbrales-', '');
    
    switch (subTab) {
      case 'gestion':
        return <UmbralesPage />;
      case 'estado-actual':
        return <AlertasWithSidebar />;
      case 'dashboard':
        return <DashboardUmbrales />;
      default:
        return <EstadoActualSensores />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Contenido dinámico */}
        <div className="transition-all duration-300 ease-in-out">
          {renderActiveComponent()}
        </div>
      </div>
    </div>
  );
};

export default UmbralesMain;
