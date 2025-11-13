import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface UserControlsProps {
  activeTab?: string;
}

export const UserControls: React.FC<UserControlsProps> = ({ activeTab }) => {
  const { user, signOut } = useAuth();
  const { theme, resolvedTheme, toggleTheme } = useTheme();
  
  const { t } = useLanguage();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Determinar colores según la pestaña activa
  const getThemeColors = () => {
    if (activeTab === 'parameters' || activeTab?.startsWith('parameters-')) {
      return {
        gradient: 'from-orange-500 to-orange-600',
        hoverGradient: 'hover:from-orange-600 hover:to-orange-700',
        border: 'border-orange-400',
        text: 'text-orange-500',
        focusRing: 'focus:ring-orange-500',
        focusBorder: 'focus:border-orange-500'
      };
    } else if (activeTab === 'umbrales' || activeTab?.startsWith('umbrales-')) {
      return {
        gradient: 'from-blue-500 to-blue-600',
        hoverGradient: 'hover:from-blue-600 hover:to-blue-700',
        border: 'border-blue-400',
        text: 'text-blue-500',
        focusRing: 'focus:ring-blue-500',
        focusBorder: 'focus:border-blue-500'
      };
    } else {
      // Reportes/Dashboard - verde por defecto
      return {
        gradient: 'from-green-500 to-green-600',
        hoverGradient: 'hover:from-green-600 hover:to-green-700',
        border: 'border-green-400',
        text: 'text-green-500',
        focusRing: 'focus:ring-green-500',
        focusBorder: 'focus:border-green-500'
      };
    }
  };

  const colors = getThemeColors();

  // Cerrar dropdown cuando se hace click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <div className="flex items-center space-x-3">
      {/* Indicador de tema actual (temporal para debug) */}
      <div className="text-xs text-gray-600 dark:text-neutral-400 font-mono">
        {resolvedTheme}
      </div>
      
      {/* Botón de cambio de tema */}
      <button
        onClick={toggleTheme}
        className="w-10 h-10 bg-gray-200 dark:bg-neutral-800 hover:bg-gray-300 dark:hover:bg-neutral-700 rounded-full flex items-center justify-center transition-all duration-200 border border-gray-300 dark:border-neutral-600 shadow-lg hover:shadow-xl hover:scale-105"
        aria-label={`Cambiar a modo ${resolvedTheme === 'dark' ? 'claro' : 'oscuro'}`}
      >
        {resolvedTheme === 'dark' ? (
          // Icono de sol para modo claro
          <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ) : (
          // Icono de luna para modo oscuro
          <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        )}
      </button>
      
      {/* Icono de usuario con dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={toggleDropdown}
          className={`w-10 h-10 bg-gradient-to-br ${colors.gradient} ${colors.hoverGradient} rounded-full flex items-center justify-center transition-all duration-200 border ${colors.border} shadow-lg hover:shadow-xl hover:scale-105`}
          aria-label="Menú de usuario"
        >
          <span className="text-white text-sm font-bold">
            {user?.email?.charAt(0).toUpperCase()}
          </span>
        </button>

        {/* Dropdown del usuario */}
        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-neutral-900 border border-neutral-700 rounded-lg shadow-2xl z-50 backdrop-blur-sm animate-in slide-in-from-top-2 duration-200">
            <div className="p-4 border-b border-neutral-700">
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 bg-gradient-to-br ${colors.gradient} rounded-full flex items-center justify-center`}>
                  <span className="text-white text-sm font-bold font-mono">
                    {user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-white text-sm font-medium truncate font-mono">{user?.email}</p>
                  <p className={`${colors.text} text-xs mt-1 font-mono tracking-wider font-semibold`}>SESIÓN ACTIVA</p>
                </div>
              </div>
            </div>
            <div className="p-2">
              <button
                onClick={handleSignOut}
                className={`w-full p-3 bg-gradient-to-r ${colors.gradient} ${colors.hoverGradient} text-white rounded-lg font-medium transition-all duration-200 text-sm flex items-center justify-center space-x-2 hover:shadow-lg font-mono tracking-wider`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>CERRAR SESIÓN</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
