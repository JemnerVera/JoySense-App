import React from 'react';

interface WelcomeScreenProps {
  onContinue: () => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onContinue }) => {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center z-50 welcome-screen-enter">
      <div className="bg-white dark:bg-gray-800 bg-opacity-90 backdrop-blur-sm rounded-2xl p-8 max-w-2xl mx-4 border border-gray-300 dark:border-gray-700 shadow-2xl">
        <div className="text-center">
          {/* Logo o ícono */}
          <div className="text-6xl mb-6">🌾</div>
          
          {/* Título */}
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Bienvenido a JoySense
          </h1>
          
          {/* Subtítulo */}
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            Sistema de Monitoreo Inteligente para Agricultura
          </p>
          
          {/* Descripción */}
          <div className="text-gray-600 dark:text-gray-400 mb-8 space-y-3">
            <p>
              Accede a datos en tiempo real de tus cultivos y toma decisiones informadas
              para optimizar tu producción agrícola.
            </p>
            <p>
              Utiliza el menú lateral para navegar entre las diferentes secciones:
            </p>
          </div>
          
          {/* Características */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-4">
              <div className="text-2xl mb-2">📊</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Dashboard</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Visualiza datos y métricas</p>
            </div>
            <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-4">
              <div className="text-2xl mb-2">⚙️</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Parámetros</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Gestiona configuraciones</p>
            </div>
            <div className="bg-gray-200 dark:bg-gray-700 rounded-lg p-4">
              <div className="text-2xl mb-2">🔧</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Configuración</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">Ajusta preferencias</p>
            </div>
          </div>
          
          {/* Botón de continuar */}
          <button
            onClick={onContinue}
            className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            Comenzar →
          </button>
        </div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
